import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Attendee } from '../attendee/attendee.entity';
import { ServiceOrder } from '../service-order/service-order.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ type: 'varchar' })
  location: string;

  @Column({ type: 'integer' })
  maxCapacity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  approvedBudget: number;

  @OneToMany(() => Attendee, (attendee) => attendee.event)
  attendees: Attendee[];

  @OneToMany(() => ServiceOrder, (serviceOrder) => serviceOrder.event)
  serviceOrders: ServiceOrder[];
}
