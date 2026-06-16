import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCategory } from '../product.entity';

export class UpdateProductDto {
  @ApiPropertyOptional({
    example: 'Camiseta Básica',
    description: 'Nome do produto',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'CAM-001',
    description: 'Código único do produto',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    example: ProductCategory.SHIRT,
    enum: ProductCategory,
    description: 'Categoria do produto',
  })
  @IsOptional()
  @IsEnum(ProductCategory, { message: 'Categoria inválida' })
  category?: ProductCategory;

  @ApiPropertyOptional({ example: 'M', description: 'Tamanho do produto' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ example: 'Branca', description: 'Cor do produto' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    example: 25.0,
    description: 'Preço de custo do produto',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Preço de custo inválido' })
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({
    example: 59.9,
    description: 'Preço de venda do produto',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Preço de venda inválido' })
  @Min(0)
  salePrice?: number;

  @ApiPropertyOptional({ example: 10, description: 'Quantidade em estoque' })
  @IsOptional()
  @IsNumber({}, { message: 'Quantidade inválida' })
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({
    example: 'Camiseta básica de algodão',
    description: 'Descrição do produto',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
