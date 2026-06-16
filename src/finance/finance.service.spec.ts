import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from './finance.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FinanceEntry, EntryType, EntryCategory } from './finance-entry.entity';

const mockEntry = {
  id: 'uuid-entry-1',
  type: EntryType.INCOME,
  category: EntryCategory.SALE,
  description: 'Venda #uuid-sale-1',
  amount: 59.9,
  saleId: 'uuid-sale-1',
  responsibleId: 'uuid-user-1',
  createdAt: new Date(),
};

const mockQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([mockEntry]),
};

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

describe('FinanceService', () => {
  let service: FinanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: getRepositoryToken(FinanceEntry), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar uma entrada financeira com sucesso', async () => {
      mockRepository.create.mockReturnValue(mockEntry);
      mockRepository.save.mockResolvedValue(mockEntry);

      const result = await service.create(
        {
          type: EntryType.INCOME,
          category: EntryCategory.SALE,
          description: 'Venda #uuid-sale-1',
          amount: 59.9,
        },
        'uuid-user-1',
        'store-1',
      );

      expect(result).toEqual(mockEntry);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EntryType.INCOME,
          amount: 59.9,
          responsibleId: 'uuid-user-1',
        }),
      );
    });

    it('deve criar uma saída financeira com sucesso', async () => {
      const mockExpense = {
        ...mockEntry,
        type: EntryType.EXPENSE,
        category: EntryCategory.SUPPLIER,
        description: 'Compra de mercadorias',
        amount: 500,
        saleId: null,
      };

      mockRepository.create.mockReturnValue(mockExpense);
      mockRepository.save.mockResolvedValue(mockExpense);

      const result = await service.create(
        {
          type: EntryType.EXPENSE,
          category: EntryCategory.SUPPLIER,
          description: 'Compra de mercadorias',
          amount: 500,
        },
        'uuid-user-1',
        'store-1',
      );

      expect(result.type).toBe(EntryType.EXPENSE);
      expect(result.amount).toBe(500);
    });
  });

  describe('createFromSale', () => {
    it('deve criar entrada financeira automaticamente a partir de uma venda', async () => {
      mockRepository.create.mockReturnValue(mockEntry);
      mockRepository.save.mockResolvedValue(mockEntry);

      const result = await service.createFromSale(
        'uuid-sale-1',
        59.9,
        'uuid-user-1',
        'store-1',
      );

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EntryType.INCOME,
          category: EntryCategory.SALE,
          amount: 59.9,
          saleId: 'uuid-sale-1',
        }),
      );
      expect(result).toEqual(mockEntry);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de entradas financeiras', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll('store-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockEntry);
    });

    it('deve filtrar por tipo income', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll('store-1', undefined, undefined, EntryType.INCOME);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.type = :type',
        { type: EntryType.INCOME },
      );
    });

    it('deve filtrar por período', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll('store-1', '2026-05-01', '2026-05-31');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });
  });

  describe('getSummary', () => {
    it('deve retornar resumo com totalIncome, totalExpense e balance', async () => {
      mockRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getMany: jest.fn().mockResolvedValue([
          { ...mockEntry, type: EntryType.INCOME, amount: 200 },
          { ...mockEntry, type: EntryType.INCOME, amount: 100 },
          { ...mockEntry, type: EntryType.EXPENSE, amount: 150 },
        ]),
      });

      const result = await service.getSummary('store-1');

      expect(result.totalIncome).toBe(300);
      expect(result.totalExpense).toBe(150);
      expect(result.balance).toBe(150);
    });

    it('deve retornar balance negativo quando despesas superam receitas', async () => {
      mockRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getMany: jest.fn().mockResolvedValue([
          { ...mockEntry, type: EntryType.INCOME, amount: 100 },
          { ...mockEntry, type: EntryType.EXPENSE, amount: 500 },
        ]),
      });

      const result = await service.getSummary('store-1');

      expect(result.balance).toBe(-400);
    });
  });

  describe('isolamento de dados (storeId)', () => {
    it('create: salva a entrada financeira com o storeId correto', async () => {
      mockRepository.create.mockReturnValue(mockEntry);
      mockRepository.save.mockResolvedValue(mockEntry);

      await service.create(
        { type: EntryType.INCOME, category: EntryCategory.SALE, description: 'Teste', amount: 100 },
        'uuid-user-1',
        'loja-A',
      );

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ storeId: 'loja-A' }),
      );
    });

    it('createFromSale: propagra o storeId para a entrada financeira', async () => {
      mockRepository.create.mockReturnValue(mockEntry);
      mockRepository.save.mockResolvedValue(mockEntry);

      await service.createFromSale('uuid-sale-1', 59.9, 'uuid-user-1', 'loja-A');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ storeId: 'loja-A' }),
      );
    });

    it('findAll: filtra entradas pelo storeId da loja correta', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll('loja-A');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entry.storeId = :storeId',
        { storeId: 'loja-A' },
      );
    });

    it('findAll: não aplica o filtro de outra loja', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll('loja-B');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entry.storeId = :storeId',
        { storeId: 'loja-B' },
      );
      expect(mockQueryBuilder.where).not.toHaveBeenCalledWith(
        'entry.storeId = :storeId',
        { storeId: 'loja-A' },
      );
    });
  });
});
