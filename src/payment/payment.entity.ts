import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ServiceOrder } from '../service-order/service-order.entity';

export enum PaymentType {
  Parcial = 'Parcial',
  Final = 'Final',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentType,
  })
  type: PaymentType;

  @Column({ type: 'timestamp' })
  paymentDate: Date;

  @ManyToOne(() => ServiceOrder, (serviceOrder) => serviceOrder.payments, { onDelete: 'CASCADE' })
  serviceOrder: ServiceOrder;
}
