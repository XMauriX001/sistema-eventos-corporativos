import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider, ProviderCategory } from './provider.entity';
import { ServiceOrder } from '../service-order/service-order.entity';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@Injectable()
export class ProviderService {
constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
) {}

async create(createProviderDto: CreateProviderDto): Promise<Provider> {
    try {
    const provider = this.providerRepository.create(createProviderDto);
    return await this.providerRepository.save(provider);
    } catch (error) {
    throw new InternalServerErrorException(
        'Error al crear el proveedor en la base de datos',
    );
    }
}

async findAll(category?: ProviderCategory): Promise<Provider[]> {
    if (category) {
    return this.providerRepository.find({ where: { category } });
    }
    return this.providerRepository.find();
}

async findOne(id: string): Promise<Provider> {
    const provider = await this.providerRepository.findOne({ where: { id } });
    if (!provider) {
    throw new NotFoundException(`El proveedor con id ${id} no existe`);
    }
    return provider;
}

async update(
    id: string,
    updateProviderDto: UpdateProviderDto,
): Promise<Provider> {
    const provider = await this.findOne(id);

    const updatedProvider = Object.assign(provider, updateProviderDto);
    return await this.providerRepository.save(updatedProvider);
}

async remove(id: string): Promise<void> {
    const provider = await this.findOne(id);

    const serviceOrdersCount = await this.serviceOrderRepository.count({
    where: { provider: { id } },
    });

    if (serviceOrdersCount > 0) {
    throw new BadRequestException(
        `No se puede eliminar el proveedor porque tiene ${serviceOrdersCount} orden(es) de servicio asociadas`,
    );
    }

    await this.providerRepository.remove(provider);
}
}