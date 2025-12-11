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
     * @returns Single bird photo or null
     */
    async fetchPhotos(
        scientificName: string,
        commonName?: string,
    ): Promise<BirdPhoto | null> {
        try {
            // Search query: use scientific name for better accuracy
            const searchTerms = [scientificName, commonName ? `${commonName} bird` : null].filter(
                Boolean,
            );

            this.logger.log(
                `Fetching 1 photo from Wikimedia Commons for: ${scientificName}`,
            );

            // Try each search term until we get a photo
            for (const searchTerm of searchTerms) {
                try {
                    // Search for images
                    const searchResponse = await axios.get(this.baseUrl, {
                        params: {
                            action: 'query',
                            format: 'json',
                            generator: 'search',
                            gsrnamespace: 6, // File namespace
                            gsrsearch: searchTerm,
                            gsrlimit: 5, // Get few to pick the best one
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
                        const page = pages[pageId];
                        const imageInfo = page.imageinfo?.[0];

                        if (!imageInfo) continue;

                        // Skip non-image files
                        if (!imageInfo.url?.match(/\.(jpg|jpeg|png|webp)$/i)) continue;

                        // Get metadata
                        const metadata = imageInfo.extmetadata || {};
                        const artist = metadata.Artist?.value?.replace(/<[^>]*>/g, '') || 'Unknown';
                        const license =
                            metadata.LicenseShortName?.value ||
                            metadata.License?.value ||
                            'CC BY-SA';

                        const birdPhoto: BirdPhoto = {
                            url: imageInfo.url,
                            thumbnail: imageInfo.thumburl || imageInfo.url,
                            title: page.title?.replace('File:', '') || 'Untitled',
                            author: artist,
                            license: license,
                            source:
                                imageInfo.descriptionurl ||
                                `https://commons.wikimedia.org/wiki/${page.title}`,
                        };

                        this.logger.log(`Fetched photo: ${page.title}`);
                        return birdPhoto; // Return first valid photo
                    }
                } catch (err) {
                    this.logger.warn(
                        `Failed to search Wikimedia with term "${searchTerm}": ${err.message}`,
                    );
                    continue;
                }
            }

            this.logger.warn(`No photos found on Wikimedia Commons for: ${scientificName}`);
            return null;
        } catch (err) {
            this.logger.error(
                `Failed to fetch Wikimedia photos for ${scientificName}: ${err.message}`,
            );
            return null;
        }
    }
}
