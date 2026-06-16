import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    name: string,
    email: string,
    password: string,
    role: UserRole = UserRole.EMPLOYEE,
    storeId?: string,
  ): Promise<User> {
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) throw new ConflictException('Email já cadastrado');

    const hashed = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      name,
      email,
      password: hashed,
      role,
      storeId: storeId ?? undefined,
    });
    const saved = await this.usersRepository.save(user);

    if (role === UserRole.MANAGER) {
      await this.usersRepository.update(saved.id, { storeId: saved.id });
    }

    return this.usersRepository.findOne({
      where: { id: saved.id },
      select: [
        'id',
        'name',
        'email',
        'role',
        'storeId',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    }) as Promise<User>;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findAll(storeId: string): Promise<User[]> {
    if (!storeId) return [];
    return this.usersRepository.find({
      where: { storeId },
      select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async findOnePublic(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'role', 'storeId', 'isActive', 'createdAt', 'updatedAt'],
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.findOne(id);
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    await this.usersRepository.update(id, data);
    return this.findOne(id);
  }

  async deactivate(id: string): Promise<User> {
    return this.update(id, { isActive: false });
  }
}
