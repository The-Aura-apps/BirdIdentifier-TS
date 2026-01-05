// core/configs/env.config.ts
import { plainToInstance } from 'class-transformer';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { validateSync } from 'class-validator';

class EnvVariables {
    @IsString()
    NODE_ENV: string;

    @IsNumber()
    PORT: number;

    @IsString()
    @IsOptional()
    PEXELS_API_KEY?: string;
}

export function validateEnv(config: Record<string, unknown>) {
    const validated = plainToInstance(EnvVariables, config, {
        enableImplicitConversion: true,
    });
    const errors = validateSync(validated, {
        skipMissingProperties: false,
    });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validated;
}
