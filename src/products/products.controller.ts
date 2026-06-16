import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User, UserRole } from '../users/user.entity';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Produtos')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Cadastrar produto' })
  @ApiResponse({ status: 201, description: 'Produto cadastrado com sucesso.' })
  @ApiResponse({ status: 409, description: 'Código de produto já cadastrado.' })
  create(
    @Body() dto: CreateProductDto,
    @Request() req: ExpressRequest & { user: User },
  ) {
    return this.productsService.create(dto, req.user.storeId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar produtos' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Lista de produtos retornada com sucesso.' })
  findAll(
    @Query('search') search: string | undefined,
    @Request() req: ExpressRequest & { user: User },
  ) {
    return this.productsService.findAll(req.user.storeId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  @ApiResponse({ status: 200, description: 'Produto encontrado.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Editar produto' })
  @ApiResponse({ status: 200, description: 'Produto atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Inativar produto' })
  @ApiResponse({ status: 200, description: 'Produto inativado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  deactivate(@Param('id') id: string) {
    return this.productsService.deactivate(id);
  }
}
