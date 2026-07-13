import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ServiceOrderService } from './service-order.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';

@ApiTags('ServiceOrder')
@ApiBearerAuth()
@Controller('service-order')
export class ServiceOrderController {
    constructor(private readonly serviceOrderService: ServiceOrderService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('Admin', 'Organizador')
    @ApiOperation({ summary: 'Crear una orden de servicio a un proveedor' })
    @ApiResponse({ status: 201, description: 'Orden creada exitosamente' })
    @ApiResponse({
        status: 400,
        description: 'El monto compromete más del presupuesto aprobado del evento',
    })
    @ApiResponse({ status: 404, description: 'El evento o el proveedor no existen' })
    create(@Body() createServiceOrderDto: CreateServiceOrderDto) {
        return this.serviceOrderService.create(createServiceOrderDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Listar todas las órdenes de servicio' })
    findAll() {
        return this.serviceOrderService.findAll();
    }

    @Get('event/:eventId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Listar órdenes de servicio de un evento' })
    findByEvent(@Param('eventId', ParseUUIDPipe) eventId: string) {
        return this.serviceOrderService.findByEvent(eventId);
    }

    @Get('provider/:providerId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Listar órdenes de servicio de un proveedor' })
    findByProvider(@Param('providerId', ParseUUIDPipe) providerId: string) {
        return this.serviceOrderService.findByProvider(providerId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Obtener una orden de servicio por id' })
    @ApiResponse({ status: 404, description: 'La orden no existe' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.serviceOrderService.findOne(id);
    }

    @Patch(':id/approve')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('Admin')
    @ApiOperation({ summary: 'Aprobar una orden de servicio' })
    @ApiResponse({ status: 400, description: 'La orden ya estaba aprobada' })
    approve(@Param('id', ParseUUIDPipe) id: string) {
        return this.serviceOrderService.approve(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('Admin', 'Organizador')
    @ApiOperation({ summary: 'Actualizar el monto de una orden de servicio' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateServiceOrderDto: UpdateServiceOrderDto,
    ) {
        return this.serviceOrderService.update(id, updateServiceOrderDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('Admin')
    @ApiOperation({ summary: 'Eliminar una orden de servicio sin pagos' })
    @ApiResponse({
        status: 400,
        description: 'La orden tiene pagos registrados y no puede eliminarse',
    })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.serviceOrderService.remove(id);
    }
}