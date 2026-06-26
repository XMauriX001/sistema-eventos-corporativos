import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './event.entity';
import { EventoService } from './event.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  providers: [EventoService],
  exports: [TypeOrmModule, EventoService],
})
export class EventModule { }
