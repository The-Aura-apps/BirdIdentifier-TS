/**
 * Bulk-import birds from a CSV/XLSX/TXT list of names into the database.
 *
 * For each name it:
 *   1. Resolves it against the Clements catalog (fuzzy match on english/scientific name).
 *   2. Calls BirdsService.findOrCreate(scientificName), which reuses an existing DB
 *      row untouched (no AI call) or creates+enriches a new one via BirdInfoWrapper
 *      (OpenAI) + photo wrappers — the exact same path the app uses today.
 *
 * Usage:
 *   npm run import:birds -- --file=./birds.xlsx [--concurrency=3] [--delay=300] [--dry-run]
 *
 * The input file can be:
 *   - A .xlsx/.csv with a header containing a "name"/"scientificName"/"englishName"/
 *     "common name"/"species" column (first sheet is used for .xlsx)
 *   - A .xlsx/.csv with no recognizable header (first column is used)
 *   - A .txt file with one bird name per line
 *
 * Progress is streamed to stdout and appended to
 * logs/bird-import-<timestamp>.csv (inputName, resolvedScientificName, status, birdId, error)
 * so an interrupted run can be inspected; already-imported birds are skipped
 * automatically on re-run since findOrCreate() reuses existing rows.
 */
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { BirdsService } from '../bird/birds/birds.service';

interface ImportResult {
    inputName: string;
    resolvedScientificName: string | null;
    status: 'created' | 'existing' | 'unresolved' | 'dry-run' | 'failed';
    birdId?: number;
    error?: string;
}

function parseArgs(argv: string[]) {
    const args: Record<string, string | boolean> = {};
    for (const raw of argv) {
        if (!raw.startsWith('--')) {
            args.file = args.file ?? raw;
            continue;
        }
        const [key, value] = raw.slice(2).split('=');
        args[key] = value ?? true;
    }
    return args;
}

/** Minimal quote-aware CSV line splitter (handles "a,b" and "" escaping). */
function splitCsvLine(line: string): string[] {
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inQuotes) {
            if (c === '"' && line[i + 1] === '"') {
                cur += '"';
                i++;
            } else if (c === '"') {
                inQuotes = false;
            } else {
                cur += c;
            }
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === ',') {
            cells.push(cur);
            cur = '';
        } else {
            cur += c;
        }
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
}

const CANDIDATE_COLUMNS = ['name', 'scientificname', 'englishname', 'common name', 'commonname', 'species', 'bird name'];

function pickNameColumn(rows: string[][]): string[] {
    if (rows.length === 0) {
        return [];
    }

    const header = rows[0].map((h) => (h ?? '').toString().trim().toLowerCase());
    const nameColIndex = header.findIndex((h) => CANDIDATE_COLUMNS.includes(h));

    if (nameColIndex === -1) {
        // No recognizable header — treat every row (including the first) as data,
        // using the first column.
        return rows.map((r) => (r[0] ?? '').toString().trim()).filter(Boolean);
    }

    return rows
        .slice(1)
        .map((r) => (r[nameColIndex] ?? '').toString().trim())
        .filter(Boolean);
}

function readNamesFromFile(filePath: string): string[] {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.xlsx' || ext === '.xls') {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        return pickNameColumn(rows.filter((r) => r.some((c) => String(c).trim())));
    }

    const raw = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
    const lines = raw.split('\n').filter((l) => l.trim().length > 0);

    if (lines.length === 0) {
        return [];
    }

    if (ext !== '.csv') {
        return lines.map((l) => l.trim());
    }

    return pickNameColumn(lines.map(splitCsvLine));
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Simple fixed-size concurrency pool. */
async function runWithConcurrency<T>(
    items: T[],
    concurrency: number,
    worker: (item: T, index: number) => Promise<void>,
) {
    let cursor = 0;
    const runners = Array.from({ length: concurrency }, async () => {
        while (cursor < items.length) {
            const index = cursor++;
            await worker(items[index], index);
        }
    });
    await Promise.all(runners);
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const filePath = args.file as string | undefined;
    if (!filePath) {
        console.error('Usage: npm run import:birds -- --file=./birds.csv [--concurrency=3] [--delay=300] [--dry-run]');
        process.exit(1);
    }

    const resolvedPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolvedPath)) {
        console.error(`File not found: ${resolvedPath}`);
        process.exit(1);
    }

    const concurrency = Number(args.concurrency ?? 3) || 3;
    const delayMs = Number(args.delay ?? 300) || 0;
    const dryRun = Boolean(args['dry-run']);

    const rawNames = readNamesFromFile(resolvedPath);
    const names = Array.from(new Set(rawNames.map((n) => n.trim()).filter(Boolean)));

    console.log(`Loaded ${rawNames.length} rows, ${names.length} unique names from ${resolvedPath}`);
    if (names.length === 0) {
        console.error('No names found in file — check the file format/column name.');
        process.exit(1);
    }

    const logsDir = path.join(__dirname, '..', '..', '..', 'logs');
    fs.mkdirSync(logsDir, { recursive: true });
    const logPath = path.join(logsDir, `bird-import-${Date.now()}.csv`);
    fs.writeFileSync(logPath, 'inputName,resolvedScientificName,status,birdId,error\n');

    const appendLog = (r: ImportResult) => {
        const line = [
            r.inputName,
            r.resolvedScientificName ?? '',
            r.status,
            r.birdId ?? '',
            (r.error ?? '').replace(/[\n,]/g, ' '),
        ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',');
        fs.appendFileSync(logPath, line + '\n');
    };

    console.log(`Bootstrapping Nest application context...`);
    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn'],
    });
    const birdsService = app.get(BirdsService);

    const counts = { created: 0, existing: 0, unresolved: 0, 'dry-run': 0, failed: 0 };
    let processed = 0;

    await runWithConcurrency(names, concurrency, async (name) => {
        let result: ImportResult;
        try {
            const suggestions = birdsService.searchCatalog(name);
            const match = suggestions[0];

            if (!match) {
                result = { inputName: name, resolvedScientificName: null, status: 'unresolved' };
            } else if (dryRun) {
                console.log(`[dry-run] "${name}" -> "${match.scientificName}" (${match.englishName})`);
                result = {
                    inputName: name,
                    resolvedScientificName: match.scientificName,
                    status: 'dry-run',
                };
            } else {
                const before = Date.now();
                const bird = await birdsService.findOrCreate(match.scientificName);
                const tookMs = Date.now() - before;
                const wasExisting = tookMs < 500; // findOrCreate returns near-instantly on a DB hit, seconds on an AI-enriched create
                result = {
                    inputName: name,
                    resolvedScientificName: match.scientificName,
                    status: wasExisting ? 'existing' : 'created',
                    birdId: bird.id,
                };
                console.log(
                    `[${result.status}] "${name}" -> "${match.scientificName}" (id ${bird.id}, ${tookMs}ms)`,
                );
                if (!wasExisting && delayMs > 0) {
                    await sleep(delayMs);
                }
            }
        } catch (err) {
            const error = err as Error;
            result = {
                inputName: name,
                resolvedScientificName: null,
                status: 'failed',
                error: error.message,
            };
            console.error(`[failed] "${name}": ${error.message}`);
        }

        counts[result.status]++;
        processed++;
        appendLog(result);
        if (processed % 25 === 0) {
            console.log(`--- progress: ${processed}/${names.length} ---`);
        }
    });

    console.log('\nDone.');
    console.log(counts);
    console.log(`Full log written to: ${logPath}`);

    await app.close();
    process.exit(counts.failed > 0 ? 1 : 0);
}

void main();
