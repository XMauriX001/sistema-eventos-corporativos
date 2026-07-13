import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import { ProviderService } from './provider.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { ProviderCategory } from './provider.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiQuery,
    } from '@nestjs/swagger';

    @ApiTags('Provider')
    @ApiBearerAuth()
    @Controller('provider')
    export class ProviderController {
    constructor(private readonly providerService: ProviderService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('Admin')
    @ApiOperation({ summary: 'Crear un proveedor' })
    @ApiResponse({ status: 201, description: 'Proveedor creado exitosamente' })
    create(@Body() createProviderDto: CreateProviderDto) {
        return this.providerService.create(createProviderDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Listar proveedores, opcionalmente por categoría' })
    @ApiQuery({ name: 'category', enum: ProviderCategory, required: false })
    findAll(
        @Query('category', new ParseEnumPipe(ProviderCategory, { optional: true }))
        category?: ProviderCategory,
    ) {
        return this.providerService.findAll(category);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Obtener un proveedor por su id' })
    @ApiResponse({ status: 404, description: 'El proveedor no existe' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.providerService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('Admin')
    @ApiOperation({ summary: 'Actualizar un proveedor' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateProviderDto: UpdateProviderDto,
    ) {
        return this.providerService.update(id, updateProviderDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('Admin')
    @ApiOperation({ summary: 'Eliminar un proveedor sin órdenes de servicio' })
    @ApiResponse({
        status: 400,
        description: 'El proveedor tiene órdenes de servicio asociadas',
    })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.providerService.remove(id);
    }
}