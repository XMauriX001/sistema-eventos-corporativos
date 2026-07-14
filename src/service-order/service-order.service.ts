import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOrder, ServiceOrderStatus } from './service-order.entity';
import { Event } from '../event/event.entity';
import { Provider } from '../provider/provider.entity';
import { Payment } from '../payment/payment.entity';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';

@Injectable()
export class ServiceOrderService {
    constructor(
        @InjectRepository(ServiceOrder)
        private readonly serviceOrderRepository: Repository<ServiceOrder>,
        @InjectRepository(Event)
        private readonly eventRepository: Repository<Event>,
        @InjectRepository(Provider)
        private readonly providerRepository: Repository<Provider>,
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
    ) {}

    async create(
        createServiceOrderDto: CreateServiceOrderDto,
    ): Promise<ServiceOrder> {
        const { eventId, providerId, amount } = createServiceOrderDto;

        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        if (!event) {
        throw new NotFoundException(`El evento con id ${eventId} no existe`);
        }

        const provider = await this.providerRepository.findOne({
        where: { id: providerId },
        });
        if (!provider) {
        throw new NotFoundException(
            `El proveedor con id ${providerId} no existe`,
        );
        }

        // Validación de presupuesto: la suma de órdenes de un evento no debería
        // superar el presupuesto aprobado; si esta orden lo hace, avisamos.
        const approvedBudget = Number(event.approvedBudget);
        const currentCommitted = await this.getTotalCommittedByEvent(eventId);
        const projected = currentCommitted + amount;

        if (projected > approvedBudget) {
        throw new BadRequestException(
            `La orden compromete ${projected} pero el presupuesto aprobado del evento es ${approvedBudget}`,
        );
        }

        const serviceOrder = this.serviceOrderRepository.create({
        amount,
        event,
        provider,
        status: ServiceOrderStatus.Pendiente,
        });

        return await this.serviceOrderRepository.save(serviceOrder);
    }

    async findAll(): Promise<ServiceOrder[]> {
        return this.serviceOrderRepository.find({
        relations: { event: true, provider: true },
        });
    }

    async findOne(id: string): Promise<ServiceOrder> {
        const serviceOrder = await this.serviceOrderRepository.findOne({
        where: { id },
        relations: { event: true, provider: true, payments: true },
        });

        if (!serviceOrder) {
        throw new NotFoundException(`La orden de servicio con id ${id} no existe`);
        }
        return serviceOrder;
    }

    async findByEvent(eventId: string): Promise<ServiceOrder[]> {
        return this.serviceOrderRepository.find({
        where: { event: { id: eventId } },
        relations: { provider: true },
        });
    }

    async findByProvider(providerId: string): Promise<ServiceOrder[]> {
        return this.serviceOrderRepository.find({
        where: { provider: { id: providerId } },
        relations: { event: true },
        });
    }

    async update(
        id: string,
        updateServiceOrderDto: UpdateServiceOrderDto,
    ): Promise<ServiceOrder> {
        const serviceOrder = await this.findOne(id);

        // Si se cambia el monto, no puede quedar por debajo de lo ya pagado.
        if (
        updateServiceOrderDto.amount !== undefined &&
        updateServiceOrderDto.amount !== Number(serviceOrder.amount)
        ) {
        const totalPaid = await this.getTotalPaidByServiceOrder(id);
        if (updateServiceOrderDto.amount < totalPaid) {
            throw new BadRequestException(
            `El nuevo monto (${updateServiceOrderDto.amount}) no puede ser menor a lo ya pagado (${totalPaid})`,
            );
        }
        }

        const updated = Object.assign(serviceOrder, updateServiceOrderDto);
        return await this.serviceOrderRepository.save(updated);
    }

    // Aprobación es una transición explícita, no un update libre.
    async approve(id: string): Promise<ServiceOrder> {
        const serviceOrder = await this.findOne(id);

        if (serviceOrder.status === ServiceOrderStatus.Aprobada) {
        throw new BadRequestException('La orden de servicio ya estaba aprobada');
        }

        serviceOrder.status = ServiceOrderStatus.Aprobada;
        return await this.serviceOrderRepository.save(serviceOrder);
    }

    async remove(id: string): Promise<void> {
        const serviceOrder = await this.findOne(id);

        // No se puede borrar una orden con pagos registrados: rompería el historial.
        const totalPaid = await this.getTotalPaidByServiceOrder(id);
        if (totalPaid > 0) {
        throw new BadRequestException(
            `No se puede eliminar la orden porque ya tiene pagos registrados (${totalPaid})`,
        );
        }

        await this.serviceOrderRepository.remove(serviceOrder);
    }

    private async getTotalCommittedByEvent(eventId: string): Promise<number> {
        const raw = await this.serviceOrderRepository
        .createQueryBuilder('serviceOrder')
        .innerJoin('serviceOrder.event', 'event')
        .where('event.id = :eventId', { eventId })
        .select('COALESCE(SUM(serviceOrder.amount), 0)', 'total')
        .getRawOne<{ total: string }>();

        return Number(raw?.total ?? 0);
    }

    private async getTotalPaidByServiceOrder(
        serviceOrderId: string,
    ): Promise<number> {
        const raw = await this.paymentRepository
        .createQueryBuilder('payment')
        .innerJoin('payment.serviceOrder', 'serviceOrder')
        .where('serviceOrder.id = :serviceOrderId', { serviceOrderId })
        .select('COALESCE(SUM(payment.amount), 0)', 'total')
        .getRawOne<{ total: string }>();

        return Number(raw?.total ?? 0);
    }
}