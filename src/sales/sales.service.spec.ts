import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Sale, PaymentMethod } from './sale.entity';
import { SaleItem } from './sale-item.entity';
import { ProductsService } from '../products/products.service';
import { StockService } from '../stock/stock.service';
import { FinanceService } from '../finance/finance.service';
import { BadRequestException } from '@nestjs/common';
import { ProductCategory } from '../products/product.entity';

const mockProduct = {
  id: 'uuid-product-1',
  name: 'Camiseta Básica',
  code: 'CAM-001',
  category: ProductCategory.SHIRT,
  size: 'M',
  color: 'Branca',
  costPrice: 25,
  salePrice: 59.9,
  quantity: 10,
  isActive: true,
};

const mockSale = {
  id: 'uuid-sale-1',
  employeeId: 'uuid-user-1',
  paymentMethod: PaymentMethod.PIX,
  installments: null,
  total: 59.9,
  createdAt: new Date(),
};

const mockQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([mockSale]),
  getOne: jest.fn().mockResolvedValue(mockSale),
};

const mockSaleRepository = {
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

const mockSaleItemRepository = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockProductsService = {
  findOne: jest.fn(),
  update: jest.fn(),
};

const mockStockService = {
  createMovement: jest.fn(),
};

const mockFinanceService = {
  createFromSale: jest.fn(),
};

describe('SalesService', () => {
  let service: SalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: getRepositoryToken(Sale), useValue: mockSaleRepository },
        {
          provide: getRepositoryToken(SaleItem),
          useValue: mockSaleItemRepository,
        },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: StockService, useValue: mockStockService },
        { provide: FinanceService, useValue: mockFinanceService },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar uma venda com sucesso', async () => {
      mockProductsService.findOne.mockResolvedValue(mockProduct);
      mockSaleRepository.create.mockReturnValue(mockSale);
      mockSaleRepository.save.mockResolvedValue(mockSale);
      mockSaleItemRepository.create.mockReturnValue({});
      mockSaleItemRepository.save.mockResolvedValue({});
      mockQueryBuilder.getOne.mockResolvedValue({
        ...mockSale,
        employee: { id: 'uuid-user-1', name: 'Tobias' },
        items: [],
      });

      const result = await service.create(
        {
          paymentMethod: PaymentMethod.PIX,
          items: [{ productId: 'uuid-product-1', quantity: 1 }],
        },
        'uuid-user-1',
        'store-1',
      );

      expect(result).toHaveProperty('id', mockSale.id);
      expect(mockStockService.createMovement).toHaveBeenCalled();
      expect(mockFinanceService.createFromSale).toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se estoque insuficiente', async () => {
      mockProductsService.findOne.mockResolvedValue({
        ...mockProduct,
        quantity: 0,
      });

      await expect(
        service.create(
          {
            paymentMethod: PaymentMethod.PIX,
            items: [{ productId: 'uuid-product-1', quantity: 1 }],
          },
          'uuid-user-1',
          'store-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se produto estiver inativo', async () => {
      mockProductsService.findOne.mockResolvedValue({
        ...mockProduct,
        isActive: false,
      });

      await expect(
        service.create(
          {
            paymentMethod: PaymentMethod.PIX,
            items: [{ productId: 'uuid-product-1', quantity: 1 }],
          },
          'uuid-user-1',
          'store-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se cartão parcelado sem parcelas', async () => {
      await expect(
        service.create(
          {
            paymentMethod: PaymentMethod.CREDIT_CARD_INSTALLMENT,
            items: [{ productId: 'uuid-product-1', quantity: 1 }],
          },
          'uuid-user-1',
          'store-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve aceitar venda parcelada com parcelas informadas', async () => {
      mockProductsService.findOne.mockResolvedValue(mockProduct);
      mockSaleRepository.create.mockReturnValue({
        ...mockSale,
        paymentMethod: PaymentMethod.CREDIT_CARD_INSTALLMENT,
        installments: 3,
      });
      mockSaleRepository.save.mockResolvedValue({
        ...mockSale,
        paymentMethod: PaymentMethod.CREDIT_CARD_INSTALLMENT,
        installments: 3,
      });
      mockSaleItemRepository.create.mockReturnValue({});
      mockSaleItemRepository.save.mockResolvedValue({});
      mockQueryBuilder.getOne.mockResolvedValue({
        ...mockSale,
        paymentMethod: PaymentMethod.CREDIT_CARD_INSTALLMENT,
        installments: 3,
        employee: { id: 'uuid-user-1', name: 'Tobias' },
        items: [],
      });

      const result = await service.create(
        {
          paymentMethod: PaymentMethod.CREDIT_CARD_INSTALLMENT,
          installments: 3,
          items: [{ productId: 'uuid-product-1', quantity: 1 }],
        },
        'uuid-user-1',
        'store-1',
      );

      expect(result.installments).toBe(3);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de vendas', async () => {
      mockSaleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll('store-1');

      expect(result).toHaveLength(1);
    });

    it('deve filtrar vendas por período', async () => {
      mockSaleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll('store-1', '2026-05-01', '2026-05-31');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });
  });

  describe('getDailySummary', () => {
    it('deve retornar resumo do dia com total por forma de pagamento', async () => {
      mockSaleRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getMany: jest.fn().mockResolvedValue([
          { ...mockSale, paymentMethod: PaymentMethod.PIX, total: 59.9 },
          { ...mockSale, paymentMethod: PaymentMethod.PIX, total: 40.1 },
        ]),
      });

      const result = await service.getDailySummary('store-1');

      expect(result.total).toBe(100);
      expect(result.byPaymentMethod).toHaveProperty('pix', 100);
    });
  });

  describe('isolamento de dados (storeId)', () => {
    it('create: salva a venda com o storeId correto', async () => {
      mockProductsService.findOne.mockResolvedValue(mockProduct);
      mockSaleRepository.create.mockReturnValue(mockSale);
      mockSaleRepository.save.mockResolvedValue(mockSale);
      mockSaleItemRepository.create.mockReturnValue({});
      mockSaleItemRepository.save.mockResolvedValue({});
      mockQueryBuilder.getOne.mockResolvedValue({
        ...mockSale,
        employee: { id: 'uuid-user-1', name: 'Tobias' },
        items: [],
      });

      await service.create(
        { paymentMethod: PaymentMethod.PIX, items: [{ productId: 'uuid-product-1', quantity: 1 }] },
        'uuid-user-1',
        'loja-A',
      );

      expect(mockSaleRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ storeId: 'loja-A' }),
      );
    });

    it('create: propaga o storeId para o estoque e financeiro', async () => {
      mockProductsService.findOne.mockResolvedValue(mockProduct);
      mockSaleRepository.create.mockReturnValue(mockSale);
      mockSaleRepository.save.mockResolvedValue(mockSale);
      mockSaleItemRepository.create.mockReturnValue({});
      mockSaleItemRepository.save.mockResolvedValue({});
      mockQueryBuilder.getOne.mockResolvedValue({
        ...mockSale,
        employee: { id: 'uuid-user-1', name: 'Tobias' },
        items: [],
      });

      await service.create(
        { paymentMethod: PaymentMethod.PIX, items: [{ productId: 'uuid-product-1', quantity: 1 }] },
        'uuid-user-1',
        'loja-A',
      );

      expect(mockStockService.createMovement).toHaveBeenCalledWith(
        expect.anything(),
        'uuid-user-1',
        'loja-A',
      );
      expect(mockFinanceService.createFromSale).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'uuid-user-1',
        'loja-A',
      );
    });

    it('findAll: filtra vendas pelo storeId da loja correta', async () => {
      mockSaleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll('loja-A');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'sale.storeId = :storeId',
        { storeId: 'loja-A' },
      );
    });

    it('findAll: não aplica o filtro de outra loja', async () => {
      mockSaleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll('loja-B');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'sale.storeId = :storeId',
        { storeId: 'loja-B' },
      );
      expect(mockQueryBuilder.where).not.toHaveBeenCalledWith(
        'sale.storeId = :storeId',
        { storeId: 'loja-A' },
      );
    });

    it('getDailySummary: filtra vendas do dia pelo storeId correto', async () => {
      mockSaleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getDailySummary('loja-A');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'sale.storeId = :storeId',
        { storeId: 'loja-A' },
      );
    });
  });
});
