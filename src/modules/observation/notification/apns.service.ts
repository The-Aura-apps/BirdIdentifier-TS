import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as apn from 'apn';

@Injectable()
export class ApnsService {
    private readonly logger = new Logger(ApnsService.name);
    private readonly apnProvider: apn.Provider | null = null;
    private readonly bundleId: string | undefined;

    constructor(private readonly configService: ConfigService) {
        const keyPath = this.configService.get<string>('APNS_KEY_PATH');
        const keyId = this.configService.get<string>('APNS_KEY_ID');
        const teamId = this.configService.get<string>('APNS_TEAM_ID');
        this.bundleId = this.configService.get<string>('APNS_BUNDLE_ID');

        if (!keyPath || !keyId || !teamId || !this.bundleId) {
            // Push notifications are optional: don't crash app boot just because
            // APNs credentials haven't been set up yet.
            this.logger.warn(
                'APNs not configured (APNS_KEY_PATH/APNS_KEY_ID/APNS_TEAM_ID/APNS_BUNDLE_ID missing) — push notifications disabled',
            );
            return;
        }

        this.apnProvider = new apn.Provider({
            token: { key: keyPath, keyId, teamId },
            production: this.configService.get<string>('NODE_ENV') === 'production',
        });
    }

    async sendNotification(deviceToken: string, title: string, body: string) {
        if (!this.apnProvider) {
            throw new Error(
                'APNs is not configured — set APNS_KEY_PATH, APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID',
            );
        }

        const note = new apn.Notification();

        note.topic = this.bundleId!;
        note.alert = {
            title,
            body,
        };
        note.sound = 'default';
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
