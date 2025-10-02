import { Injectable } from '@nestjs/common';
import { ApnsService } from './apns.service';

@Injectable()
export class NotificationService {
    constructor(private readonly apnsService: ApnsService) { }

    async sendWelcomeReminder(deviceToken: string) {
        return this.apnsService.sendNotification(
            deviceToken,
            'Welcome to BirdApp! 🐦',
            'Come back tomorrow and explore more birds!',
        );
    }

    async sendUpdateNotification(deviceToken: string) {
        return this.apnsService.sendNotification(
            deviceToken,
            'Update Available 🦉',
            'We just added new features. Update your app now!',
        );
    }

    async sendInactivityReminder(deviceToken: string) {
        return this.apnsService.sendNotification(
            deviceToken,
            'We miss you 🕊️',
            'Come back and discover new birds!',
        );
    }

}
