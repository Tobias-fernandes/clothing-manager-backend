import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntryCategory, EntryType } from '../finance-entry.entity';

export class CreateEntryDto {
  @ApiProperty({
    example: EntryType.EXPENSE,
    enum: EntryType,
    description: 'Tipo: income (entrada) ou expense (saída)',
  })
  @IsEnum(EntryType, { message: 'Tipo de entrada inválido' })
  type!: EntryType;

  @ApiProperty({
    example: EntryCategory.SUPPLIER,
    enum: EntryCategory,
    description: 'Categoria: sale, supplier, maintenance, salary, other',
  })
  @IsEnum(EntryCategory, { message: 'Categoria inválida' })
  category!: EntryCategory;

  @ApiProperty({
    example: 'Compra de mercadorias fornecedor X',
    description: 'Descrição da movimentação financeira',
  })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @IsString()
  description!: string;

  @ApiProperty({
    example: 500.0,
    description: 'Valor da movimentação financeira',
  })
  @IsNumber({}, { message: 'Valor inválido' })
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({
    example: 'uuid-da-venda',
    description: 'ID da venda associada (preenchido automaticamente em vendas)',
  })
  @IsOptional()
  @IsUUID('4')
  saleId?: string;
}
