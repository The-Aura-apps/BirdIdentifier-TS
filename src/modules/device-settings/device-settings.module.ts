import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceSettingsService } from './device-settings.service';
import { DeviceSettingsController } from './device-settings.controller';
import { DeviceSettings } from './entities/device-settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceSettings])],
  controllers: [DeviceSettingsController],
  providers: [DeviceSettingsService],
  exports: [DeviceSettingsService],
})
export class DeviceSettingsModule {}
