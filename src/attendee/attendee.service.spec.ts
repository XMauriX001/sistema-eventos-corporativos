import { Test, TestingModule } from '@nestjs/testing';
import { AttendeesService } from './attendee.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Attendee } from './attendee.entity';
import { Event } from '../event/event.entity';

describe('AttendeesService', () => {
  let service: AttendeesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendeesService,
        {
          provide: getRepositoryToken(Attendee),
          useValue: {
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Event),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AttendeesService>(AttendeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
