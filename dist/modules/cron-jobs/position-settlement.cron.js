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
var PositionSettlementCron_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionSettlementCron = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("../trading/entities/order.entity");
const trading_service_1 = require("../trading/trading.service");
const trading_gateway_1 = require("../trading/trading.gateway");
let PositionSettlementCron = PositionSettlementCron_1 = class PositionSettlementCron {
    orderRepository;
    tradingService;
    tradingGateway;
    logger = new common_1.Logger(PositionSettlementCron_1.name);
    isRunning = false;
    constructor(orderRepository, tradingService, tradingGateway) {
        this.orderRepository = orderRepository;
        this.tradingService = tradingService;
        this.tradingGateway = tradingGateway;
    }
    async settleExpiredOrders() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        try {
            const currentTime = Date.now();
            const twoMinutesAgo = currentTime - (2 * 60 * 1000);
            const expiredOrders = await this.orderRepository.find({
                where: {
                    status: order_entity_1.OrderStatus.ACTIVE,
                    closeTime: (0, typeorm_2.LessThanOrEqual)(twoMinutesAgo),
                },
                relations: ['asset', 'user'],
            });
            if (expiredOrders.length === 0) {
                return;
            }
            this.logger.log(`Found ${expiredOrders.length} expired orders to settle (with 2-min delay)`);
            let successCount = 0;
            let failCount = 0;
            for (const order of expiredOrders) {
                try {
                    const timeSinceClose = currentTime - Number(order.closeTime);
                    const minutesSinceClose = Math.floor(timeSinceClose / 60000);
                    this.logger.debug(`Settling order ${order.id} - Close time: ${new Date(Number(order.closeTime)).toISOString()}, ` +
                        `Time since close: ${minutesSinceClose}m ${Math.floor((timeSinceClose % 60000) / 1000)}s`);
                    const closedOrder = await this.tradingService.closeOrder(order.id);
                    this.tradingGateway.notifyOrderClosed(order.userId, closedOrder);
                    successCount++;
                    this.logger.log(`✅ Settled order ${order.id} for user ${order.userId} - Status: ${closedOrder.status}, ` +
                        `Open: ${closedOrder.openPrice}, Close: ${closedOrder.closePrice}, Profit: ${closedOrder.profitAmount}`);
                }
                catch (error) {
                    failCount++;
                    this.logger.error(`❌ Failed to settle order ${order.id}: ${error.message}`, error.stack);
                }
            }
            this.logger.log(`Settlement completed: ${successCount} succeeded, ${failCount} failed`);
        }
        catch (error) {
            this.logger.error(`Failed to settle expired orders: ${error.message}`, error.stack);
        }
        finally {
            this.isRunning = false;
        }
    }
    async cleanupOldData() {
        try {
            this.logger.log('Starting cleanup of old data...');
            const priceFeedService = this.tradingService['priceFeedService'];
            if (priceFeedService && priceFeedService.cleanupOldPrices) {
                await priceFeedService.cleanupOldPrices(30);
            }
            this.logger.log('Cleanup completed successfully');
        }
        catch (error) {
            this.logger.error(`Failed to cleanup old data: ${error.message}`, error.stack);
        }
    }
};
exports.PositionSettlementCron = PositionSettlementCron;
__decorate([
    (0, schedule_1.Cron)('*/10 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PositionSettlementCron.prototype, "settleExpiredOrders", null);
__decorate([
    (0, schedule_1.Cron)('0 2 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PositionSettlementCron.prototype, "cleanupOldData", null);
exports.PositionSettlementCron = PositionSettlementCron = PositionSettlementCron_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        trading_service_1.TradingService,
        trading_gateway_1.TradingGateway])
], PositionSettlementCron);
//# sourceMappingURL=position-settlement.cron.js.map