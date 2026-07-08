import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';


@Injectable()
export class EventService {
    constructor(
        @InjectRepository(Event)
        private readonly eventRepository: Repository<Event>,
    ) { }

    async create(createEventDto: CreateEventDto): Promise<Event> {
        try {
            const event = this.eventRepository.create(createEventDto);
            return await this.eventRepository.save(event);
        } catch (error) {
            throw new InternalServerErrorException('Error al crear el evento en la base de datos');
        }
    }

    async findAll(): Promise<Event[]> {
        return this.eventRepository.find();
    }

    async findOne(id: string): Promise<Event> {
        const event = await this.eventRepository.findOne({ where: { id } });
        if (!event) {
            throw new NotFoundException(`El evento con id ${id} no existe`);
        }
        return event;
    }

    async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
        const event = await this.findOne(id);
        
        const updatedEvent = Object.assign(event, updateEventDto);
        return await this.eventRepository.save(updatedEvent);
    }

    async remove(id: string): Promise<void> {
        const event = await this.findOne(id);
        await this.eventRepository.remove(event);
    }
}