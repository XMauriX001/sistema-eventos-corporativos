import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentType } from './payment.entity';

describe('PaymentController', () => {
    let controller: PaymentController;
    let service: jest.Mocked<Partial<PaymentService>>;

    beforeEach(async () => {
        service = {
        create: jest.fn().mockResolvedValue({ payment: { id: 'payment-uuid' } }),
        findAll: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue({ id: 'payment-uuid' }),
        getProviderBalance: jest.fn().mockResolvedValue({ pendingBalance: 0 }),
        getEventReconciliation: jest.fn().mockResolvedValue({ byCategory: [] }),
        };

        const module: TestingModule = await Test.createTestingModule({
        controllers: [PaymentController],
        providers: [{ provide: PaymentService, useValue: service }],
        }).compile();

        controller = module.get<PaymentController>(PaymentController);
    });

    it('debe estar definido', () => {
        expect(controller).toBeDefined();
    });

    it('POST /payment delega en el service', async () => {
        const dto = {
        serviceOrderId: 'order-uuid',
        amount: 500,
        type: PaymentType.Parcial,
        };
        await controller.create(dto);
        expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('GET /payment lista los pagos', async () => {
        await controller.findAll();
        expect(service.findAll).toHaveBeenCalled();
    });

    it('GET /payment/:id delega en el service', async () => {
        await controller.findOne('payment-uuid');
        expect(service.findOne).toHaveBeenCalledWith('payment-uuid');
    });

    it('GET /payment/provider/:providerId/balance delega en el service', async () => {
        await controller.getProviderBalance('provider-uuid');
        expect(service.getProviderBalance).toHaveBeenCalledWith('provider-uuid');
    });

    it('GET /payment/reconciliation/:eventId delega en el service', async () => {
        await controller.getEventReconciliation('event-uuid');
        expect(service.getEventReconciliation).toHaveBeenCalledWith('event-uuid');
    });
});