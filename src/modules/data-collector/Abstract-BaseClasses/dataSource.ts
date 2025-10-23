import { HttpService } from "@nestjs/axios";
import { Logger } from "@nestjs/common";
import { firstValueFrom } from "rxjs";

/**
 * Abstract base class for all API data sources
 */
abstract class BirdDataSource<T> {
    protected readonly logger: Logger;

    constructor(
        protected readonly httpService: HttpService,
        protected readonly name: string,
        protected readonly baseUrl: string,
        protected readonly apiKey?: string,
    ) {
        this.logger = new Logger(`${name}DataSource`);
    }

    /**
     * Collect data from the API source
     */
    abstract collect(scientificName: string): Promise<T>;

    /**
     * Store collected data into database
     */
    abstract store(birdId: number, data: T): Promise<void>;

    /**
     * Get the source name
     */
    getName(): string {
        return this.name;
    }

    /**
     * Make HTTP GET request with proper typing
     */
    protected async get<R>(
        url: string,
        params?: Record<string, unknown>,
    ): Promise<R> {
        const { data } = await firstValueFrom(
            this.httpService.get<R>(url, { params }),
        );
        return data;
    }
}
