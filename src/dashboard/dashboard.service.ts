import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sales/sale.entity';
import { Product } from '../products/product.entity';
import { FinanceEntry, EntryType } from '../finance/finance-entry.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(FinanceEntry)
    private financeRepository: Repository<FinanceEntry>,
  ) {}

  async getSummary(storeId: string) {
    const now = new Date();

    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );

    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const dailySales = await this.salesRepository
      .createQueryBuilder('sale')
      .where('sale.storeId = :storeId', { storeId })
      .andWhere('sale.createdAt >= :start', { start })
      .andWhere('sale.createdAt <= :end', { end })
      .getMany();

    const totalToday = dailySales.reduce((sum, s) => sum + s.total, 0);

    const byPaymentMethod: Record<string, number> = {};
    for (const sale of dailySales) {
      byPaymentMethod[sale.paymentMethod] =
        (byPaymentMethod[sale.paymentMethod] ?? 0) + sale.total;
    }

    const totalProducts = await this.productsRepository.count({
      where: { isActive: true, storeId },
    });

    const lowStockProducts = await this.productsRepository
      .createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.storeId = :storeId', { storeId })
      .andWhere('product.quantity <= :min', { min: 5 })
      .getCount();

    const lastSales = await this.salesRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.employee', 'employee')
      .select([
        'sale.id',
        'sale.total',
        'sale.paymentMethod',
        'sale.createdAt',
        'employee.id',
        'employee.name',
      ])
      .where('sale.storeId = :storeId', { storeId })
      .orderBy('sale.createdAt', 'DESC')
      .take(5)
      .getMany();

    const todayFinanceEntries = await this.financeRepository
      .createQueryBuilder('entry')
      .where('entry.storeId = :storeId', { storeId })
      .andWhere('entry.createdAt >= :start', { start })
      .andWhere('entry.createdAt <= :end', { end })
      .getMany();

    const allFinanceEntries = await this.financeRepository
      .createQueryBuilder('entry')
      .where('entry.storeId = :storeId', { storeId })
      .getMany();

    const totalIncomeToday = todayFinanceEntries
      .filter((e) => e.type === EntryType.INCOME)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpenseToday = todayFinanceEntries
      .filter((e) => e.type === EntryType.EXPENSE)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalBalance =
      allFinanceEntries
        .filter((e) => e.type === EntryType.INCOME)
        .reduce((sum, e) => sum + e.amount, 0) -
      allFinanceEntries
        .filter((e) => e.type === EntryType.EXPENSE)
        .reduce((sum, e) => sum + e.amount, 0);

    return {
      today: now.toISOString().split('T')[0],
      sales: {
        totalToday,
        countToday: dailySales.length,
        byPaymentMethod,
        lastSales,
      },
      stock: {
        totalProducts,
        lowStockProducts,
      },
      finance: {
        totalIncomeToday,
        totalExpenseToday,
        balance: totalBalance,
      },
    };
  }
}
