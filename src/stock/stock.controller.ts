import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, User } from '../users/user.entity';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Estoque')
@ApiBearerAuth()
@Controller('stock')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('movements')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Registrar movimentação' })
  @ApiResponse({ status: 201, description: 'Movimentação registrada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Quantidade insuficiente em estoque.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  createMovement(
    @Body() dto: CreateMovementDto,
    @Request() req: ExpressRequest & { user: User },
  ) {
    return this.stockService.createMovement(dto, req.user.id, req.user.storeId);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Listar movimentações' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiResponse({ status: 200, description: 'Lista de movimentações retornada com sucesso.' })
  findAll(
    @Query('productId') productId: string | undefined,
    @Request() req: ExpressRequest & { user: User },
  ) {
    return this.stockService.findAll(req.user.storeId, productId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Produtos com estoque baixo' })
  @ApiQuery({ name: 'minQuantity', required: false })
  @ApiResponse({ status: 200, description: 'Lista de produtos com estoque baixo.' })
  findLowStock(
    @Query('minQuantity') minQuantity: string | undefined,
    @Request() req: ExpressRequest & { user: User },
  ) {
    return this.stockService.findLowStock(
      req.user.storeId,
      minQuantity ? parseInt(minQuantity) : 5,
    );
  }
}
