import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ServiceOrderService } from './service-order.service';
import { ServiceOrder, ServiceOrderStatus } from './service-order.entity';
import { Event } from '../event/event.entity';
import { Provider, ProviderCategory } from '../provider/provider.entity';
import { Payment } from '../payment/payment.entity';

describe('ServiceOrderService', () => {
  let service: ServiceOrderService;
  let serviceOrderRepository: any;
  let eventRepository: any;
  let providerRepository: any;
  let paymentRepository: any;

  const mockEvent = {
    id: 'event-uuid',
    approvedBudget: '10000.00',
  } as unknown as Event;

  const mockProvider = {
    id: 'provider-uuid',
    name: 'Catering El Salvador',
    category: ProviderCategory.Catering,
  } as unknown as Provider;

  const mockServiceOrder = {
    id: 'order-uuid',
    amount: '5000.00',
    status: ServiceOrderStatus.Pendiente,
    event: mockEvent,
    provider: mockProvider,
    payments: [],
  } as unknown as ServiceOrder;

  const mockCommittedQuery = (currentCommitted: number) => {
    serviceOrderRepository.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest
        .fn()
        .mockResolvedValue({ total: String(currentCommitted) }),
    });
  };

  const mockPaidQuery = (totalPaid: number) => {
    paymentRepository.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: String(totalPaid) }),
    });
  };

  beforeEach(async () => {
    serviceOrderRepository = {
      create: jest.fn((dto) => dto),
      save: jest.fn((order) =>
        Promise.resolve({ id: 'order-uuid', ...order }),
      ),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    eventRepository = { findOne: jest.fn() };
    providerRepository = { findOne: jest.fn() };
    paymentRepository = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceOrderService,
        {
          provide: getRepositoryToken(ServiceOrder),
          useValue: serviceOrderRepository,
        },
        { provide: getRepositoryToken(Event), useValue: eventRepository },
        { provide: getRepositoryToken(Provider), useValue: providerRepository },
        { provide: getRepositoryToken(Payment), useValue: paymentRepository },
      ],
    }).compile();

    service = module.get<ServiceOrderService>(ServiceOrderService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('crea una orden válida en estado Pendiente', async () => {
      eventRepository.findOne.mockResolvedValue(mockEvent);
      providerRepository.findOne.mockResolvedValue(mockProvider);
      mockCommittedQuery(0);

      const result = await service.create({
        eventId: 'event-uuid',
        providerId: 'provider-uuid',
        amount: 5000,
      });

      expect(result.status).toBe(ServiceOrderStatus.Pendiente);
      expect(serviceOrderRepository.save).toHaveBeenCalled();
    });

    it('lanza NotFoundException si el evento no existe', async () => {
      eventRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          eventId: 'no-existe',
          providerId: 'provider-uuid',
          amount: 500,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza NotFoundException si el proveedor no existe', async () => {
      eventRepository.findOne.mockResolvedValue(mockEvent);
      providerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          eventId: 'event-uuid',
          providerId: 'no-existe',
          amount: 500,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza una orden que compromete más del presupuesto aprobado', async () => {
      eventRepository.findOne.mockResolvedValue(mockEvent);
      providerRepository.findOne.mockResolvedValue(mockProvider);
      mockCommittedQuery(8000);

      await expect(
        service.create({
          eventId: 'event-uuid',
          providerId: 'provider-uuid',
          amount: 3000,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(serviceOrderRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('devuelve la orden si existe', async () => {
      serviceOrderRepository.findOne.mockResolvedValue(mockServiceOrder);

      const result = await service.findOne('order-uuid');

      expect(result).toEqual(mockServiceOrder);
    });

    it('lanza NotFoundException si la orden no existe', async () => {
      serviceOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approve', () => {
    it('cambia el estado a Aprobada', async () => {
      serviceOrderRepository.findOne.mockResolvedValue({
        ...mockServiceOrder,
        status: ServiceOrderStatus.Pendiente,
      });

      const result = await service.approve('order-uuid');

      expect(result.status).toBe(ServiceOrderStatus.Aprobada);
    });

    it('rechaza aprobar una orden que ya estaba aprobada', async () => {
      serviceOrderRepository.findOne.mockResolvedValue({
        ...mockServiceOrder,
        status: ServiceOrderStatus.Aprobada,
      });

      await expect(service.approve('order-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('actualiza el monto si es mayor o igual a lo pagado', async () => {
      serviceOrderRepository.findOne.mockResolvedValue({ ...mockServiceOrder });
      mockPaidQuery(2000);

      const result = await service.update('order-uuid', { amount: 6000 });

      expect(result.amount).toBe(6000);
    });

    it('rechaza reducir el monto por debajo de lo ya pagado', async () => {
      serviceOrderRepository.findOne.mockResolvedValue({ ...mockServiceOrder });
      mockPaidQuery(3000);

      await expect(
        service.update('order-uuid', { amount: 2000 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('elimina la orden si no tiene pagos', async () => {
      serviceOrderRepository.findOne.mockResolvedValue(mockServiceOrder);
      mockPaidQuery(0);

      await service.remove('order-uuid');

      expect(serviceOrderRepository.remove).toHaveBeenCalledWith(
        mockServiceOrder,
      );
    });

    it('rechaza eliminar una orden con pagos registrados', async () => {
      serviceOrderRepository.findOne.mockResolvedValue(mockServiceOrder);
      mockPaidQuery(1000);

      await expect(service.remove('order-uuid')).rejects.toThrow(
        BadRequestException,
      );
      expect(serviceOrderRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('findByEvent y findByProvider', () => {
    it('lista las órdenes de un evento', async () => {
      serviceOrderRepository.find.mockResolvedValue([mockServiceOrder]);

      await service.findByEvent('event-uuid');

      expect(serviceOrderRepository.find).toHaveBeenCalledWith({
        where: { event: { id: 'event-uuid' } },
        relations: { provider: true },
      });
    });

    it('lista las órdenes de un proveedor', async () => {
      serviceOrderRepository.find.mockResolvedValue([mockServiceOrder]);

      await service.findByProvider('provider-uuid');

      expect(serviceOrderRepository.find).toHaveBeenCalledWith({
        where: { provider: { id: 'provider-uuid' } },
        relations: { event: true },
      });
    });
  });
});