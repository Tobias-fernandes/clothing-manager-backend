import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceEntry, EntryType, EntryCategory } from './finance-entry.entity';
import { CreateEntryDto } from './dto/create-entry.dto';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FinanceEntry)
    private financeRepository: Repository<FinanceEntry>,
  ) {}

  async create(
    dto: CreateEntryDto,
    responsibleId: string,
    storeId: string,
  ): Promise<FinanceEntry> {
    const entry = this.financeRepository.create({
      ...dto,
      responsibleId,
      storeId,
    });
    return this.financeRepository.save(entry);
  }

  async createFromSale(
    saleId: string,
    amount: number,
    responsibleId: string,
    storeId: string,
  ): Promise<FinanceEntry> {
    return this.create(
      {
        type: EntryType.INCOME,
        category: EntryCategory.SALE,
        description: `Venda #${saleId}`,
        amount,
        saleId,
      },
      responsibleId,
      storeId,
    );
  }

  async findAll(
    storeId: string,
    startDate?: string,
    endDate?: string,
    type?: EntryType,
  ): Promise<FinanceEntry[]> {
    const query = this.financeRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.responsible', 'responsible')
      .select(['entry', 'responsible.id', 'responsible.name'])
      .where('entry.storeId = :storeId', { storeId })
      .orderBy('entry.createdAt', 'DESC');

    if (startDate) {
      query.andWhere('entry.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('entry.createdAt <= :endDate', { endDate });
    }

    if (type) {
      query.andWhere('entry.type = :type', { type });
    }

    return query.getMany();
  }

  async getSummary(
    storeId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    startDate: string;
    endDate: string;
  }> {
    const entries = await this.findAll(storeId, startDate, endDate);

    const totalIncome = entries
      .filter((e) => e.type === EntryType.INCOME)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpense = entries
      .filter((e) => e.type === EntryType.EXPENSE)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      startDate: startDate ?? 'início',
      endDate: endDate ?? 'hoje',
    };
  }
}
