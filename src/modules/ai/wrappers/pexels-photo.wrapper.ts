import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

export interface BirdPhoto {
    url: string;
    thumbnail: string;
    title: string;
    author: string;
    license: string;
    source: string;
}

interface PexelsPhotoSrc {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
}

interface PexelsPhoto {
    id: number;
    url: string;
    photographer: string;
    alt: string;
    src: PexelsPhotoSrc;
}

interface PexelsSearchResponse {
    photos: PexelsPhoto[];
}

@Injectable()
export class PexelsPhotoWrapper {
    private readonly logger = new Logger(PexelsPhotoWrapper.name);
    private readonly baseUrl = 'https://api.pexels.com/v1';
    private readonly apiKey: string;

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('PEXELS_API_KEY');
        if (!this.apiKey) {
            this.logger.warn('PEXELS_API_KEY not configured. Pexels photo fetching will be disabled.');
            this.logger.warn('Get your free API key at: https://www.pexels.com/api/');
        } else {
            this.logger.log('Pexels API initialized for bird photos');
        }
    }

    /**
     * Fetch bird photos from Pexels
     * @param scientificName Scientific name of the bird
     * @param commonName Common name (preferred for better results)
     * @returns Single high-quality bird photo or null
     */
    async fetchPhotos(
        scientificName: string,
        commonName?: string,
    ): Promise<BirdPhoto | null> {
        if (!this.apiKey) {
            this.logger.debug('Pexels API key not configured, skipping...');
            return null;
        }

        try {
            // Use common name if available (better results on Pexels)
            const searchQuery = commonName 
                ? `${commonName} bird` 
                : scientificName.split(' ')[0]; // Use genus name as fallback

            this.logger.log(
                `Fetching photo from Pexels for: ${searchQuery}`,
            );

            const response = await axios.get<PexelsSearchResponse>(`${this.baseUrl}/search`, {
                params: {
                    query: searchQuery,
                    per_page: 5,
                    orientation: 'landscape',
                },
                headers: {
                    'Authorization': this.apiKey,
                },
                timeout: 10000,
            });

            const photos = response.data?.photos;
            if (!photos || photos.length === 0) {
                this.logger.warn(`No photos found on Pexels for: ${searchQuery}`);
                return null;
            }

            // Pexels is a generic stock-photo site with no species taxonomy — it
            // returns its "closest" 5 results even when nothing relevant exists
            // (e.g. a synth or a pill bottle for an obscure bird name), so reject
            // results whose alt text doesn't actually mention a bird-related term.
            const relevantPhoto = photos.find((p) => this.looksLikeBirdPhoto(p.alt, commonName));
            if (!relevantPhoto) {
                this.logger.warn(
                    `Pexels results for "${searchQuery}" don't look bird-related, discarding`,
                );
                return null;
            }
            const photo = relevantPhoto;

            const birdPhoto: BirdPhoto = {
                url: photo.src.large2x || photo.src.large || photo.src.original,
                thumbnail: photo.src.medium || photo.src.small,
                title: photo.alt || `${commonName || scientificName}`,
                author: photo.photographer,
                license: 'Pexels License (Free for commercial use)',
                source: photo.url,
            };

            this.logger.log(`Found high-quality photo on Pexels for ${searchQuery}`);
            return birdPhoto;
        } catch (err) {
            if (err.response?.status === 401) {
                this.logger.error('Invalid Pexels API key. Please check your PEXELS_API_KEY configuration.');
            } else if (err.response?.status === 429) {
                this.logger.warn('Pexels API rate limit exceeded. Try again later.');
            } else {
                this.logger.error(
                    `Failed to fetch Pexels photos for ${scientificName}: ${err.message}`,
                );
            }
            return null;
        }
    }

    /**
     * Cheap relevance guard: Pexels' search is generic stock-photo keyword
     * matching, so a result is only trusted if its alt text mentions "bird"
     * or a word from the common name (e.g. "Wren", "Storm-Petrel").
     */
    private looksLikeBirdPhoto(alt: string | undefined, commonName?: string): boolean {
        const text = (alt || '').toLowerCase();
        if (!text) return false;
        if (text.includes('bird')) return true;

        const nameWords = (commonName || '')
            .toLowerCase()
            .split(/[^a-z]+/)
            .filter((w) => w.length > 3); // skip short filler words like "the", "of"

        return nameWords.some((w) => text.includes(w));
    }
}
