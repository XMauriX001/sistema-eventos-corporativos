import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsPositive,
    IsUUID,
    IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType } from '../payment.entity';

export class CreatePaymentDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Orden de servicio que se está pagando',
    })
    @IsUUID()
    serviceOrderId: string;

    @ApiProperty({ example: 1500.75, description: 'Monto del pago' })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    amount: number;

    @ApiProperty({ enum: PaymentType, example: PaymentType.Parcial })
    @IsEnum(PaymentType, {
        message: `El tipo de pago debe ser: ${Object.values(PaymentType).join(' o ')}`,
    })
    type: PaymentType;

    @ApiPropertyOptional({
        example: '2026-07-11T10:30:00Z',
        description: 'Si no se envía, se usa la fecha actual',
    })
    @IsOptional()
    @IsDateString()
    paymentDate?: string;
}