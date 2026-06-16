import { Body, Controller, Get, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { UserRole, User } from '../users/user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Realizar login' })
  @ApiResponse({ status: 201, description: 'Login realizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Cadastro público de gerente',
    description: 'Rota pública para o dono da loja criar sua conta.',
  })
  @ApiResponse({ status: 201, description: 'Conta criada com sucesso.' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado.' })
  register(@Body() dto: CreateUserDto) {
    return this.usersService.create(
      dto.name,
      dto.email,
      dto.password,
      UserRole.MANAGER,
    );
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retorna dados do usuário logado' })
  @ApiResponse({ status: 200, description: 'Dados do perfil.' })
  getMe(@Request() req: ExpressRequest & { user: User }) {
    return this.usersService.findOnePublic(req.user.id);
  }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualiza nome ou senha do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado.' })
  async updateMe(
    @Request() req: ExpressRequest & { user: User },
    @Body() dto: UpdateProfileDto,
  ) {
    await this.usersService.update(req.user.id, dto);
    return this.usersService.findOnePublic(req.user.id);
  }
}
