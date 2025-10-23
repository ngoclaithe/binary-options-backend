"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("./entities/order.entity");
const position_entity_1 = require("./entities/position.entity");
const wallet_service_1 = require("../wallet/wallet.service");
const assets_service_1 = require("../assets/assets.service");
const price_feed_service_1 = require("../price-feed/price-feed.service");
let TradingService = class TradingService {
    orderRepository;
    positionRepository;
    walletService;
    assetsService;
    priceFeedService;
    dataSource;
    constructor(orderRepository, positionRepository, walletService, assetsService, priceFeedService, dataSource) {
        this.orderRepository = orderRepository;
        this.positionRepository = positionRepository;
        this.walletService = walletService;
        this.assetsService = assetsService;
        this.priceFeedService = priceFeedService;
        this.dataSource = dataSource;
    }
    async createOrder(userId, createOrderDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const asset = await this.assetsService.findOne(createOrderDto.assetId);
            if (!asset.isAvailable) {
                throw new common_1.BadRequestException('Asset is not available for trading');
            }
            if (createOrderDto.investAmount < asset.minTradeAmount ||
                createOrderDto.investAmount > asset.maxTradeAmount) {
                throw new common_1.BadRequestException(`Investment amount must be between $${asset.minTradeAmount} and $${asset.maxTradeAmount}`);
            }
            await this.walletService.lockBalance(userId, createOrderDto.investAmount);
            const symbol = asset.apiSymbol || asset.symbol;
            const latestFeed = await this.priceFeedService.getLatestPrice(symbol);
            if (!latestFeed) {
                throw new common_1.BadRequestException('Cannot get latest feed price');
            }
            const nextMinuteTimestamp = Number(latestFeed.minuteTimestamp) + 60 * 1000;
            const nextBlock = await this.priceFeedService.getPriceByTimestamp(symbol, nextMinuteTimestamp);
            if (!nextBlock) {
                throw new common_1.BadRequestException(`No price data for next block ${new Date(nextMinuteTimestamp).toISOString()}`);
            }
            const openPrice = nextBlock.open;
            const openTime = nextMinuteTimestamp;
            const closeTime = openTime + createOrderDto.duration * 1000;
            const order = queryRunner.manager.create(order_entity_1.Order, {
                userId,
                assetId: createOrderDto.assetId,
                direction: createOrderDto.direction,
                investAmount: createOrderDto.investAmount,
                openPrice,
                openTime,
                closeTime,
                duration: createOrderDto.duration,
                status: order_entity_1.OrderStatus.ACTIVE,
                profitPercentage: asset.profitPercentage,
            });
            const savedOrder = await queryRunner.manager.save(order);
            await queryRunner.commitTransaction();
            return savedOrder;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async closeOrder(orderId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const order = await queryRunner.manager.findOne(order_entity_1.Order, {
                where: { id: orderId },
                relations: ['asset'],
            });
            if (!order) {
                throw new common_1.NotFoundException(`Order ${orderId} not found`);
            }
            if (order.status !== order_entity_1.OrderStatus.ACTIVE) {
                throw new common_1.BadRequestException(`Order ${orderId} is not active`);
            }
            const symbol = order.asset.apiSymbol || order.asset.symbol;
            console.log(`[CLOSE_ORDER] Start closing order`, {
                id: order.id,
                symbol,
                openPrice: order.openPrice,
                closeTime: order.closeTime,
                closeTimeISO: new Date(Number(order.closeTime)).toISOString(),
            });
            if (!order.closeTime || isNaN(Number(order.closeTime))) {
                throw new common_1.BadRequestException(`Invalid closeTime for order ${order.id}: ${order.closeTime}`);
            }
            const closeBlock = await this.priceFeedService.getPriceByTimestamp(symbol, order.closeTime);
            console.log(`[CLOSE_ORDER] closeBlock`, closeBlock);
            if (!closeBlock) {
                throw new common_1.BadRequestException(`No price block found for ${symbol} at closeTime ${order.closeTime}`);
            }
            const closePriceRaw = closeBlock.close;
            const closePrice = Number(closePriceRaw);
            const openPrice = Number(order.openPrice);
            if (closePriceRaw === undefined ||
                closePriceRaw === null ||
                isNaN(closePrice) ||
                isNaN(openPrice)) {
                console.error('[CLOSE_ORDER] Invalid price data', {
                    openPrice: order.openPrice,
                    closePrice: closeBlock.close,
                });
                throw new common_1.BadRequestException(`Invalid price data (open=${order.openPrice}, close=${closeBlock.close})`);
            }
            order.closePrice = closePrice;
            const priceDiff = closePrice - openPrice;
            let result = 'DRAW';
            if (priceDiff === 0) {
                result = 'DRAW';
                order.status = order_entity_1.OrderStatus.DRAW;
                order.profitAmount = 0;
                await this.walletService.unlockBalance(order.userId, Number(order.investAmount));
            }
            else if ((order.direction === order_entity_1.OrderDirection.UP && priceDiff > 0) ||
                (order.direction === order_entity_1.OrderDirection.DOWN && priceDiff < 0)) {
                result = 'WIN';
                order.status = order_entity_1.OrderStatus.WON;
                order.profitAmount =
                    (Number(order.investAmount) * order.profitPercentage) / 100;
                if (isNaN(order.profitAmount)) {
                    console.error(`[CLOSE_ORDER] Failed to calculate profit amount`, {
                        orderId: order.id,
                        investAmount: order.investAmount,
                        profitPercentage: order.profitPercentage,
                        result: order.profitAmount,
                    });
                    throw new common_1.BadRequestException(`Failed to calculate profit amount. investAmount: ${order.investAmount}, profitPercentage: ${order.profitPercentage}`);
                }
                await this.walletService.processTradeWin(order.userId, Number(order.investAmount), Number(order.profitAmount), order.id);
            }
            else {
                result = 'LOSE';
                order.status = order_entity_1.OrderStatus.LOST;
                order.profitAmount = -Number(order.investAmount);
                if (isNaN(order.profitAmount)) {
                    console.error(`[CLOSE_ORDER] Failed to calculate loss amount`, {
                        orderId: order.id,
                        investAmount: order.investAmount,
                        result: order.profitAmount,
                    });
                    throw new common_1.BadRequestException(`Failed to calculate loss amount. investAmount: ${order.investAmount}`);
                }
                await this.walletService.processTradeLoss(order.userId, Number(order.investAmount), order.id);
            }
            console.log(`[CLOSE_ORDER] Result: ${result}`, {
                openPrice,
                closePrice,
                diff: priceDiff,
                profit: order.profitAmount,
                investAmount: order.investAmount,
                profitPercentage: order.profitPercentage,
            });
            await queryRunner.manager.save(order);
            await this.updatePositionStats(order.userId, order.status, order);
            await queryRunner.commitTransaction();
            console.log(`[CLOSE_ORDER] ✅ Completed ${order.id}`);
            return order;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            console.error(`[CLOSE_ORDER] ❌ Error for order ${orderId}`, error.message);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async updatePositionStats(userId, orderStatus, order) {
        let position = await this.positionRepository.findOne({
            where: { userId },
        });
        if (!position) {
            position = this.positionRepository.create({ userId });
        }
        const investAmount = Number(order.investAmount) || 0;
        const profitAmount = Number(order.profitAmount) || 0;
        if (isNaN(investAmount)) {
            console.error(`[UPDATE_POSITION_STATS] Invalid investAmount for order ${order.id}: ${order.investAmount}`);
            throw new common_1.BadRequestException('Invalid investment amount');
        }
        position.totalTrades = position.totalTrades || 0;
        position.totalWins = position.totalWins || 0;
        position.totalLosses = position.totalLosses || 0;
        position.totalDraws = position.totalDraws || 0;
        position.currentStreak = position.currentStreak || 0;
        position.bestStreak = position.bestStreak || 0;
        position.worstStreak = position.worstStreak || 0;
        position.winRate = position.winRate || 0;
        position.totalTrades += 1;
        const currentTotalInvested = Number(position.totalInvested) || 0;
        position.totalInvested = currentTotalInvested + investAmount;
        if (orderStatus === order_entity_1.OrderStatus.WON) {
            if (isNaN(profitAmount)) {
                console.error(`[UPDATE_POSITION_STATS] Invalid profitAmount for order ${order.id}: ${order.profitAmount}`);
                throw new common_1.BadRequestException('Invalid profit amount');
            }
            position.totalWins += 1;
            const currentTotalProfit = Number(position.totalProfit) || 0;
            position.totalProfit = currentTotalProfit + profitAmount;
            position.currentStreak =
                position.currentStreak >= 0 ? position.currentStreak + 1 : 1;
            if (position.currentStreak > position.bestStreak) {
                position.bestStreak = position.currentStreak;
            }
        }
        else if (orderStatus === order_entity_1.OrderStatus.LOST) {
            position.totalLosses += 1;
            const currentTotalLoss = Number(position.totalLoss) || 0;
            const lossAmount = Math.abs(profitAmount);
            if (isNaN(lossAmount)) {
                console.error(`[UPDATE_POSITION_STATS] Invalid loss amount for order ${order.id}: ${profitAmount}`);
                throw new common_1.BadRequestException('Invalid loss amount');
            }
            position.totalLoss = currentTotalLoss + lossAmount;
            position.currentStreak =
                position.currentStreak <= 0 ? position.currentStreak - 1 : -1;
            if (position.currentStreak < position.worstStreak) {
                position.worstStreak = position.currentStreak;
            }
        }
        else if (orderStatus === order_entity_1.OrderStatus.DRAW) {
            position.totalDraws += 1;
            position.currentStreak = 0;
        }
        if (position.totalTrades > 0) {
            position.winRate = (position.totalWins / position.totalTrades) * 100;
        }
        else {
            position.winRate = 0;
        }
        position.totalInvested = Number(position.totalInvested) || 0;
        position.totalProfit = Number(position.totalProfit) || 0;
        position.totalLoss = Number(position.totalLoss) || 0;
        position.winRate = Number(position.winRate) || 0;
        const fieldsToValidate = {
            totalInvested: position.totalInvested,
            totalProfit: position.totalProfit,
            totalLoss: position.totalLoss,
            winRate: position.winRate,
        };
        for (const [field, value] of Object.entries(fieldsToValidate)) {
            if (isNaN(Number(value)) || value === undefined || value === null) {
                console.error(`[UPDATE_POSITION_STATS] Invalid ${field}: ${value} for user ${userId}`, {
                    position: {
                        totalInvested: position.totalInvested,
                        totalProfit: position.totalProfit,
                        totalLoss: position.totalLoss,
                        winRate: position.winRate,
                    }
                });
                throw new common_1.BadRequestException(`Invalid ${field} value`);
            }
        }
        console.log(`[UPDATE_POSITION_STATS] Saving position for user ${userId}:`, {
            totalTrades: position.totalTrades,
            totalInvested: position.totalInvested,
            totalProfit: position.totalProfit,
            totalLoss: position.totalLoss,
            winRate: position.winRate,
        });
        await this.positionRepository.save(position);
    }
    async getUserOrders(userId, status, limit = 50) {
        const query = this.orderRepository
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.asset', 'asset')
            .where('order.userId = :userId', { userId })
            .orderBy('order.createdAt', 'DESC')
            .limit(limit);
        if (status) {
            query.andWhere('order.status = :status', { status });
        }
        return await query.getMany();
    }
    async getActiveOrders(userId) {
        return await this.orderRepository.find({
            where: { userId, status: order_entity_1.OrderStatus.ACTIVE },
            relations: ['asset'],
            order: { createdAt: 'DESC' },
        });
    }
    async getPositionStats(userId) {
        let position = await this.positionRepository.findOne({
            where: { userId },
        });
        if (!position) {
            position = this.positionRepository.create({ userId });
            await this.positionRepository.save(position);
        }
        return position;
    }
    async getOrderById(orderId, userId) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId, userId },
            relations: ['asset'],
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        return order;
    }
    async cancelOrder(orderId, userId) {
        const order = await this.getOrderById(orderId, userId);
        if (order.status !== order_entity_1.OrderStatus.PENDING && order.status !== order_entity_1.OrderStatus.ACTIVE) {
            throw new common_1.BadRequestException('Cannot cancel this order');
        }
        await this.walletService.unlockBalance(userId, Number(order.investAmount));
        order.status = order_entity_1.OrderStatus.CANCELLED;
        return await this.orderRepository.save(order);
    }
};
exports.TradingService = TradingService;
exports.TradingService = TradingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(position_entity_1.Position)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        wallet_service_1.WalletService,
        assets_service_1.AssetsService,
        price_feed_service_1.PriceFeedService,
        typeorm_2.DataSource])
], TradingService);
//# sourceMappingURL=trading.service.js.map