import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Request as ExpressRequest } from 'express';
import { User } from '../users/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Vendas')
@ApiBearerAuth()
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar venda' })
  @ApiResponse({ status: 201, description: 'Venda registrada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Estoque insuficiente ou produto inativo.' })
  create(
    @Body() dto: CreateSaleDto,
    @Request() req: ExpressRequest & { user: User },
  ) {
    return this.salesService.create(dto, req.user.id, req.user.storeId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vendas' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Lista de vendas retornada com sucesso.' })
  findAll(
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
    @Request() req: ExpressRequest & { user: User },
  ) {
    return this.salesService.findAll(req.user.storeId, startDate, endDate);
  }

  @Get('daily-summary')
  @ApiOperation({ summary: 'Resumo diário' })
  @ApiQuery({ name: 'date', required: false })
  @ApiResponse({ status: 200, description: 'Resumo diário retornado com sucesso.' })
  getDailySummary(
    @Query('date') date: string | undefined,
    @Request() req: ExpressRequest & { user: User },
  ) {
    return this.salesService.getDailySummary(req.user.storeId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar venda por ID' })
  @ApiResponse({ status: 200, description: 'Venda encontrada.' })
  @ApiResponse({ status: 400, description: 'Venda não encontrada.' })
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }
}
