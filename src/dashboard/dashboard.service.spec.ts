import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Sale, PaymentMethod } from '../sales/sale.entity';
import { Product } from '../products/product.entity';
import { FinanceEntry, EntryType } from '../finance/finance-entry.entity';

const mockSales = [
  {
    id: 'uuid-sale-1',
    paymentMethod: PaymentMethod.PIX,
    total: 59.9,
    createdAt: new Date(),
  },
  {
    id: 'uuid-sale-2',
    paymentMethod: PaymentMethod.PIX,
    total: 40.1,
    createdAt: new Date(),
  },
];

const mockFinanceEntries = [
  {
    id: 'uuid-entry-1',
    type: EntryType.INCOME,
    amount: 100,
    createdAt: new Date(),
  },
  {
    id: 'uuid-entry-2',
    type: EntryType.EXPENSE,
    amount: 50,
    createdAt: new Date(),
  },
];

const mockSaleQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue(mockSales),
};

const mockProductQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getCount: jest.fn().mockResolvedValue(1),
};

const mockFinanceQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue(mockFinanceEntries),
};

const mockSaleRepository = {
  createQueryBuilder: jest.fn().mockReturnValue(mockSaleQueryBuilder),
};

const mockProductRepository = {
  count: jest.fn().mockResolvedValue(5),
  createQueryBuilder: jest.fn().mockReturnValue(mockProductQueryBuilder),
};

const mockFinanceRepository = {
  createQueryBuilder: jest.fn().mockReturnValue(mockFinanceQueryBuilder),
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Sale), useValue: mockSaleRepository },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(FinanceEntry),
          useValue: mockFinanceRepository,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getSummary', () => {
    it('deve retornar resumo completo do dashboard', async () => {
      const result = await service.getSummary('store-1');

      expect(result).toHaveProperty('today');
      expect(result).toHaveProperty('sales');
      expect(result).toHaveProperty('stock');
      expect(result).toHaveProperty('finance');
    });

    it('deve calcular total de vendas do dia corretamente', async () => {
      const result = await service.getSummary('store-1');

      expect(result.sales.totalToday).toBe(100);
      expect(result.sales.countToday).toBe(2);
    });

    it('deve agrupar vendas por forma de pagamento', async () => {
      const result = await service.getSummary('store-1');

      expect(result.sales.byPaymentMethod).toHaveProperty('pix', 100);
    });

    it('deve retornar total de produtos cadastrados', async () => {
      const result = await service.getSummary('store-1');

      expect(result.stock.totalProducts).toBe(5);
    });

    it('deve retornar produtos com estoque baixo', async () => {
      const result = await service.getSummary('store-1');

      expect(result.stock).toHaveProperty('lowStockProducts');
      expect(mockProductQueryBuilder.getCount).toHaveBeenCalled();
    });

    it('deve calcular financeiro do dia corretamente', async () => {
      const result = await service.getSummary('store-1');

      expect(result.finance.totalIncomeToday).toBe(100);
      expect(result.finance.totalExpenseToday).toBe(50);
      expect(result.finance.balance).toBe(50);
    });

    it('saldo acumulado não se zera quando não há lançamentos no dia', async () => {
      const historicalEntries = [
        { type: EntryType.INCOME, amount: 300 },
        { type: EntryType.EXPENSE, amount: 80 },
      ];
      const todayQB = {
        ...mockFinanceQueryBuilder,
        getMany: jest.fn().mockResolvedValue([]),
      };
      const allQB = {
        ...mockFinanceQueryBuilder,
        getMany: jest.fn().mockResolvedValue(historicalEntries),
      };
      mockFinanceRepository.createQueryBuilder
        .mockReturnValueOnce(todayQB)
        .mockReturnValueOnce(allQB);

      const result = await service.getSummary('store-1');

      expect(result.finance.totalIncomeToday).toBe(0);
      expect(result.finance.totalExpenseToday).toBe(0);
      expect(result.finance.balance).toBe(220);
    });

    it('deve retornar as últimas 5 vendas', async () => {
      const result = await service.getSummary('store-1');

      expect(mockSaleQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(result.sales.lastSales).toHaveLength(2);
    });
  });

  describe('isolamento de dados (storeId)', () => {
    it('filtra vendas do dia pelo storeId correto', async () => {
      await service.getSummary('loja-A');

      expect(mockSaleQueryBuilder.where).toHaveBeenCalledWith(
        'sale.storeId = :storeId',
        { storeId: 'loja-A' },
      );
    });

    it('filtra contagem de produtos pelo storeId correto', async () => {
      await service.getSummary('loja-A');

      expect(mockProductRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ storeId: 'loja-A' }) }),
      );
    });

    it('filtra estoque baixo pelo storeId correto', async () => {
      await service.getSummary('loja-A');

      expect(mockProductQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.storeId = :storeId',
        { storeId: 'loja-A' },
      );
    });

    it('filtra entradas financeiras pelo storeId correto', async () => {
      await service.getSummary('loja-A');

      expect(mockFinanceQueryBuilder.where).toHaveBeenCalledWith(
        'entry.storeId = :storeId',
        { storeId: 'loja-A' },
      );
    });

    it('não mistura dados de lojas diferentes', async () => {
      await service.getSummary('loja-B');

      expect(mockSaleQueryBuilder.where).toHaveBeenCalledWith(
        'sale.storeId = :storeId',
        { storeId: 'loja-B' },
      );
      expect(mockSaleQueryBuilder.where).not.toHaveBeenCalledWith(
        'sale.storeId = :storeId',
        { storeId: 'loja-A' },
      );
    });
  });
});
