import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Event } from '../event/event.entity';
import { Provider } from '../provider/provider.entity';
import { Payment } from '../payment/payment.entity';

export enum ServiceOrderStatus {
  Pendiente = 'Pendiente',
  Aprobada = 'Aprobada',
}

@Entity('service_orders')
export class ServiceOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ServiceOrderStatus,
    default: ServiceOrderStatus.Pendiente,
  })
  status: ServiceOrderStatus;

  @ManyToOne(() => Event, (event) => event.serviceOrders, { onDelete: 'CASCADE' })
  event: Event;

  @ManyToOne(() => Provider, (provider) => provider.serviceOrders, { onDelete: 'CASCADE' })
  provider: Provider;

  @OneToMany(() => Payment, (payment) => payment.serviceOrder)
  payments: Payment[];
}
