import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications/notifications.gateway';

@Module({
  providers: [NotificationsGateway]
})
export class WebsocketModule {}
