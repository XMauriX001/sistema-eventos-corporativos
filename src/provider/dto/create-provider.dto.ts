import { IsEnum, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProviderCategory } from '../provider.entity';

export class CreateProviderDto {
    @ApiProperty({ example: 'Catering El Salvador S.A. de C.V.' })
    @IsString()
    @MaxLength(150)
    name: string;

    @ApiProperty({
        enum: ProviderCategory,
        example: ProviderCategory.Catering,
        description: 'Categoría del proveedor',
    })
    @IsEnum(ProviderCategory, {
        message: `La categoría debe ser una de: ${Object.values(ProviderCategory).join(', ')}`,
    })
    category: ProviderCategory;
    }