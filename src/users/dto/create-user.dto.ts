import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @ApiProperty({
    example: 'Tobias Fernandes',
    description: 'Nome completo do usuário',
  })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'tobias@clothing.com',
    description: 'Email do usuário',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha do usuário (mínimo 6 caracteres)',
  })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password!: string;

  @ApiProperty({
    example: UserRole.EMPLOYEE,
    enum: UserRole,
    description: 'Papel do usuário: manager ou employee',
  })
  @IsEnum(UserRole, { message: 'Papel inválido' })
  role!: UserRole;
}
