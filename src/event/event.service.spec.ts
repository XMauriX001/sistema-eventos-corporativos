import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Event } from './event.entity';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('EventService', () => {
  let service: EventService;

  const mockEventRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: getRepositoryToken(Event), useValue: mockEventRepository },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  describe('create', () => {
    it('debería crear y retornar un evento', async () => {
      const dto = { type: 'T', date: '2026-01-01', location: 'L', maxCapacity: 10, approvedBudget: 100 };
      mockEventRepository.create.mockReturnValue(dto);
      mockEventRepository.save.mockResolvedValue({ id: '1', ...dto });

      expect(await service.create(dto as any)).toBeDefined();
    });

    it('debería manejar errores de base de datos', async () => {
      mockEventRepository.create.mockReturnValue({});
      mockEventRepository.save.mockRejectedValue(new Error('DB'));

      await expect(service.create({} as any)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAll y findOne', () => {
    it('debería retornar un arreglo de eventos', async () => {
      mockEventRepository.find.mockResolvedValue([{ id: '1' }]);
      expect(await service.findAll()).toHaveLength(1);
    });

    it('debería lanzar NotFoundException si no encuentra el evento', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('id-falso')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update y remove', () => {
    it('debería actualizar un evento', async () => {
      const event = { id: '1', location: 'Old' };
      mockEventRepository.findOne.mockResolvedValue(event);
      mockEventRepository.save.mockResolvedValue({ ...event, location: 'New' });

      const result = await service.update('1', { location: 'New' } as any);
      expect(result.location).toEqual('New');
    });

    it('debería eliminar un evento', async () => {
      const event = { id: '1' };
      mockEventRepository.findOne.mockResolvedValue(event);
      mockEventRepository.remove.mockResolvedValue(event);

      await service.remove('1');
      expect(mockEventRepository.remove).toHaveBeenCalledWith(event);
    });
  });
});