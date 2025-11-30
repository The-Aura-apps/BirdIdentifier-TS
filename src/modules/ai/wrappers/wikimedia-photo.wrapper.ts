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

@Injectable()
export class WikimediaPhotoWrapper {
    private readonly logger = new Logger(WikimediaPhotoWrapper.name);
    private readonly baseUrl = 'https://commons.wikimedia.org/w/api.php';

    constructor() {
        this.logger.log('Wikimedia Commons API initialized for bird photos (no API key required)');
    }

    /**
     * Fetch bird photos from Wikimedia Commons
     * @param scientificName Scientific name of the bird
     * @param commonName Common name (optional, improves results)
     * @param limit Number of photos to fetch (default: 3)
     * @returns Array of bird photos
     */
    async fetchPhotos(
        scientificName: string,
        commonName?: string,
        limit: number = 3,
    ): Promise<BirdPhoto[]> {
        try {
            // Search query: use scientific name for better accuracy
            const searchTerms = [
                scientificName,
                commonName ? `${commonName} bird` : null,
            ].filter(Boolean);

            this.logger.log(`Fetching ${limit} photos from Wikimedia Commons for: ${scientificName}`);

            const birdPhotos: BirdPhoto[] = [];

            // Try each search term until we get enough photos
            for (const searchTerm of searchTerms) {
                if (birdPhotos.length >= limit) break;

                try {
                    // Search for images
                    const searchResponse = await axios.get(this.baseUrl, {
                        params: {
                            action: 'query',
                            format: 'json',
                            generator: 'search',
                            gsrnamespace: 6, // File namespace
                            gsrsearch: searchTerm,
                            gsrlimit: limit * 2, // Get extra to filter
                            prop: 'imageinfo',
                            iiprop: 'url|extmetadata|size',
                            iiurlwidth: 800, // Medium size
                            iiurlheight: 600,
                        },
                        headers: {
                            'User-Agent': 'BirdIdentifierApp/1.0 (arshkazemi7l5o@gmail.com)',
                        },
                        timeout: 10000,
                    });

                    const pages = (searchResponse.data as any)?.query?.pages;
                    if (!pages) continue;

                    // Process each image
                    for (const pageId of Object.keys(pages)) {
                        if (birdPhotos.length >= limit) break;

                        const page = pages[pageId];
                        const imageInfo = page.imageinfo?.[0];

                        if (!imageInfo) continue;

                        // Skip non-image files
                        if (!imageInfo.url?.match(/\.(jpg|jpeg|png|webp)$/i)) continue;

                        // Get metadata
                        const metadata = imageInfo.extmetadata || {};
                        const artist = metadata.Artist?.value?.replace(/<[^>]*>/g, '') || 'Unknown';
                        const license = metadata.LicenseShortName?.value || 
                                      metadata.License?.value || 
                                      'CC BY-SA';

                        birdPhotos.push({
                            url: imageInfo.url,
                            thumbnail: imageInfo.thumburl || imageInfo.url,
                            title: page.title?.replace('File:', '') || 'Untitled',
                            author: artist,
                            license: license,
                            source: imageInfo.descriptionurl || `https://commons.wikimedia.org/wiki/${page.title}`,
                        });

                        this.logger.log(`Fetched photo ${birdPhotos.length}/${limit}: ${page.title}`);
                    }
                } catch (err) {
                    this.logger.warn(`Failed to search Wikimedia with term "${searchTerm}": ${err.message}`);
                    continue;
                }
            }

            if (birdPhotos.length === 0) {
                this.logger.warn(`No photos found on Wikimedia Commons for: ${scientificName}`);
            } else {
                this.logger.log(`Successfully fetched ${birdPhotos.length} photos for ${scientificName}`);
            }

            return birdPhotos;

        } catch (err) {
            this.logger.error(`Failed to fetch Wikimedia photos for ${scientificName}: ${err.message}`);
            return [];
        }
    }
}
