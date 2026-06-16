import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType } from '../stock-movement.entity';

export class CreateMovementDto {
  @ApiProperty({ example: 'uuid-do-produto', description: 'ID do produto' })
  @IsUUID('4', { message: 'ID do produto inválido' })
  productId!: string;

  @ApiProperty({
    example: MovementType.ENTRY,
    enum: MovementType,
    description:
      'Tipo: entry (entrada), exit (saída), adjustment (ajuste), loss (perda), sale (venda)',
  })
  @IsEnum(MovementType, { message: 'Tipo de movimentação inválido' })
  type!: MovementType;

  @ApiProperty({ example: 5, description: 'Quantidade movimentada (mínimo 1)' })
  @IsNumber({}, { message: 'Quantidade inválida' })
  @Min(1, { message: 'Quantidade deve ser maior que zero' })
  quantity!: number;

  @ApiPropertyOptional({
    example: 'Reposição de estoque',
    description: 'Observação sobre a movimentação',
  })
  @IsOptional()
  @IsString()
  observation?: string;
}
