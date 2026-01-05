import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { DeviceSettingsService } from './device-settings.service';
import { CreateDeviceSettingsDto } from './dto/create-device-settings.dto';
import { UpdateDeviceSettingsDto } from './dto/update-device-settings.dto';
import { DeviceSettings } from './entities/device-settings.entity';

@ApiTags('Device Settings')
@Controller('device-settings')
export class DeviceSettingsController {
    constructor(private readonly deviceSettingsService: DeviceSettingsService) {}

    @Post()
    @ApiOperation({
        summary: 'Create or update device settings',
        description:
            'Save onboarding preferences for a device. If deviceId already exists, it will be updated.',
    })
    @ApiBody({ type: CreateDeviceSettingsDto })
    @ApiResponse({
        status: 201,
        description: 'Device settings created or updated successfully',
        type: DeviceSettings,
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid input data',
    })
    async upsert(
        @Body() createDeviceSettingsDto: CreateDeviceSettingsDto,
    ): Promise<DeviceSettings> {
        return this.deviceSettingsService.upsert(createDeviceSettingsDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Get all device settings',
    })
    @ApiResponse({
        status: 200,
        description: 'List of all device settings',
        type: [DeviceSettings],
    })
    async findAll(): Promise<DeviceSettings[]> {
        return this.deviceSettingsService.findAll();
    }

    @Get(':deviceId')
    @ApiOperation({
        summary: 'Get device settings by deviceId',
        description: 'Retrieve settings for a specific device',
    })
    @ApiParam({
        name: 'deviceId',
        description: 'Unique device identifier',
        example: 'abc123-device-uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Device settings found',
        type: DeviceSettings,
    })
    @ApiResponse({
        status: 404,
        description: 'Device settings not found',
    })
    async findByDeviceId(@Param('deviceId') deviceId: string): Promise<DeviceSettings> {
        return this.deviceSettingsService.findByDeviceId(deviceId);
    }

    @Put(':deviceId')
    @ApiOperation({
        summary: 'Update device settings',
        description: 'Update specific fields of device settings',
    })
    @ApiParam({
        name: 'deviceId',
        description: 'Unique device identifier',
        example: 'abc123-device-uuid',
    })
    @ApiBody({ type: UpdateDeviceSettingsDto })
    @ApiResponse({
        status: 200,
        description: 'Device settings updated successfully',
        type: DeviceSettings,
    })
    @ApiResponse({
        status: 404,
        description: 'Device settings not found',
    })
    async update(
        @Param('deviceId') deviceId: string,
        @Body() updateDeviceSettingsDto: UpdateDeviceSettingsDto,
    ): Promise<DeviceSettings> {
        return this.deviceSettingsService.update(deviceId, updateDeviceSettingsDto);
    }

    @Delete(':deviceId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete device settings',
        description: 'Remove settings for a specific device',
    })
    @ApiParam({
        name: 'deviceId',
        description: 'Unique device identifier',
        example: 'abc123-device-uuid',
    })
    @ApiResponse({
        status: 204,
        description: 'Device settings deleted successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Device settings not found',
    })
    async remove(@Param('deviceId') deviceId: string): Promise<void> {
        return this.deviceSettingsService.remove(deviceId);
    }
}