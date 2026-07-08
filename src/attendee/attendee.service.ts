import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendee } from './attendee.entity';
import { Event } from '../event/event.entity';

@Injectable()
export class AttendeesService {
  constructor(
    @InjectRepository(Attendee)
    private readonly attendeeRepository: Repository<Attendee>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) { }

  async registerAttendee(eventId: string, email: string): Promise<Attendee> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('El evento no existe');
    }

    const currentAttendeesCount = await this.attendeeRepository.count({
      where: { event: { id: eventId } },
    });

    if (currentAttendeesCount >= event.maxCapacity) {
      throw new BadRequestException('El evento ha alcanzado su aforo máximo');
    }

    try {
      const newAttendee = this.attendeeRepository.create({
        email,
        event,
      });

      return await this.attendeeRepository.save(newAttendee);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Este correo ya está registrado para este evento');
      }
      throw error;
    }
  }

  async checkIn(qrCode: string): Promise<Attendee> {
    const attendee = await this.attendeeRepository.findOne({ where: { qrCode } });

    if (!attendee) {
      throw new NotFoundException('Código QR inválido o asistente no encontrado');
    }

    if (attendee.checkInTime) {
      throw new BadRequestException('El asistente ya realizó el check-in anteriormente');
    }

    attendee.checkInTime = new Date();

    return await this.attendeeRepository.save(attendee);
  }
}