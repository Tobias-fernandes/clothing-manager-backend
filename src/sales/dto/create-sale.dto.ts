import {
  IsEnum,
  IsOptional,
  IsArray,
  IsUUID,
  Min,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../sale.entity';

export class SaleItemDto {
  @ApiProperty({ example: 'uuid-do-produto', description: 'ID do produto' })
  @IsUUID('4', { message: 'ID do produto inválido' })
  productId!: string;

  @ApiProperty({
    example: 2,
    description: 'Quantidade do produto na venda (mínimo 1)',
  })
  @IsInt({ message: 'Quantidade deve ser um número inteiro' })
  @Min(1, { message: 'Quantidade deve ser maior que zero' })
  quantity!: number;
}

export class CreateSaleDto {
  @ApiProperty({
    example: PaymentMethod.PIX,
    enum: PaymentMethod,
    description:
      'Forma de pagamento: pix, debit_card, credit_card_cash, credit_card_installment, cash',
  })
  @IsEnum(PaymentMethod, { message: 'Forma de pagamento inválida' })
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({
    example: 3,
    description:
      'Número de parcelas (obrigatório quando pagamento for credit_card_installment, mínimo 2)',
  })
  @IsOptional()
  @IsInt({ message: 'Número de parcelas deve ser um número inteiro' })
  @Min(2, { message: 'Número de parcelas deve ser no mínimo 2' })
  installments?: number;

  @ApiProperty({ type: [SaleItemDto], description: 'Lista de itens da venda' })
  @IsArray({ message: 'Itens da venda são obrigatórios' })
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];
}
