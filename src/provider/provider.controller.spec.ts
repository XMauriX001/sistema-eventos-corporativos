import { Test, TestingModule } from '@nestjs/testing';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';
import { ProviderCategory } from './provider.entity';

    describe('ProviderController', () => {
    let controller: ProviderController;
    let service: jest.Mocked<Partial<ProviderService>>;

    beforeEach(async () => {
        service = {
        create: jest.fn().mockResolvedValue({ id: 'provider-uuid' }),
        findAll: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue({ id: 'provider-uuid' }),
        update: jest.fn().mockResolvedValue({ id: 'provider-uuid' }),
        remove: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
        controllers: [ProviderController],
        providers: [{ provide: ProviderService, useValue: service }],
        }).compile();

        controller = module.get<ProviderController>(ProviderController);
    });

    it('debe estar definido', () => {
        expect(controller).toBeDefined();
    });

    it('POST /provider delega en el service', async () => {
        const dto = { name: 'Catering SV', category: ProviderCategory.Catering };
        await controller.create(dto);
        expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('GET /provider pasa la categoría al service', async () => {
        await controller.findAll(ProviderCategory.Logistica);
        expect(service.findAll).toHaveBeenCalledWith(ProviderCategory.Logistica);
    });

    it('GET /provider/:id delega en el service', async () => {
        await controller.findOne('provider-uuid');
        expect(service.findOne).toHaveBeenCalledWith('provider-uuid');
    });

    it('PATCH /provider/:id delega en el service', async () => {
        await controller.update('provider-uuid', { name: 'Nuevo' });
        expect(service.update).toHaveBeenCalledWith('provider-uuid', {
        name: 'Nuevo',
        });
    });

    it('DELETE /provider/:id delega en el service', async () => {
        await controller.remove('provider-uuid');
        expect(service.remove).toHaveBeenCalledWith('provider-uuid');
    });
});