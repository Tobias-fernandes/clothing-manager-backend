import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Sale } from '../sales/sale.entity';
import { Product } from '../products/product.entity';
import { FinanceEntry } from '../finance/finance-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, Product, FinanceEntry])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
