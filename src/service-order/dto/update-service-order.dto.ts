import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateServiceOrderDto } from './create-service-order.dto';

// No se permite reasignar el evento ni el proveedor de una orden ya creada.
export class UpdateServiceOrderDto extends PartialType(
    OmitType(CreateServiceOrderDto, ['eventId', 'providerId'] as const),
) {}