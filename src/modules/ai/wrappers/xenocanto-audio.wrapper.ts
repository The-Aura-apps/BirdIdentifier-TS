import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

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
    private apiKey: string | undefined;

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('XENOCANTO_API_KEY');
        
        if (this.apiKey) {
            this.logger.log('XenoCanto API initialized with API key');
        } else {
            this.logger.warn('XenoCanto API key not found - using public endpoint (may have limitations)');
        }
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

            // Try multiple strategies to find recordings
            let recordings: any[] = [];
            const attempts = [
                { query: `${scientificName.replace(/ /g, '+')}`, label: 'exact name' },
                { query: `gen:${scientificName.split(' ')[0]}`, label: 'genus only' },
            ];

            for (const attempt of attempts) {
                try {
                    this.logger.debug(`XenoCanto attempt: ${attempt.label} - ${this.baseUrl}?query=${attempt.query}`);
                    
                    const params: any = { query: attempt.query };
                    
                    // Add API key if available (for v3, but v2 doesn't need it)
                    if (this.apiKey) {
                        params.key = this.apiKey;
                    }
                    
                    const searchResponse = await axios.get(this.baseUrl, {
                        params,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (BirdIdentifierApp/1.0)',
                            'Accept': 'application/json',
                        },
                        timeout: 20000,
                        validateStatus: (status) => status < 500,
                    });

                    this.logger.debug(`XenoCanto status: ${searchResponse.status}`);

                    // Check for errors
                    if (searchResponse.status === 401 || searchResponse.status === 403) {
                        this.logger.error(`XenoCanto API authentication failed (${searchResponse.status})`);
                        
                        const errorData = searchResponse.data as any;
                        if (errorData?.message) {
                            this.logger.error(`XenoCanto message: ${errorData.message}`);
                        }
                        
                        // If auth failed, log instructions
                        if (!this.apiKey) {
                            this.logger.warn('XenoCanto may now require API key. Get one at: https://xeno-canto.org/account');
                            this.logger.warn('Then add to .env: XENOCANTO_API_KEY=your_key_here');
                        }
                        
                        continue;
                    }

                    if (searchResponse.status === 404) {
                        this.logger.debug(`XenoCanto: 404 for ${attempt.label}`);
                        continue;
                    }

                    if (searchResponse.status !== 200) {
                        this.logger.warn(`XenoCanto returned status ${searchResponse.status}`);
                        
                        const errorData = searchResponse.data as any;
                        if (errorData?.error) {
                            this.logger.error(`XenoCanto error: ${errorData.error} - ${errorData.message}`);
                        }
                        
                        continue;
                    }

                    const data = searchResponse.data as any;
                    recordings = data?.recordings || [];

                    this.logger.log(
                        `XenoCanto (${attempt.label}): ${recordings.length} recordings found (numRecordings=${data?.numRecordings || 0})`,
                    );

                    if (recordings.length > 0) {
                        // Filter by quality if we have many recordings
                        if (recordings.length > limit * 2) {
                            const goodQuality = recordings.filter((r: any) => 
                                ['A', 'B', 'C'].includes(r.q)
                            );
                            if (goodQuality.length > 0) {
                                recordings = goodQuality;
                                this.logger.log(`Filtered to ${recordings.length} good quality recordings`);
                            }
                        }
                        
                        break; // Success!
                    }
                } catch (err: any) {
                    this.logger.debug(`XenoCanto attempt failed (${attempt.label}): ${err.message}`);
                    
                    if (err.response?.data) {
                        this.logger.debug(`Response: ${JSON.stringify(err.response.data)}`);
                    }
                    
                    continue;
                }
            }

            if (recordings.length === 0) {
                this.logger.warn(`No audio recordings found on xeno-canto for: ${scientificName}`);
                this.logger.warn('XenoCanto API may have changed. Check: https://xeno-canto.org/explore/api');
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
            const error = err as any;
            
            // Log detailed error information
            if (error.response) {
                this.logger.error(
                    `XenoCanto API error: Status ${error.response.status} - ${error.response.statusText}`,
                );
                this.logger.debug(`Response data: ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                this.logger.error(`XenoCanto API: No response received - ${error.message}`);
            } else {
                this.logger.error(`XenoCanto API error: ${error.message}`);
            }
            
            return [];
        }
    }
}
