import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendee } from './attendee.entity';
import { Event } from '../event/event.entity';
import { AttendeeController } from './attende.controller';
import { AttendeesService } from './attendee.service';
@Module({
  imports: [TypeOrmModule.forFeature([Attendee, Event])],
  controllers: [AttendeeController],
  providers: [AttendeesService],
  exports: [TypeOrmModule, AttendeesService],
})
export class AttendeeModule { }
