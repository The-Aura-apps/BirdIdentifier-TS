export abstract class BaseScraper {
    abstract name: string;
    abstract scrape(url: string);
}

export class OpenAiScraper extends BaseScraper {
    name: string = 'openai';
    scrape(url: string) {
        throw new Error('Method not implemented.');
    }
}
