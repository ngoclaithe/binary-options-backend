import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  async findAll() {
    return await this.assetsService.findAll();
  }

  @Get('active')
  async findActive() {
    return await this.assetsService.findActive();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.assetsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAssetDto: CreateAssetDto) {
    return await this.assetsService.create(createAssetDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateData: Partial<CreateAssetDto>) {
    return await this.assetsService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.assetsService.remove(id);
  }
}