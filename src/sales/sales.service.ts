import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from './sale.entity';
import { SaleItem } from './sale-item.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ProductsService } from '../products/products.service';
import { StockService } from '../stock/stock.service';
import { FinanceService } from '../finance/finance.service';
import { MovementType } from '../stock/stock-movement.entity';
import { PaymentMethod } from './sale.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemsRepository: Repository<SaleItem>,
    private productsService: ProductsService,
    private stockService: StockService,
    private financeService: FinanceService,
  ) {}

  async create(
    dto: CreateSaleDto,
    employeeId: string,
    storeId: string,
  ): Promise<Sale> {
    if (
      dto.paymentMethod === PaymentMethod.CREDIT_CARD_INSTALLMENT &&
      !dto.installments
    ) {
      throw new BadRequestException(
        'Número de parcelas é obrigatório para cartão parcelado',
      );
    }

    let total = 0;
    const itemsData: {
      productId: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[] = [];

    for (const item of dto.items) {
      const product = await this.productsService.findOne(item.productId);

      if (!product.isActive) {
        throw new BadRequestException(`Produto ${product.name} está inativo`);
      }

      if (product.quantity < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto ${product.name}`,
        );
      }

      const subtotal = product.salePrice * item.quantity;
      total += subtotal;
      itemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.salePrice,
        subtotal,
      });
    }

    const sale = this.salesRepository.create({
      employeeId,
      storeId,
      paymentMethod: dto.paymentMethod,
      installments: dto.installments ?? null,
      total,
    });

    const savedSale = await this.salesRepository.save(sale);

    for (const item of itemsData) {
      const saleItem = this.saleItemsRepository.create({
        ...item,
        saleId: savedSale.id,
      });
      await this.saleItemsRepository.save(saleItem);

      await this.stockService.createMovement(
        {
          productId: item.productId,
          type: MovementType.SALE,
          quantity: item.quantity,
          observation: `Venda #${savedSale.id}`,
        },
        employeeId,
        storeId,
      );
    }

    await this.financeService.createFromSale(
      savedSale.id,
      total,
      employeeId,
      storeId,
    );

    return this.findOne(savedSale.id);
  }

  async findAll(
    storeId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Sale[]> {
    const query = this.salesRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.employee', 'employee')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .select([
        'sale',
        'employee.id',
        'employee.name',
        'items',
        'product.id',
        'product.name',
        'product.code',
      ])
      .where('sale.storeId = :storeId', { storeId })
      .orderBy('sale.createdAt', 'DESC');

    if (startDate) {
      query.andWhere('sale.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('sale.createdAt <= :endDate', { endDate });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.salesRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.employee', 'employee')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .select([
        'sale',
        'employee.id',
        'employee.name',
        'items',
        'product.id',
        'product.name',
        'product.code',
      ])
      .where('sale.id = :id', { id })
      .getOne();

    if (!sale) throw new BadRequestException('Venda não encontrada');
    return sale;
  }

  async getDailySummary(
    storeId: string,
    date?: string,
  ): Promise<{
    date: string;
    total: number;
    byPaymentMethod: Record<string, number>;
  }> {
    const target = date ? new Date(date) : new Date();
    const start = new Date(target.setHours(0, 0, 0, 0));
    const end = new Date(target.setHours(23, 59, 59, 999));

    const sales = await this.salesRepository
      .createQueryBuilder('sale')
      .where('sale.storeId = :storeId', { storeId })
      .andWhere('sale.createdAt >= :start', { start })
      .andWhere('sale.createdAt <= :end', { end })
      .getMany();

    const byPaymentMethod: Record<string, number> = {};
    let total = 0;

    for (const sale of sales) {
      total += sale.total;
      byPaymentMethod[sale.paymentMethod] =
        (byPaymentMethod[sale.paymentMethod] ?? 0) + sale.total;
    }

    return { date: start.toISOString().split('T')[0], total, byPaymentMethod };
  }
}
