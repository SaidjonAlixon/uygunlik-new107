import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Course } from '../course/course.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; token: string }> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt();
    createUserDto.password = await bcrypt.hash(createUserDto.password, salt);
    
    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);
    
    const userWithCourses = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['courses', 'courses.videos'],
    });
    
    const token = await this._createToken(userWithCourses);
    return { user: userWithCourses, token };
  }

  async login(loginDto: LoginUserDto): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['courses', 'courses.videos'],
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatching = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this._createToken(user);
    return { user, token };
  }

  async findAll(
    page: number,
    limit: number,
    search: string,
  ): Promise<{ data: User[]; total: number }> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.courses', 'courses')
      .leftJoinAndSelect('courses.videos', 'videos');

    if (search) {
      queryBuilder.where(
        'user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await Promise.all([
      queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .getMany(),
      queryBuilder.getCount(),
    ]);

    return { data, total };
  }

  async findById(userId: number): Promise<User> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async findMe(userId: number): Promise<User> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['courses', 'courses.videos'],
    });
  }

  async updateStatus(id: number, status: boolean): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    user.status = status;
    return this.userRepository.save(user);
  }

  async updateCourses(id: number, courseIds: number[]): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['courses'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // Note: You'll need to implement course assignment logic here
    // This is a simplified version
    return this.userRepository.save(user);
  }

  private async _createToken(user: User): Promise<string> {
    const payload = { id: user.id };
    return this.jwtService.signAsync(payload);
  }

  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateProfileDto.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
      user.email = updateProfileDto.email;
    }

    if (updateProfileDto.first_name) {
      user.first_name = updateProfileDto.first_name;
    }

    if (updateProfileDto.last_name) {
      user.last_name = updateProfileDto.last_name;
    }

    if (updateProfileDto.password) {
      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(updateProfileDto.password, salt);
    }

    await this.userRepository.save(user);
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['courses', 'courses.videos'],
    });
  }

  async getUserCourses(userId: number): Promise<Course[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['courses', 'courses.videos'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user.courses;
  }

  async createAdminIfNotExists() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@uygunlik.uz';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    
    const existingAdmin = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const admin = this.userRepository.create({
        email: adminEmail,
        first_name: 'Admin',
        last_name: 'User',
        password: hashedPassword,
        role: 'admin',
        status: true,
      });

      await this.userRepository.save(admin);
      console.log('✅ Admin foydalanuvchi yaratildi:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Parol: ${adminPassword}`);
    } else {
      console.log('ℹ️  Admin foydalanuvchi allaqachon mavjud');
      console.log(`   Email: ${adminEmail}`);
    }
  }

  async updateUserRole(id: number, role: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    user.role = role;
    return this.userRepository.save(user);
  }
}