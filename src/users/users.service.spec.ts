import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './user.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
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
  role: UserRole.MANAGER,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar um usuário com senha hasheada', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);
      mockRepository.findOne.mockResolvedValueOnce({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });

      const result = await service.create(
        'Tobias',
        'tobias@clothing.com',
        '123456',
        UserRole.MANAGER,
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
      expect(result.password).toBeUndefined();
    });

    it('deve lançar ConflictException se email já existir', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.create(
          'Tobias',
          'tobias@clothing.com',
          '123456',
          UserRole.MANAGER,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de usuários sem senha', async () => {
      mockRepository.find.mockResolvedValue([mockUser]);

      const result = await service.findAll('uuid-1');

      expect(result).toHaveLength(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { storeId: 'uuid-1' },
        select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt'],
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar um usuário pelo id', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(mockUser);
    });

    it('deve lançar NotFoundException se usuário não existir', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivate', () => {
    it('deve inativar um usuário', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue(undefined);
      mockRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({
          ...mockUser,
          isActive: false,
        });

      const result = await service.deactivate('uuid-1');

      expect(result.isActive).toBe(false);
    });
  });

  describe('isolamento de dados (storeId)', () => {
    it('create (manager): define o storeId como o próprio id do usuário', async () => {
      const savedManager = { ...mockUser, id: 'mgr-1', role: UserRole.MANAGER };
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.create.mockReturnValue(savedManager);
      mockRepository.save.mockResolvedValue(savedManager);
      mockRepository.update.mockResolvedValue(undefined);
      mockRepository.findOne.mockResolvedValueOnce({ ...savedManager, storeId: 'mgr-1' });

      await service.create('Manager', 'mgr@test.com', '123456', UserRole.MANAGER);

      expect(mockRepository.update).toHaveBeenCalledWith(
        'mgr-1',
        { storeId: 'mgr-1' },
      );
    });

    it('create (employee): herda o storeId passado pelo manager', async () => {
      const savedEmployee = { ...mockUser, id: 'emp-1', role: UserRole.EMPLOYEE };
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.create.mockReturnValue(savedEmployee);
      mockRepository.save.mockResolvedValue(savedEmployee);
      mockRepository.findOne.mockResolvedValueOnce(savedEmployee);

      await service.create('Funcionário', 'emp@test.com', '123456', UserRole.EMPLOYEE, 'mgr-1');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ storeId: 'mgr-1' }),
      );
    });

    it('findAll: filtra usuários pelo storeId da loja correta', async () => {
      mockRepository.find.mockResolvedValue([mockUser]);

      await service.findAll('loja-A');

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { storeId: 'loja-A' } }),
      );
    });

    it('findAll: não retorna usuários de outra loja', async () => {
      mockRepository.find.mockResolvedValue([mockUser]);

      await service.findAll('loja-B');

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { storeId: 'loja-B' } }),
      );
      expect(mockRepository.find).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: { storeId: 'loja-A' } }),
      );
    });
  });
});
