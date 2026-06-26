import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Provider } from './provider.entity';
import { ProveedorService } from './provider.service';

@Module({
  imports: [TypeOrmModule.forFeature([Provider])],
  providers: [ProveedorService],
  exports: [TypeOrmModule, ProveedorService],
})
export class ProviderModule { }
