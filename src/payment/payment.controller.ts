import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    } from '@nestjs/swagger';

    @ApiTags('Payment')
    @ApiBearerAuth()
    @Controller('payment')
    export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('Admin')
    @ApiOperation({
        summary: 'Registrar un pago parcial o final a una orden de servicio',
    })
    @ApiResponse({ status: 201, description: 'Pago registrado exitosamente' })
    @ApiResponse({
        status: 400,
        description:
        'El pago excede el presupuesto del evento, excede el saldo de la orden, o el proveedor tiene órdenes pendientes de aprobación',
    })
    @ApiResponse({ status: 404, description: 'La orden de servicio no existe' })
    create(@Body() createPaymentDto: CreatePaymentDto) {
        return this.paymentService.create(createPaymentDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Listar todos los pagos registrados' })
    findAll() {
        return this.paymentService.findAll();
    }

    @Get('provider/:providerId/balance')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('Admin', 'Organizador')
    @ApiOperation({ summary: 'Saldo pendiente de un proveedor' })
    @ApiResponse({ status: 404, description: 'El proveedor no existe' })
    getProviderBalance(@Param('providerId', ParseUUIDPipe) providerId: string) {
        return this.paymentService.getProviderBalance(providerId);
    }

    @Get('reconciliation/:eventId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('Admin', 'Organizador')
    @ApiOperation({
        summary:
        'Conciliación financiera del evento: presupuesto vs gasto real con varianza por categoría de proveedor',
    })
    @ApiResponse({ status: 404, description: 'El evento no existe' })
    getEventReconciliation(@Param('eventId', ParseUUIDPipe) eventId: string) {
        return this.paymentService.getEventReconciliation(eventId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Obtener un pago por su id' })
    @ApiResponse({ status: 404, description: 'El pago no existe' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.paymentService.findOne(id);
    }
}