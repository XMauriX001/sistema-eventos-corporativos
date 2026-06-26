import { Test, TestingModule } from '@nestjs/testing';
import { EventoService } from './event.service';

describe('EventoService', () => {
  let service: EventoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventoService],
    }).compile();

    service = module.get<EventoService>(EventoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
