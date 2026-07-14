import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceOrder } from './service-order.entity';
import { Event } from '../event/event.entity';
import { Provider } from '../provider/provider.entity';
import { Payment } from '../payment/payment.entity';
import { ServiceOrderController } from './service-order.controller';
import { ServiceOrderService } from './service-order.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceOrder, Event, Provider, Payment]),
  ],
  controllers: [ServiceOrderController],
  providers: [ServiceOrderService],
  exports: [TypeOrmModule, ServiceOrderService],
})
export class ServiceOrderModule { }