import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
export class FlickrPhotoWrapper {
    private readonly logger = new Logger(FlickrPhotoWrapper.name);
    private readonly apiKey: string;
    private readonly baseUrl = 'https://www.flickr.com/services/rest/';

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('FLICKR_API_KEY') || '';
        if (!this.apiKey) {
            this.logger.warn('FLICKR_API_KEY not set - photo fetching will be disabled');
        } else {
            this.logger.log('Flickr API initialized for bird photos');
        }
    }

    /**
     * Fetch bird photos from Flickr
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
        if (!this.apiKey) {
            this.logger.warn('Flickr API key not configured, skipping photo fetch');
            return [];
        }

        try {
            // Search query: prefer scientific name + "bird" for better results
            const searchText = commonName 
                ? `${commonName} bird ${scientificName}` 
                : `${scientificName} bird`;

            this.logger.log(`Fetching ${limit} photos for: ${searchText}`);

            // Search for photos
            const searchResponse = await axios.get(this.baseUrl, {
                params: {
                    method: 'flickr.photos.search',
                    api_key: this.apiKey,
                    text: searchText,
                    sort: 'relevance',
                    per_page: limit * 2, // Fetch extra to filter
                    page: 1,
                    format: 'json',
                    nojsoncallback: 1,
                    content_type: 1, // Photos only
                    media: 'photos',
                    safe_search: 1, // Safe content
                    // Only Creative Commons licensed photos
                    license: '4,5,6,7,8,9,10', // CC licenses
                },
                timeout: 10000,
            });

            const photos = searchResponse.data?.photos?.photo || [];
            
            if (photos.length === 0) {
                this.logger.warn(`No photos found for: ${searchText}`);
                return [];
            }

            // Get photo URLs and info
            const birdPhotos: BirdPhoto[] = [];
            
            for (let i = 0; i < Math.min(limit, photos.length); i++) {
                const photo = photos[i];
                
                try {
                    // Get photo info for license and author
                    const infoResponse = await axios.get(this.baseUrl, {
                        params: {
                            method: 'flickr.photos.getInfo',
                            api_key: this.apiKey,
                            photo_id: photo.id,
                            format: 'json',
                            nojsoncallback: 1,
                        },
                        timeout: 5000,
                    });

                    const photoInfo = infoResponse.data?.photo;
                    
                    if (!photoInfo) continue;

                    // Construct URLs
                    const photoUrl = `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_b.jpg`;
                    const thumbnailUrl = `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_m.jpg`;

                    birdPhotos.push({
                        url: photoUrl,
                        thumbnail: thumbnailUrl,
                        title: photoInfo.title?._content || photo.title || 'Untitled',
                        author: photoInfo.owner?.realname || photoInfo.owner?.username || 'Unknown',
                        license: this.getLicenseName(photoInfo.license),
                        source: `https://www.flickr.com/photos/${photoInfo.owner?.nsid}/${photo.id}`,
                    });

                    this.logger.log(`Fetched photo ${i + 1}/${limit}: ${photoInfo.title?._content || 'Untitled'}`);
                } catch (err) {
                    this.logger.warn(`Failed to fetch info for photo ${photo.id}: ${err.message}`);
                    continue;
                }
            }

            this.logger.log(`Successfully fetched ${birdPhotos.length} photos for ${scientificName}`);
            return birdPhotos;

        } catch (err) {
            this.logger.error(`Failed to fetch Flickr photos for ${scientificName}: ${err.message}`);
            return [];
        }
    }

    /**
     * Get license name from Flickr license ID
     */
    private getLicenseName(licenseId: string): string {
        const licenses: Record<string, string> = {
            '0': 'All Rights Reserved',
            '1': 'CC BY-NC-SA 2.0',
            '2': 'CC BY-NC 2.0',
            '3': 'CC BY-NC-ND 2.0',
            '4': 'CC BY 2.0',
            '5': 'CC BY-SA 2.0',
            '6': 'CC BY-ND 2.0',
            '7': 'No known copyright',
            '8': 'US Government Work',
            '9': 'CC0 1.0',
            '10': 'PDM 1.0',
        };
        return licenses[licenseId] || 'Unknown License';
    }
}
