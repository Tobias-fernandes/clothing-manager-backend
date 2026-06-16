import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCategory } from '../product.entity';

export class CreateProductDto {
  @ApiProperty({ example: 'Camiseta Básica', description: 'Nome do produto' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'CAM-001', description: 'Código único do produto' })
  @IsNotEmpty({ message: 'Código é obrigatório' })
  @IsString()
  code!: string;

  @ApiProperty({
    example: ProductCategory.SHIRT,
    enum: ProductCategory,
    description: 'Categoria do produto',
  })
  @IsEnum(ProductCategory, { message: 'Categoria inválida' })
  category!: ProductCategory;

  @ApiProperty({
    example: 'M',
    description: 'Tamanho do produto (ex: P, M, G, GG, 38, 40...)',
  })
  @IsNotEmpty({ message: 'Tamanho é obrigatório' })
  @IsString()
  size!: string;

  @ApiProperty({ example: 'Branca', description: 'Cor do produto' })
  @IsNotEmpty({ message: 'Cor é obrigatória' })
  @IsString()
  color!: string;

  @ApiProperty({ example: 25.0, description: 'Preço de custo do produto' })
  @IsNumber({}, { message: 'Preço de custo inválido' })
  @Min(0)
  costPrice!: number;

  @ApiProperty({ example: 59.9, description: 'Preço de venda do produto' })
  @IsNumber({}, { message: 'Preço de venda inválido' })
  @Min(0)
  salePrice!: number;

  @ApiProperty({ example: 10, description: 'Quantidade inicial em estoque' })
  @IsNumber({}, { message: 'Quantidade inválida' })
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional({
    example: 'Camiseta básica de algodão',
    description: 'Descrição do produto',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
