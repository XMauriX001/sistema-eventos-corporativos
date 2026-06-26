import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceOrder } from './service-order.entity';
import { OrdenServicioService } from './service-order.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOrder])],
  providers: [OrdenServicioService],
  exports: [TypeOrmModule, OrdenServicioService],
})
export class ServiceOrderModule { }
