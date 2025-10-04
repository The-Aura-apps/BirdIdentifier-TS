import { Injectable, Logger } from '@nestjs/common';
import { IdentificationResult } from '../types';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import * as path from 'path';

@Injectable()
export class AudioAiWrapper {
  private readonly logger = new Logger(AudioAiWrapper.name);

  async identify(file: Buffer): Promise<IdentificationResult> {
    const inputDir = path.resolve('./tmp');
    const timestamp = Date.now();
    const inputFile = path.join(inputDir, `birdnet_input_${timestamp}.wav`);
    const outputFile = path.join(inputDir, `birdnet_output_${timestamp}.json`);

    try {
      // Create tmp directory if it doesn't exist
      await fs.mkdir(inputDir, { recursive: true });

      // Write audio buffer to file
      await fs.writeFile(inputFile, file);
      this.logger.log(`Audio file saved: ${inputFile}`);

      // Run Docker container
      const dockerCmd = [
        'run',
        '--rm',
        '-v',
        `${inputDir}:/workspace`,
        'birdnet',
        'python3',
        '-m',
        'birdnet_analyzer',
        '--i',
        `/workspace/birdnet_input_${timestamp}.wav`,
        '--o',
        `/workspace/birdnet_output_${timestamp}.json`,
        '--format',
        'json',
      ];

      this.logger.log('Running BirdNET analysis...');
      await this.runDocker(dockerCmd);

      // Read results
      const raw = await fs.readFile(outputFile, 'utf-8');
      const detections = JSON.parse(raw);

      if (!Array.isArray(detections) || detections.length === 0) {
        this.logger.warn('No birds detected in audio');
        return { scientificName: '', confidence: 0 };
      }

      // Get best detection
      const best = detections.sort((a, b) => b.confidence - a.confidence)[0];

      this.logger.log(
        `Identified: ${best.scientific_name} (${best.confidence})`,
      );

      return {
        scientificName: best.scientific_name ?? '',
        confidence: Number(best.confidence ?? 0),
      };
    } catch (error) {
      this.logger.error(`BirdNET analysis failed: ${error.message}`);
      return { scientificName: '', confidence: 0 };
    } finally {
      // Clean up files
      await this.cleanup(inputFile, outputFile);
    }
  }

  private runDocker(dockerCmd: string[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const proc = spawn('docker', dockerCmd, { stdio: 'inherit' });

      proc.on('error', (err) => {
        this.logger.error(`Docker spawn error: ${err.message}`);
        reject(err);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`BirdNET exited with code ${code}`));
        }
      });
    });
  }

  private async cleanup(...files: string[]): Promise<void> {
    for (const file of files) {
      try {
        await fs.unlink(file);
        this.logger.log(`Cleaned up: ${file}`);
      } catch (err) {
        // File might not exist, that's okay
        this.logger.warn(`Could not delete ${file}: ${err.message}`);
      }
    }
  }
}
