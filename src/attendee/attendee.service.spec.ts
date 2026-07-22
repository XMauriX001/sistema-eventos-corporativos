import { Test, TestingModule } from '@nestjs/testing';
import { AttendeesService } from './attendee.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Attendee } from './attendee.entity';
import { Event } from '../event/event.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AttendeeService', () => {
  let service: AttendeesService;

  const mockAttendeeRepository = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockEventRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendeesService,
        { provide: getRepositoryToken(Attendee), useValue: mockAttendeeRepository },
        { provide: getRepositoryToken(Event), useValue: mockEventRepository },
      ],
    }).compile();

    service = module.get<AttendeesService>(AttendeesService);
  });

  describe('registerAttendee', () => {
    it('debería inscribir a un asistente exitosamente', async () => {
      const event = { id: 'evt-1', maxCapacity: 100 };
      mockEventRepository.findOne.mockResolvedValue(event);
      mockAttendeeRepository.count.mockResolvedValue(50); // Aforo no lleno
      
      const newAttendee = { email: 'a@mail.com', event };
      mockAttendeeRepository.create.mockReturnValue(newAttendee);
      mockAttendeeRepository.save.mockResolvedValue({ id: 'att-1', ...newAttendee });

      const result = await service.registerAttendee('evt-1', 'a@mail.com');
      expect(result).toBeDefined();
    });

    it('debería lanzar BadRequestException si se supera el aforo', async () => {
      mockEventRepository.findOne.mockResolvedValue({ id: 'evt-1', maxCapacity: 10 });
      mockAttendeeRepository.count.mockResolvedValue(10); // Aforo lleno

      await expect(service.registerAttendee('evt-1', 'b@mail.com')).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar error de duplicidad si el correo ya existe en el evento', async () => {
      mockEventRepository.findOne.mockResolvedValue({ id: 'evt-1', maxCapacity: 100 });
      mockAttendeeRepository.count.mockResolvedValue(10);
      mockAttendeeRepository.create.mockReturnValue({});
      

      mockAttendeeRepository.save.mockRejectedValue({ code: '23505' });

      await expect(service.registerAttendee('evt-1', 'duplicado@mail.com')).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkIn', () => {
    it('debería registrar la hora de entrada', async () => {
      const attendee = { qrCode: 'qr-123', checkInTime: null };
      mockAttendeeRepository.findOne.mockResolvedValue(attendee);
      mockAttendeeRepository.save.mockImplementation((att) => Promise.resolve(att));

      const result = await service.checkIn('qr-123');
      expect(result.checkInTime).not.toBeNull();
    });

    it('debería lanzar BadRequestException si ya hizo check-in', async () => {
      const attendee = { qrCode: 'qr-123', checkInTime: new Date() };
      mockAttendeeRepository.findOne.mockResolvedValue(attendee);

      await expect(service.checkIn('qr-123')).rejects.toThrow(BadRequestException);
    });
  });
});