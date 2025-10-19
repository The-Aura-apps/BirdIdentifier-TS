import { NormalizedBirdPayload } from './types';

// src/collectors/source-fetcher.interface.ts
export interface SourceFetcher {
    sourceName: string;
    fetchByScientificName(
        scientificName: string,
    ): Promise<NormalizedBirdPayload | null>;
}
