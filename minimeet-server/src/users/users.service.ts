import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(email: string, username: string): Promise<User> {
    const user = this.usersRepository.create({ email, username });
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  /**
   * Find multiple users by their IDs in a single query
   * More efficient than multiple findOne calls
   * @param ids - Array of user IDs
   * @returns Array of users (may be fewer than input if some IDs don't exist)
   */
  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.usersRepository.findByIds(ids);
  }

  async update(
    id: string,
    updateData: { username?: string; email?: string; isActive?: boolean },
  ): Promise<User> {
    const user = await this.findOne(id);

    if (updateData.username !== undefined) {
      user.username = updateData.username;
    }
    if (updateData.email !== undefined) {
      user.email = updateData.email;
    }
    if (updateData.isActive !== undefined) {
      user.isActive = updateData.isActive;
    }

    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
}
