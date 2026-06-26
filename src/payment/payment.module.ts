import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { PagoService } from './payment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  providers: [PagoService],
  exports: [TypeOrmModule, PagoService],
})
export class PaymentModule { }
