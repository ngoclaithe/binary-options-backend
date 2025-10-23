import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { TradingService } from './trading.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './entities/order.entity';

@Controller('trading')
@UseGuards(JwtAuthGuard)
export class TradingController {
  constructor(private readonly tradingService: TradingService) { }

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    // console.log('📦 [DEBUG] Received DTO:', createOrderDto);
    // console.log('📦 [DEBUG] Raw body type info:', {
    //   assetId: typeof createOrderDto.assetId,
    //   direction: typeof createOrderDto.direction,
    //   investAmount: typeof createOrderDto.investAmount,
    //   duration: typeof createOrderDto.duration,
    // });

    return await this.tradingService.createOrder(req.user.userId, createOrderDto);
  }


  @Get('orders')
  async getUserOrders(
    @Request() req,
    @Query('status') status?: OrderStatus,
    @Query('limit') limit: number = 50,
  ) {
    return await this.tradingService.getUserOrders(
      req.user.userId,
      status,
      limit,
    );
  }

  @Get('orders/active')
  async getActiveOrders(@Request() req) {
    return await this.tradingService.getActiveOrders(req.user.userId);
  }

  @Get('orders/:id')
  async getOrderById(@Request() req, @Param('id') id: string) {
    return await this.tradingService.getOrderById(id, req.user.userId);
  }

  @Delete('orders/:id')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(@Request() req, @Param('id') id: string) {
    return await this.tradingService.cancelOrder(id, req.user.userId);
  }

  @Get('position/stats')
  async getPositionStats(@Request() req) {
    return await this.tradingService.getPositionStats(req.user.userId);
  }
}