import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface BirdPhoto {
    url: string;
    thumbnail: string;
    title: string;
    author: string;
    license: string;
    source: string;
}

interface INaturalistTaxon {
    id: number;
    name: string;
    preferred_common_name?: string;
}

interface INaturalistTaxonResponse {
    results: INaturalistTaxon[];
}

interface INaturalistPhoto {
    url: string;
    license_code?: string;
}

interface INaturalistUser {
    login?: string;
    name?: string;
}

interface INaturalistObservation {
    id: number;
    photos: INaturalistPhoto[];
    user?: INaturalistUser;
    license_code?: string;
}

interface INaturalistObservationsResponse {
    results: INaturalistObservation[];
}

@Injectable()
export class INaturalistPhotoWrapper {
    private readonly logger = new Logger(INaturalistPhotoWrapper.name);
    private readonly baseUrl = 'https://api.inaturalist.org/v1';

    constructor() {
        this.logger.log('iNaturalist API initialized for bird photos (no API key required)');
    }

    /**
     * Fetch bird photos from iNaturalist
     * @param scientificName Scientific name of the bird
     * @param commonName Common name (optional)
     * @returns Single high-quality bird photo or null
     */
    async fetchPhotos(
        scientificName: string,
        commonName?: string,
    ): Promise<BirdPhoto | null> {
        try {
            this.logger.log(
                `Fetching photo from iNaturalist for: ${scientificName}`,
            );

            // First, search for the taxon (bird species)
            const taxonResponse = await axios.get<INaturalistTaxonResponse>(`${this.baseUrl}/taxa`, {
                params: {
                    q: scientificName,
                    rank: 'species',
                    iconic_taxa: 'Aves', // Birds only
                    per_page: 1,
                },
                timeout: 10000,
            });

            const taxon = taxonResponse.data?.results?.[0];
            if (!taxon) {
                this.logger.warn(`No taxon found for ${scientificName}`);
                return null;
            }

            const taxonId = taxon.id;
            this.logger.log(`Found taxon ID ${taxonId} for ${scientificName}`);

            // Fetch observations with photos for this species
            const observationsResponse = await axios.get<INaturalistObservationsResponse>(`${this.baseUrl}/observations`, {
                params: {
                    taxon_id: taxonId,
                    quality_grade: 'research', // High quality observations only
                    photos: true,
                    order: 'votes', // Most voted observations first
                    order_by: 'desc',
                    per_page: 10, // Get top 10 to pick best photo
                },
                timeout: 10000,
            });

            const observations = observationsResponse.data?.results;
            if (!observations || observations.length === 0) {
                this.logger.warn(`No observations found for taxon ${taxonId}`);
                return null;
            }

            // Find the best photo (highest quality, largest size)
            for (const obs of observations) {
                const photos = obs.photos;
                if (!photos || photos.length === 0) continue;

                // Get the first photo (usually the best one)
                const photo = photos[0];
                
                // Prefer large or original size
                const imageUrl = photo.url?.replace('square', 'large') || photo.url;
                const thumbnailUrl = photo.url?.replace('square', 'medium') || photo.url;

                if (!imageUrl) continue;

                // Get observer name and license
                const observer = obs.user?.login || obs.user?.name || 'Unknown';
                const license = this.mapLicense(photo.license_code || obs.license_code);

                const birdPhoto: BirdPhoto = {
                    url: imageUrl,
                    thumbnail: thumbnailUrl,
                    title: `${taxon.preferred_common_name || taxon.name} by ${observer}`,
                    author: observer,
                    license: license,
                    source: `https://www.inaturalist.org/observations/${obs.id}`,
                };

                this.logger.log(`Found high-quality photo for ${scientificName}`);
                return birdPhoto;
            }

            this.logger.warn(`No suitable photos found for ${scientificName}`);
            return null;
        } catch (err) {
            this.logger.error(
                `Failed to fetch iNaturalist photos for ${scientificName}: ${err.message}`,
            );
            return null;
        }
    }

    /**
     * Map iNaturalist license codes to readable names
     */
    private mapLicense(code: string): string {
        const licenseMap: Record<string, string> = {
            'cc-by': 'CC BY',
            'cc-by-nc': 'CC BY-NC',
            'cc-by-sa': 'CC BY-SA',
            'cc-by-nd': 'CC BY-ND',
            'cc-by-nc-sa': 'CC BY-NC-SA',
            'cc-by-nc-nd': 'CC BY-NC-ND',
            'cc0': 'CC0',
        };
        return licenseMap[code?.toLowerCase()] || code || 'All Rights Reserved';
    }
}
