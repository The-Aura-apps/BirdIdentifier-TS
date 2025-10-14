import { Module } from "@nestjs/common";
import { ApnsService } from "./apns.service";
import { NotificationService } from "./notifications.service";

@Module({
    providers: [ApnsService, NotificationService],
    exports: [NotificationService],
})
export class NotificationModule {}
