import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BirdsModule } from './birds/birds.module';
import { ObservationsModule } from './observations/observations.module';
import { AiModule } from './ai/ai.module';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { UploadsModule } from './uploads/uploads.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [BirdsModule, ObservationsModule, AiModule, DatabaseModule, CommonModule, UploadsModule, NotificationModule, ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
