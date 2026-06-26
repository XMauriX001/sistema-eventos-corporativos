import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, Generated } from 'typeorm';
import { Event } from '../event/event.entity';

@Entity('attendees')
@Index(['email', 'event'], { unique: true })
export class Attendee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'uuid' })
  @Generated('uuid')
  qrCode: string;

  @Column({ type: 'timestamp', nullable: true })
  checkInTime: Date | null;

  @ManyToOne(() => Event, (event) => event.attendees, { onDelete: 'CASCADE' })
  event: Event;
}
