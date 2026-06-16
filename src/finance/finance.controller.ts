import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, User } from '../users/user.entity';
import { EntryType } from './finance-entry.entity';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Financeiro')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar entrada/saída financeira' })
  @ApiResponse({
    status: 201,
    description: 'Entrada financeira registrada com sucesso.',
  })
  create(
    @Body() dto: CreateEntryDto,
    @Request() req: ExpressRequest & { user: User },
  ) {
    return this.financeService.create(dto, req.user.id, req.user.storeId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar entradas financeiras' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'type', required: false, enum: EntryType })
  @ApiResponse({
    status: 200,
    description: 'Lista de entradas financeiras retornada com sucesso.',
  })
  findAll(
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
    @Query('type') type: EntryType | undefined,
    @Request() req: ExpressRequest & { user: User },
  ) {
    return this.financeService.findAll(
      req.user.storeId,
      startDate,
      endDate,
      type,
    );
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumo financeiro' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({
    status: 200,
    description: 'Resumo financeiro retornado com sucesso.',
  })
  getSummary(
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
    @Request() req: ExpressRequest & { user: User },
  ) {
    return this.financeService.getSummary(req.user.storeId, startDate, endDate);
  }
}
