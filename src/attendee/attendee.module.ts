import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendee } from './attendee.entity';
import { AsistenteService } from './attendee.service';

@Module({
  imports: [TypeOrmModule.forFeature([Attendee])],
  providers: [AsistenteService],
  exports: [TypeOrmModule, AsistenteService],
})
export class AttendeeModule { }
