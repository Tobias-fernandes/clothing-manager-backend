import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement, MovementType } from './stock-movement.entity';
import { CreateMovementDto } from './dto/create-movement.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockMovement)
    private movementsRepository: Repository<StockMovement>,
    private productsService: ProductsService,
  ) {}

  async createMovement(
    dto: CreateMovementDto,
    responsibleId: string,
    storeId: string,
  ): Promise<StockMovement> {
    const product = await this.productsService.findOne(dto.productId);

    if (
      dto.type === MovementType.EXIT ||
      dto.type === MovementType.SALE ||
      dto.type === MovementType.LOSS
    ) {
      if (product.quantity < dto.quantity) {
        throw new BadRequestException('Quantidade insuficiente em estoque');
      }
      await this.productsService.update(product.id, {
        quantity: product.quantity - dto.quantity,
      });
    } else if (dto.type === MovementType.ENTRY) {
      await this.productsService.update(product.id, {
        quantity: product.quantity + dto.quantity,
      });
    } else if (dto.type === MovementType.ADJUSTMENT) {
      await this.productsService.update(product.id, { quantity: dto.quantity });
    }

    const movement = this.movementsRepository.create({
      ...dto,
      responsibleId,
      storeId,
    });
    return this.movementsRepository.save(movement);
  }

  async findAll(storeId: string, productId?: string): Promise<StockMovement[]> {
    const query = this.movementsRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('movement.responsible', 'responsible')
      .select([
        'movement',
        'product.id',
        'product.name',
        'product.code',
        'responsible.id',
        'responsible.name',
      ])
      .where('movement.storeId = :storeId', { storeId })
      .orderBy('movement.createdAt', 'DESC');

    if (productId) {
      query.andWhere('movement.productId = :productId', { productId });
    }

    return query.getMany();
  }

  async findLowStock(
    storeId: string,
    minQuantity: number = 5,
  ): Promise<{ id: string; name: string; code: string; quantity: number }[]> {
    return this.productsService.findLowStock(storeId, minQuantity);
  }
}
