import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto, storeId: string): Promise<Product> {
    const existing = await this.productsRepository.findOne({
      where: { code: dto.code, storeId },
    });
    if (existing)
      throw new ConflictException('Código de produto já cadastrado');

    const product = this.productsRepository.create({ ...dto, storeId });
    return this.productsRepository.save(product);
  }

  async findAll(storeId: string, search?: string): Promise<Product[]> {
    const query = this.productsRepository
      .createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.storeId = :storeId', { storeId });

    if (search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.code ILIKE :search OR product.color ILIKE :search OR product.size ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    await this.findOne(id);
    await this.productsRepository.update(id, dto);
    return this.findOne(id);
  }

  async deactivate(id: string): Promise<Product> {
    return this.update(id, { isActive: false } as UpdateProductDto);
  }

  async findLowStock(
    storeId: string,
    minQuantity: number = 5,
  ): Promise<Product[]> {
    return this.productsRepository
      .createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.storeId = :storeId', { storeId })
      .andWhere('product.quantity <= :minQuantity', { minQuantity })
      .getMany();
  }
}
