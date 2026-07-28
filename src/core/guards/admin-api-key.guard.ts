import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * Gates mutating requests (anything but GET) behind a shared admin key sent
 * in the `x-admin-key` header. Reads stay public. Fails closed: if
 * ADMIN_API_KEY isn't configured, writes are blocked entirely rather than
 * silently left open.
 */
@Injectable()
export class AdminApiKeyGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();

        if (request.method === 'GET') {
            return true;
        }

        const adminKey = this.configService.get<string>('ADMIN_API_KEY');
        if (!adminKey) {
            throw new UnauthorizedException('Admin API key is not configured on the server');
        }

        if (request.header('x-admin-key') !== adminKey) {
            throw new UnauthorizedException('Invalid or missing admin API key');
        }

        return true;
    }
}
