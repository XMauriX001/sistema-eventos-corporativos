import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { Payment, PaymentType } from './payment.entity';
import {
  ServiceOrder,
  ServiceOrderStatus,
} from '../service-order/service-order.entity';
import { Event } from '../event/event.entity';
import { Provider, ProviderCategory } from '../provider/provider.entity';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepository: any;
  let serviceOrderRepository: any;
  let eventRepository: any;
  let providerRepository: any;

  const mockEvent = {
    id: 'event-uuid',
    approvedBudget: '10000.00',
    maxCapacity: 100,
  } as unknown as Event;

  const mockProvider = {
    id: 'provider-uuid',
    name: 'Catering El Salvador',
    category: ProviderCategory.Catering,
  } as unknown as Provider;

  const mockServiceOrder = {
    id: 'order-uuid',
    amount: '5000.00',
    status: ServiceOrderStatus.Aprobada,
    event: mockEvent,
    provider: mockProvider,
  } as unknown as ServiceOrder;

  // Simula el SUM de los query builders: el primero es el pagado de la orden,
  // el segundo el pagado del evento.
  const mockSums = (paidOnOrder: number, paidOnEvent: number) => {
    const getRawOne = jest
      .fn()
      .mockResolvedValueOnce({ total: String(paidOnOrder) })
      .mockResolvedValueOnce({ total: String(paidOnEvent) });

    paymentRepository.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawOne,
      getRawMany: jest.fn().mockResolvedValue([]),
    });
  };

  beforeEach(async () => {
    paymentRepository = {
      create: jest.fn((dto) => dto),
      save: jest.fn((payment) => Promise.resolve({ id: 'payment-uuid', ...payment })),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    serviceOrderRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    eventRepository = { findOne: jest.fn() };
    providerRepository = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getRepositoryToken(Payment), useValue: paymentRepository },
        {
          provide: getRepositoryToken(ServiceOrder),
          useValue: serviceOrderRepository,
        },
        { provide: getRepositoryToken(Event), useValue: eventRepository },
        { provide: getRepositoryToken(Provider), useValue: providerRepository },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('lanza NotFoundException si la orden de servicio no existe', async () => {
      serviceOrderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          serviceOrderId: 'no-existe',
          amount: 100,
          type: PaymentType.Parcial,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('registra un pago parcial válido', async () => {
      serviceOrderRepository.findOne.mockResolvedValue(mockServiceOrder);
      mockSums(0, 0);

      const result = await service.create({
        serviceOrderId: 'order-uuid',
        amount: 1000,
        type: PaymentType.Parcial,
      });

      expect(paymentRepository.save).toHaveBeenCalled();
      expect(result.budget.totalPaid).toBe(1000);
      expect(result.budget.remaining).toBe(9000);
      expect(result.alert).toBeNull();
    });

    it('bloquea un pago final si el proveedor tiene órdenes pendientes de aprobación', async () => {
      serviceOrderRepository.findOne.mockResolvedValue(mockServiceOrder);
      serviceOrderRepository.count.mockResolvedValue(1);
      mockSums(0, 0);

      await expect(
        service.create({
          serviceOrderId: 'order-uuid',
          amount: 1000,
          type: PaymentType.Final,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('permite un pago final si el proveedor no tiene órdenes pendientes', async () => {
      serviceOrderRepository.findOne.mockResolvedValue(mockServiceOrder);
      serviceOrderRepository.count.mockResolvedValue(0);
      mockSums(1000, 1000);

      const result = await service.create({
        serviceOrderId: 'order-uuid',
        amount: 4000,
        type: PaymentType.Final,
      });

      expect(result.payment).toBeDefined();
    });

    it('rechaza un pago que supera el saldo pendiente de la orden', async () => {
      serviceOrderRepository.findOne.mockResolvedValue(mockServiceOrder);
      mockSums(4500, 4500);

      await expect(
        service.create({
          serviceOrderId: 'order-uuid',
          amount: 1000,
          type: PaymentType.Parcial,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza un pago que supera el presupuesto aprobado del evento', async () => {
      const bigOrder = { ...mockServiceOrder, amount: '20000.00' };
      serviceOrderRepository.findOne.mockResolvedValue(bigOrder);
      mockSums(9500, 9500);

      await expect(
        service.create({
          serviceOrderId: 'order-uuid',
          amount: 1000,
          type: PaymentType.Parcial,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('devuelve alerta al alcanzar el 90% del presupuesto aprobado', async () => {
      serviceOrderRepository.findOne.mockResolvedValue(mockServiceOrder);
      mockSums(0, 8500);

      const result = await service.create({
        serviceOrderId: 'order-uuid',
        amount: 500,
        type: PaymentType.Parcial,
      });

      expect(result.budget.usagePercentage).toBe(90);
      expect(result.alert).toContain('ALERTA');
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException si el pago no existe', async () => {
      paymentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('payment-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devuelve el pago si existe', async () => {
      paymentRepository.findOne.mockResolvedValue({ id: 'payment-uuid' });

      const result = await service.findOne('payment-uuid');

      expect(result.id).toBe('payment-uuid');
    });
  });

  describe('getProviderBalance', () => {
    it('lanza NotFoundException si el proveedor no existe', async () => {
      providerRepository.findOne.mockResolvedValue(null);

      await expect(service.getProviderBalance('provider-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calcula el saldo pendiente del proveedor', async () => {
      providerRepository.findOne.mockResolvedValue(mockProvider);
      serviceOrderRepository.find.mockResolvedValue([
        {
          ...mockServiceOrder,
          payments: [{ amount: '2000.00' }, { amount: '500.00' }],
        },
      ]);

      const result = await service.getProviderBalance('provider-uuid');

      expect(result.totalOrdered).toBe(5000);
      expect(result.totalPaid).toBe(2500);
      expect(result.pendingBalance).toBe(2500);
      expect(result.orders[0].pendingBalance).toBe(2500);
    });
  });

  describe('getEventReconciliation', () => {
    it('lanza NotFoundException si el evento no existe', async () => {
      eventRepository.findOne.mockResolvedValue(null);

      await expect(service.getEventReconciliation('event-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calcula la varianza por categoría de proveedor', async () => {
      eventRepository.findOne.mockResolvedValue(mockEvent);

      serviceOrderRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { category: 'Catering', planned: '5000.00' },
          { category: 'Audiovisual', planned: '2000.00' },
        ]),
      });

      paymentRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { category: 'Catering', actual: '4000.00' },
          { category: 'Audiovisual', actual: '2500.00' },
        ]),
      });

      const result = await service.getEventReconciliation('event-uuid');

      const catering = result.byCategory.find((c) => c.category === 'Catering');
      const audiovisual = result.byCategory.find(
        (c) => c.category === 'Audiovisual',
      );

      expect(catering?.variance).toBe(1000);
      expect(catering?.status).toBe('Bajo presupuesto');
      expect(audiovisual?.variance).toBe(-500);
      expect(audiovisual?.status).toBe('Sobre presupuesto');
      expect(result.totalActualSpend).toBe(6500);
      expect(result.remainingBudget).toBe(3500);
    });
  });
});