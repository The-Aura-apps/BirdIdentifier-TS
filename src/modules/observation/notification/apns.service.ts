import { Injectable, Logger } from '@nestjs/common';
import * as apn from 'apn';

@Injectable()
export class ApnsService {
    private readonly logger = new Logger(ApnsService.name);
    private readonly apnProvider: apn.Provider;

    constructor() {
        this.apnProvider = new apn.Provider({
            token: {
                key: process.env.APNS_KEY_PATH!,
                keyId: process.env.APNS_KEY_ID!,
                teamId: process.env.APNS_TEAM_ID!,
            },
            production: true, // set true in production
        });
    }

    async sendNotification(deviceToken: string, title: string, body: string) {
        const note = new apn.Notification();

        note.topic = process.env.APNS_BUNDLE_ID!;
        note.alert = {
            title,
            body,
        };
        note.sound = 'defulte';
        note.badge = 1;

        try {
            const result = await this.apnProvider.send(note, deviceToken);
            this.logger.log(`APNs response: ${JSON.stringify(result)}`);
            return result;
        } catch (error) {
            this.logger.error(`APNs error: ${error.message}`);
            throw error;
        }
    }
}
