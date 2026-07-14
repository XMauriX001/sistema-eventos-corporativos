import { IsNumber, IsPositive, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceOrderDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Evento al que pertenece la orden de servicio',
    })
    @IsUUID()
    eventId: string;

    @ApiProperty({
        example: '650e8400-e29b-41d4-a716-446655440000',
        description: 'Proveedor que ejecutará el servicio',
    })
    @IsUUID()
    providerId: string;

    @ApiProperty({ example: 5000.00, description: 'Monto cotizado por el proveedor' })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    amount: number;
}