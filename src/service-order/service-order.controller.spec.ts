import { Test, TestingModule } from '@nestjs/testing';
import { ServiceOrderController } from './service-order.controller';
import { ServiceOrderService } from './service-order.service';

describe('ServiceOrderController', () => {
    let controller: ServiceOrderController;
    let service: jest.Mocked<Partial<ServiceOrderService>>;

    beforeEach(async () => {
        service = {
        create: jest.fn().mockResolvedValue({ id: 'order-uuid' }),
        findAll: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue({ id: 'order-uuid' }),
        findByEvent: jest.fn().mockResolvedValue([]),
        findByProvider: jest.fn().mockResolvedValue([]),
        approve: jest.fn().mockResolvedValue({ id: 'order-uuid' }),
        update: jest.fn().mockResolvedValue({ id: 'order-uuid' }),
        remove: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
        controllers: [ServiceOrderController],
        providers: [{ provide: ServiceOrderService, useValue: service }],
        }).compile();

        controller = module.get<ServiceOrderController>(ServiceOrderController);
    });

    it('debe estar definido', () => {
        expect(controller).toBeDefined();
    });

    it('POST /service-order delega en el service', async () => {
        const dto = {
        eventId: 'event-uuid',
        providerId: 'provider-uuid',
        amount: 5000,
        };
        await controller.create(dto);
        expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('GET /service-order lista todas las órdenes', async () => {
        await controller.findAll();
        expect(service.findAll).toHaveBeenCalled();
    });

    it('GET /service-order/:id delega en el service', async () => {
        await controller.findOne('order-uuid');
        expect(service.findOne).toHaveBeenCalledWith('order-uuid');
    });

    it('GET /service-order/event/:eventId delega en el service', async () => {
        await controller.findByEvent('event-uuid');
        expect(service.findByEvent).toHaveBeenCalledWith('event-uuid');
    });

    it('GET /service-order/provider/:providerId delega en el service', async () => {
        await controller.findByProvider('provider-uuid');
        expect(service.findByProvider).toHaveBeenCalledWith('provider-uuid');
    });

    it('PATCH /service-order/:id/approve delega en el service', async () => {
        await controller.approve('order-uuid');
        expect(service.approve).toHaveBeenCalledWith('order-uuid');
    });

    it('PATCH /service-order/:id actualiza la orden', async () => {
        await controller.update('order-uuid', { amount: 6000 });
        expect(service.update).toHaveBeenCalledWith('order-uuid', { amount: 6000 });
    });

    it('DELETE /service-order/:id delega en el service', async () => {
        await controller.remove('order-uuid');
        expect(service.remove).toHaveBeenCalledWith('order-uuid');
    });
});