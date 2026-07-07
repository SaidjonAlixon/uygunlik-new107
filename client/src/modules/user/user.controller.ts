import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  Get,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Patch,
  Param,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Response } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from './user.schema';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.userService.create(createUserDto);
    res.cookie('jwt', token, { httpOnly: true });
    return { user, token };
  }

  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.userService.login(loginUserDto);
    res.cookie('jwt', token, { httpOnly: true });
    return { user, token };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req) {
    const user = await this.userService.findMe(req.user.id);
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
  ) {
    return this.userService.findAll(page, limit, search);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: boolean) {
    return this.userService.updateStatus(+id, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/courses')
  updateCourses(@Param('id') id: string, @Body('courses') courseIds: number[]) {
    return this.userService.updateCourses(+id, courseIds);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId/courses')
  async getUserCourses(@Param('userId') userId: string) {
    return this.userService.getUserCourses(+userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/role')
  updateUserRole(@Param('id') id: string, @Body('role') role: string) {
    return this.userService.updateUserRole(+id, role);
  }
}
