import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProviderService } from './provider.service';
import { Provider, ProviderCategory } from './provider.entity';
import { ServiceOrder } from '../service-order/service-order.entity';

describe('ProviderService', () => {
  let service: ProviderService;
  let providerRepository: any;
  let serviceOrderRepository: any;

  const mockProvider: Provider = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Catering El Salvador',
    category: ProviderCategory.Catering,
    serviceOrders: [],
  };

  beforeEach(async () => {
    providerRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };
    serviceOrderRepository = {
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderService,
        { provide: getRepositoryToken(Provider), useValue: providerRepository },
        {
          provide: getRepositoryToken(ServiceOrder),
          useValue: serviceOrderRepository,
        },
      ],
    }).compile();

    service = module.get<ProviderService>(ProviderService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('crea y guarda un proveedor', async () => {
      const dto = {
        name: 'Catering El Salvador',
        category: ProviderCategory.Catering,
      };
      providerRepository.create.mockReturnValue(mockProvider);
      providerRepository.save.mockResolvedValue(mockProvider);

      const result = await service.create(dto);

      expect(providerRepository.create).toHaveBeenCalledWith(dto);
      expect(providerRepository.save).toHaveBeenCalledWith(mockProvider);
      expect(result).toEqual(mockProvider);
    });
  });

  describe('findAll', () => {
    it('lista todos los proveedores cuando no se filtra por categoría', async () => {
      providerRepository.find.mockResolvedValue([mockProvider]);

      const result = await service.findAll();

      expect(providerRepository.find).toHaveBeenCalledWith();
      expect(result).toHaveLength(1);
    });

    it('filtra por categoría cuando se envía', async () => {
      providerRepository.find.mockResolvedValue([mockProvider]);

      await service.findAll(ProviderCategory.Audiovisual);

      expect(providerRepository.find).toHaveBeenCalledWith({
        where: { category: ProviderCategory.Audiovisual },
      });
    });
  });

  describe('findOne', () => {
    it('devuelve el proveedor si existe', async () => {
      providerRepository.findOne.mockResolvedValue(mockProvider);

      const result = await service.findOne(mockProvider.id);

      expect(result).toEqual(mockProvider);
    });

    it('lanza NotFoundException si el proveedor no existe', async () => {
      providerRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockProvider.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('actualiza los campos enviados', async () => {
      providerRepository.findOne.mockResolvedValue({ ...mockProvider });
      providerRepository.save.mockImplementation((provider) =>
        Promise.resolve(provider),
      );

      const result = await service.update(mockProvider.id, {
        name: 'Nuevo Nombre',
      });

      expect(result.name).toBe('Nuevo Nombre');
      expect(result.category).toBe(ProviderCategory.Catering);
    });
  });

  describe('remove', () => {
    it('elimina el proveedor si no tiene órdenes de servicio', async () => {
      providerRepository.findOne.mockResolvedValue(mockProvider);
      serviceOrderRepository.count.mockResolvedValue(0);

      await service.remove(mockProvider.id);

      expect(providerRepository.remove).toHaveBeenCalledWith(mockProvider);
    });

    it('lanza BadRequestException si el proveedor tiene órdenes de servicio', async () => {
      providerRepository.findOne.mockResolvedValue(mockProvider);
      serviceOrderRepository.count.mockResolvedValue(2);

      await expect(service.remove(mockProvider.id)).rejects.toThrow(
        BadRequestException,
      );
      expect(providerRepository.remove).not.toHaveBeenCalled();
    });
  });
});