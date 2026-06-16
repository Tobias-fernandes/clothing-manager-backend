import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product, ProductCategory } from './product.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockProduct = {
  id: 'uuid-1',
  name: 'Camiseta Básica',
  code: 'CAM-001',
  category: ProductCategory.SHIRT,
  size: 'M',
  color: 'Branca',
  costPrice: 25,
  salePrice: 59.9,
  quantity: 10,
  description: 'Camiseta básica de algodão',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([mockProduct]),
  getCount: jest.fn().mockResolvedValue(1),
};

const mockRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar um produto com sucesso', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockProduct);
      mockRepository.save.mockResolvedValue(mockProduct);

      const result = await service.create({
        name: 'Camiseta Básica',
        code: 'CAM-001',
        category: ProductCategory.SHIRT,
        size: 'M',
        color: 'Branca',
        costPrice: 25,
        salePrice: 59.9,
        quantity: 10,
      }, 'store-1');

      expect(result).toEqual(mockProduct);
    });

    it('deve lançar ConflictException se código já existir', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      await expect(
        service.create({
          name: 'Camiseta Básica',
          code: 'CAM-001',
          category: ProductCategory.SHIRT,
          size: 'M',
          color: 'Branca',
          costPrice: 25,
          salePrice: 59.9,
          quantity: 10,
        }, 'store-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de produtos ativos', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll('store-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockProduct);
    });

    it('deve filtrar produtos por busca', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll('store-1', 'camiseta');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('deve retornar um produto pelo id', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(mockProduct);
    });

    it('deve lançar NotFoundException se produto não existir', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivate', () => {
    it('deve inativar um produto', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce({ ...mockProduct, isActive: false });
      mockRepository.update.mockResolvedValue(undefined);

      const result = await service.deactivate('uuid-1');

      expect(result.isActive).toBe(false);
    });
  });

  describe('findLowStock', () => {
    it('deve retornar produtos com estoque baixo', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findLowStock('store-1', 5);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('isolamento de dados (storeId)', () => {
    const dto = {
      name: 'Camiseta Básica',
      code: 'CAM-001',
      category: ProductCategory.SHIRT,
      size: 'M',
      color: 'Branca',
      costPrice: 25,
      salePrice: 59.9,
      quantity: 10,
    };

    it('create: salva o produto com o storeId correto', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockProduct);
      mockRepository.save.mockResolvedValue(mockProduct);

      await service.create(dto, 'loja-A');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ storeId: 'loja-A' }),
      );
    });

    it('findAll: filtra produtos pelo storeId da loja correta', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll('loja-A');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.storeId = :storeId',
        { storeId: 'loja-A' },
      );
    });

    it('findAll: não aplica o filtro de outra loja', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll('loja-B');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.storeId = :storeId',
        { storeId: 'loja-B' },
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'product.storeId = :storeId',
        { storeId: 'loja-A' },
      );
    });

    it('findLowStock: filtra estoque baixo pelo storeId correto', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findLowStock('loja-A');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.storeId = :storeId',
        { storeId: 'loja-A' },
      );
    });
  });
});
