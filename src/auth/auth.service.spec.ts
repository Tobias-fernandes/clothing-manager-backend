import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

const mockUser = {
  id: 'uuid-1',
  name: 'Tobias',
  email: 'tobias@clothing.com',
  password: 'hashed_password',
  role: 'manager',
  isActive: true,
};

const mockUsersService = {
  findByEmail: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock_token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('deve retornar token e dados do usuário com credenciais válidas', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.login('tobias@clothing.com', '123456');

      expect(result).toHaveProperty('access_token', 'mock_token');
      expect(result.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('deve lançar UnauthorizedException se usuário não existir', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login('inexistente@clothing.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se senha estiver errada', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.login('tobias@clothing.com', 'senha_errada'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se usuário estiver inativo', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(
        service.login('tobias@clothing.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
