import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Provider } from './provider.entity';
import { ServiceOrder } from '../service-order/service-order.entity';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';

@Module({
  imports: [TypeOrmModule.forFeature([Provider, ServiceOrder])],
  controllers: [ProviderController],
  providers: [ProviderService],
  exports: [TypeOrmModule, ProviderService],
})
export class ProviderModule { }