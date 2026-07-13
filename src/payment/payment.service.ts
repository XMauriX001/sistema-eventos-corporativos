import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentType } from './payment.entity';
import {
    ServiceOrder,
    ServiceOrderStatus,
} from '../service-order/service-order.entity';
import { Event } from '../event/event.entity';
import { Provider } from '../provider/provider.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

// Umbral de alerta: al llegar a este % del presupuesto aprobado se avisa al organizador
const BUDGET_ALERT_THRESHOLD = 90;

@Injectable()
export class PaymentService {
    constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    ) {}

    async create(createPaymentDto: CreatePaymentDto) {
    const { serviceOrderId, amount, type, paymentDate } = createPaymentDto;

    const serviceOrder = await this.serviceOrderRepository.findOne({
        where: { id: serviceOrderId },
        relations: { event: true, provider: true },
    });

    if (!serviceOrder) {
        throw new NotFoundException(
        `La orden de servicio con id ${serviceOrderId} no existe`,
        );
    }

    const { event, provider } = serviceOrder;

    // Reto 2: un proveedor no puede recibir un pago final si tiene
    // órdenes de servicio pendientes de aprobación.
    if (type === PaymentType.Final) {
        const pendingOrders = await this.serviceOrderRepository.count({
        where: {
            provider: { id: provider.id },
            status: ServiceOrderStatus.Pendiente,
        },
        });

        if (pendingOrders > 0) {
        throw new BadRequestException(
            `El proveedor ${provider.name} tiene ${pendingOrders} orden(es) de servicio pendientes de aprobación, no puede recibir un pago final`,
        );
        }
    }

    // Un pago no puede superar el saldo pendiente de su propia orden de servicio.
    const orderAmount = Number(serviceOrder.amount);
    const paidOnOrder = await this.getTotalPaidByServiceOrder(serviceOrderId);
    const orderBalance = orderAmount - paidOnOrder;

    if (amount > orderBalance) {
        throw new BadRequestException(
        `El pago de ${amount} supera el saldo pendiente de la orden (monto: ${orderAmount}, pagado: ${paidOnOrder}, saldo: ${orderBalance})`,
        );
    }

    // Reto 1: el total pagado a proveedores no puede superar el presupuesto
    // aprobado del evento.
    const approvedBudget = Number(event.approvedBudget);
    const totalPaidEvent = await this.getTotalPaidByEvent(event.id);
    const projectedTotal = totalPaidEvent + amount;

    if (projectedTotal > approvedBudget) {
        throw new BadRequestException(
        `El pago excede el presupuesto aprobado del evento (presupuesto: ${approvedBudget}, pagado: ${totalPaidEvent}, este pago: ${amount})`,
        );
    }

    const payment = this.paymentRepository.create({
        amount,
        type,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        serviceOrder,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    const budgetUsage =
      approvedBudget > 0 ? (projectedTotal / approvedBudget) * 100 : 0;

    return {
        payment: savedPayment,
        budget: {
        approvedBudget,
        totalPaid: projectedTotal,
        remaining: Number((approvedBudget - projectedTotal).toFixed(2)),
        usagePercentage: Number(budgetUsage.toFixed(2)),
        },
        alert:
        budgetUsage >= BUDGET_ALERT_THRESHOLD
            ? `ALERTA: el evento ha consumido el ${budgetUsage.toFixed(2)}% de su presupuesto aprobado`
            : null,
    };
    }

    async findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({
        relations: { serviceOrder: { provider: true } },
    });
    }

    async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
        where: { id },
        relations: { serviceOrder: { provider: true } },
    });

    if (!payment) {
        throw new NotFoundException(`El pago con id ${id} no existe`);
    }
    return payment;
    }

  // Seguimiento de saldo pendiente por proveedor.
    async getProviderBalance(providerId: string) {
    const provider = await this.providerRepository.findOne({
        where: { id: providerId },
    });

    if (!provider) {
        throw new NotFoundException(
            `El proveedor con id ${providerId} no existe`,
        );
    }

    const serviceOrders = await this.serviceOrderRepository.find({
        where: { provider: { id: providerId } },
        relations: { payments: true, event: true },
        });

        const orders = serviceOrders.map((order) => {
        const orderAmount = Number(order.amount);
        const paid = (order.payments ?? []).reduce(
            (sum, payment) => sum + Number(payment.amount),
            0,
        );

        return {
        serviceOrderId: order.id,
        eventId: order.event?.id ?? null,
        status: order.status,
        amount: orderAmount,
        paid: Number(paid.toFixed(2)),
        pendingBalance: Number((orderAmount - paid).toFixed(2)),
        };
    });

    const totalOrdered = orders.reduce((sum, order) => sum + order.amount, 0);
    const totalPaid = orders.reduce((sum, order) => sum + order.paid, 0);

    return {
        providerId: provider.id,
        providerName: provider.name,
        category: provider.category,
        totalOrdered: Number(totalOrdered.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        pendingBalance: Number((totalOrdered - totalPaid).toFixed(2)),
        orders,
    };
    }

  // Reto 4: conciliación financiera con varianza por categoría de proveedor.
    async getEventReconciliation(eventId: string) {
    const event = await this.eventRepository.findOne({
        where: { id: eventId },
    });

    if (!event) {
        throw new NotFoundException(`El evento con id ${eventId} no existe`);
    }

    const plannedRows = await this.serviceOrderRepository
        .createQueryBuilder('serviceOrder')
        .innerJoin('serviceOrder.provider', 'provider')
        .innerJoin('serviceOrder.event', 'event')
        .where('event.id = :eventId', { eventId })
        .select('provider.category', 'category')
        .addSelect('COALESCE(SUM(serviceOrder.amount), 0)', 'planned')
        .groupBy('provider.category')
        .getRawMany<{ category: string; planned: string }>();

    const actualRows = await this.paymentRepository
        .createQueryBuilder('payment')
        .innerJoin('payment.serviceOrder', 'serviceOrder')
        .innerJoin('serviceOrder.provider', 'provider')
        .innerJoin('serviceOrder.event', 'event')
        .where('event.id = :eventId', { eventId })
        .select('provider.category', 'category')
        .addSelect('COALESCE(SUM(payment.amount), 0)', 'actual')
        .groupBy('provider.category')
        .getRawMany<{ category: string; actual: string }>();

    const categories = new Set<string>([
        ...plannedRows.map((row) => row.category),
        ...actualRows.map((row) => row.category),
    ]);

    const byCategory = [...categories].map((category) => {
        const planned = Number(
        plannedRows.find((row) => row.category === category)?.planned ?? 0,
        );
        const actual = Number(
        actualRows.find((row) => row.category === category)?.actual ?? 0,
        );
        const variance = planned - actual;

        return {
        category,
        plannedBudget: Number(planned.toFixed(2)),
        actualSpend: Number(actual.toFixed(2)),
        variance: Number(variance.toFixed(2)),
        status:
            variance > 0
            ? 'Bajo presupuesto'
            : variance < 0
                ? 'Sobre presupuesto'
                : 'En presupuesto',
        };
    });

    const approvedBudget = Number(event.approvedBudget);
    const totalPlanned = byCategory.reduce(
        (sum, row) => sum + row.plannedBudget,
        0,
    );
    const totalActual = byCategory.reduce(
        (sum, row) => sum + row.actualSpend,
        0,
    );
    const usagePercentage =
      approvedBudget > 0 ? (totalActual / approvedBudget) * 100 : 0;

    return {
        eventId: event.id,
        approvedBudget,
        totalPlanned: Number(totalPlanned.toFixed(2)),
        totalActualSpend: Number(totalActual.toFixed(2)),
        remainingBudget: Number((approvedBudget - totalActual).toFixed(2)),
        usagePercentage: Number(usagePercentage.toFixed(2)),
        alert:
        usagePercentage >= BUDGET_ALERT_THRESHOLD
            ? `ALERTA: el evento ha consumido el ${usagePercentage.toFixed(2)}% de su presupuesto aprobado`
            : null,
        byCategory,
    };
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

    private async getTotalPaidByEvent(eventId: string): Promise<number> {
    const raw = await this.paymentRepository
        .createQueryBuilder('payment')
        .innerJoin('payment.serviceOrder', 'serviceOrder')
        .innerJoin('serviceOrder.event', 'event')
        .where('event.id = :eventId', { eventId })
        .select('COALESCE(SUM(payment.amount), 0)', 'total')
        .getRawOne<{ total: string }>();

    return Number(raw?.total ?? 0);
    }
}