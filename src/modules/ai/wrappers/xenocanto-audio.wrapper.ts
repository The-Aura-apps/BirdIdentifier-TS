import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface BirdAudio {
    url: string;
    type: string; // e.g., 'call', 'song', 'alarm'
    quality: string; // A, B, C, D, E (A is best)
    recordist: string;
    country: string;
    location: string;
    date: string;
    source: string; // xeno-canto URL
}

@Injectable()
export class XenoCantoAudioWrapper {
    private readonly logger = new Logger(XenoCantoAudioWrapper.name);
    private readonly baseUrl = 'https://www.xeno-canto.org/api/2/recordings';

    constructor() {
        this.logger.log('xeno-canto API initialized for bird audio (no API key required)');
    }

    /**
     * Fetch bird audio recordings from xeno-canto
     * @param scientificName Scientific name of the bird
     * @param limit Number of audio files to fetch (min: 1, max: 5, default: 2)
     * @returns Array of bird audio recordings
     */
    async fetchAudio(
        scientificName: string,
        limit: number = 2,
    ): Promise<BirdAudio[]> {
        // Clamp limit between 1 and 5
        limit = Math.max(1, Math.min(5, limit));

        try {
            this.logger.log(`Fetching ${limit} audio recordings from xeno-canto for: ${scientificName}`);

            // Search for recordings
            // xeno-canto API format: /api/2/recordings?query=genus+species+q>C
            const query = `${scientificName.replace(' ', '+')}+q>C`; // Quality better than C
            
            const searchResponse = await axios.get(this.baseUrl, {
                params: {
                    query: query,
                },
                headers: {
                    'User-Agent': 'BirdIdentifierApp/1.0 (arshkazemi7l5o@gmail.com)',
                },
                timeout: 10000,
            });

            const data = searchResponse.data as any;
            
            // Log response for debugging
            this.logger.log(`xeno-canto API response: numRecordings=${data?.numRecordings}, numSpecies=${data?.numSpecies}`);
            
            const recordings = data?.recordings || [];

            if (recordings.length === 0) {
                this.logger.warn(`No audio recordings found on xeno-canto for: ${scientificName}`);
                return [];
            }

            const birdAudios: BirdAudio[] = [];

            // Process recordings
            for (let i = 0; i < Math.min(limit, recordings.length); i++) {
                const recording = recordings[i];

                // Build file URL
                const audioUrl = `https:${recording.file}`;

                birdAudios.push({
                    url: audioUrl,
                    type: recording.type || 'song',
                    quality: recording.q || 'C',
                    recordist: recording.rec || 'Unknown',
                    country: recording.cnt || 'Unknown',
                    location: recording.loc || 'Unknown',
                    date: recording.date || 'Unknown',
                    source: `https://xeno-canto.org/${recording.id}`,
                });

                this.logger.log(
                    `Fetched audio ${i + 1}/${limit}: ${recording.type} (quality: ${recording.q}) by ${recording.rec}`,
                );
            }

            this.logger.log(`Successfully fetched ${birdAudios.length} audio recordings for ${scientificName}`);
            return birdAudios;

        } catch (err) {
            this.logger.error(`Failed to fetch xeno-canto audio for ${scientificName}: ${err.message}`);
            return [];
        }
    }
}
