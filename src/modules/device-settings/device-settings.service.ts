import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceSettings } from './entities/device-settings.entity';
import { CreateDeviceSettingsDto } from './dto/create-device-settings.dto';
import { UpdateDeviceSettingsDto } from './dto/update-device-settings.dto';

@Injectable()
export class DeviceSettingsService {
  constructor(
    @InjectRepository(DeviceSettings)
    private readonly deviceSettingsRepository: Repository<DeviceSettings>,
  ) {}

  /**
   * Create or update device settings (upsert)
   * If deviceId exists, update it; otherwise create new
   */
  async upsert(
    createDeviceSettingsDto: CreateDeviceSettingsDto,
  ): Promise<DeviceSettings> {
    const existing = await this.deviceSettingsRepository.findOne({
      where: { deviceId: createDeviceSettingsDto.deviceId },
    });

    if (existing) {
      // Update existing settings
      await this.deviceSettingsRepository.update(existing.id, {
        identificationMethod: createDeviceSettingsDto.identificationMethod,
        userPurpose: createDeviceSettingsDto.userPurpose,
      });
      return this.findByDeviceId(createDeviceSettingsDto.deviceId);
    }

    // Create new settings
    const settings = this.deviceSettingsRepository.create(
      createDeviceSettingsDto,
    );
    return this.deviceSettingsRepository.save(settings);
  }

  /**
   * Find device settings by deviceId
   */
  async findByDeviceId(deviceId: string): Promise<DeviceSettings> {
    const settings = await this.deviceSettingsRepository.findOne({
      where: { deviceId },
    });

    if (!settings) {
      throw new NotFoundException(
        `Device settings for device ${deviceId} not found`,
      );
    }

    return settings;
  }

  /**
   * Update device settings
   */
  async update(
    deviceId: string,
    updateDeviceSettingsDto: UpdateDeviceSettingsDto,
  ): Promise<DeviceSettings> {
    const settings = await this.findByDeviceId(deviceId);

    await this.deviceSettingsRepository.update(settings.id, {
      ...updateDeviceSettingsDto,
    });

    return this.findByDeviceId(deviceId);
  }

  /**
   * Get all device settings (admin use)
   */
  async findAll(): Promise<DeviceSettings[]> {
    return this.deviceSettingsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Delete device settings
   */
  async remove(deviceId: string): Promise<void> {
    const settings = await this.findByDeviceId(deviceId);
    await this.deviceSettingsRepository.remove(settings);
  }
}
