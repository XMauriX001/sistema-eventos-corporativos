import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ServiceOrder } from '../service-order/service-order.entity';

export enum ProviderCategory {
  Catering = 'Catering',
  Audiovisual = 'Audiovisual',
  Decoracion = 'Decoracion',
  Logistica = 'Logistica',
}

@Entity('providers')
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({
    type: 'enum',
    enum: ProviderCategory,
  })
  category: ProviderCategory;

  @OneToMany(() => ServiceOrder, (serviceOrder) => serviceOrder.provider)
  serviceOrders: ServiceOrder[];
}
