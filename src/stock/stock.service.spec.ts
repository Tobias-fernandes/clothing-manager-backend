import { Test, TestingModule } from '@nestjs/testing';
import { StockService } from './stock.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StockMovement, MovementType } from './stock-movement.entity';
import { ProductsService } from '../products/products.service';
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

const mockMovement = {
  id: 'uuid-movement-1',
  productId: 'uuid-product-1',
  responsibleId: 'uuid-user-1',
  type: MovementType.ENTRY,
  quantity: 5,
  observation: 'Reposição',
  createdAt: new Date(),
};

const mockQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([mockMovement]),
};

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

const mockProductsService = {
  findOne: jest.fn(),
  update: jest.fn(),
  findLowStock: jest.fn(),
};

describe('StockService', () => {
  let service: StockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: getRepositoryToken(StockMovement),
          useValue: mockRepository,
        },
        { provide: ProductsService, useValue: mockProductsService },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createMovement', () => {
    it('deve registrar entrada e aumentar estoque', async () => {
      mockProductsService.findOne.mockResolvedValue(mockProduct);
      mockRepository.create.mockReturnValue(mockMovement);
      mockRepository.save.mockResolvedValue(mockMovement);

      const result = await service.createMovement(
        {
          productId: 'uuid-product-1',
          type: MovementType.ENTRY,
          quantity: 5,
          observation: 'Reposição',
        },
        'uuid-user-1',
        'store-1',
      );

      expect(mockProductsService.update).toHaveBeenCalledWith(mockProduct.id, {
        quantity: mockProduct.quantity + 5,
      });
      expect(result).toEqual(mockMovement);
    });

    it('deve registrar saída e diminuir estoque', async () => {
      mockProductsService.findOne.mockResolvedValue(mockProduct);
      mockRepository.create.mockReturnValue(mockMovement);
      mockRepository.save.mockResolvedValue(mockMovement);

      await service.createMovement(
        {
          productId: 'uuid-product-1',
          type: MovementType.EXIT,
          quantity: 3,
        },
        'uuid-user-1',
        'store-1',
      );

      expect(mockProductsService.update).toHaveBeenCalledWith(mockProduct.id, {
        quantity: mockProduct.quantity - 3,
      });
    });

    it('deve lançar BadRequestException se quantidade insuficiente', async () => {
      mockProductsService.findOne.mockResolvedValue({
        ...mockProduct,
        quantity: 2,
      });

      await expect(
        service.createMovement(
          {
            productId: 'uuid-product-1',
            type: MovementType.EXIT,
            quantity: 5,
          },
          'uuid-user-1',
          'store-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve registrar ajuste e substituir quantidade', async () => {
      mockProductsService.findOne.mockResolvedValue(mockProduct);
      mockRepository.create.mockReturnValue(mockMovement);
      mockRepository.save.mockResolvedValue(mockMovement);

      await service.createMovement(
        {
          productId: 'uuid-product-1',
          type: MovementType.ADJUSTMENT,
          quantity: 20,
        },
        'uuid-user-1',
        'store-1',
      );

      expect(mockProductsService.update).toHaveBeenCalledWith(mockProduct.id, {
        quantity: 20,
      });
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de movimentações', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll('store-1');

      expect(result).toHaveLength(1);
    });

    it('deve filtrar movimentações por produto', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll('store-1', 'uuid-product-1');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'movement.productId = :productId',
        { productId: 'uuid-product-1' },
      );
    });
  });

  describe('findLowStock', () => {
    it('deve retornar produtos com estoque baixo', async () => {
      mockProductsService.findLowStock.mockResolvedValue([mockProduct]);

      const result = await service.findLowStock('store-1', 5);

      expect(result).toHaveLength(1);
      expect(mockProductsService.findLowStock).toHaveBeenCalledWith('store-1', 5);
    });
  });

  describe('isolamento de dados (storeId)', () => {
    it('createMovement: salva a movimentação com o storeId correto', async () => {
      mockProductsService.findOne.mockResolvedValue(mockProduct);
      mockRepository.create.mockReturnValue(mockMovement);
      mockRepository.save.mockResolvedValue(mockMovement);

      await service.createMovement(
        { productId: 'uuid-product-1', type: MovementType.ENTRY, quantity: 5 },
        'uuid-user-1',
        'loja-A',
      );

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ storeId: 'loja-A' }),
      );
    });

    it('findAll: filtra movimentações pelo storeId da loja correta', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll('loja-A');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'movement.storeId = :storeId',
        { storeId: 'loja-A' },
      );
    });

    it('findAll: não aplica o filtro de outra loja', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll('loja-B');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'movement.storeId = :storeId',
        { storeId: 'loja-B' },
      );
      expect(mockQueryBuilder.where).not.toHaveBeenCalledWith(
        'movement.storeId = :storeId',
        { storeId: 'loja-A' },
      );
    });

    it('findLowStock: delega o storeId ao ProductsService', async () => {
      mockProductsService.findLowStock.mockResolvedValue([mockProduct]);

      await service.findLowStock('loja-A', 5);

      expect(mockProductsService.findLowStock).toHaveBeenCalledWith('loja-A', 5);
    });
  });
});
