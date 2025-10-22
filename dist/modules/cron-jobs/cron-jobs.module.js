"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronJobsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const price_update_cron_1 = require("./price-update.cron");
const position_settlement_cron_1 = require("./position-settlement.cron");
const order_entity_1 = require("../trading/entities/order.entity");
const price_feed_module_1 = require("../price-feed/price-feed.module");
const assets_module_1 = require("../assets/assets.module");
const trading_module_1 = require("../trading/trading.module");
let CronJobsModule = class CronJobsModule {
};
exports.CronJobsModule = CronJobsModule;
exports.CronJobsModule = CronJobsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([order_entity_1.Order]),
            price_feed_module_1.PriceFeedModule,
            assets_module_1.AssetsModule,
            trading_module_1.TradingModule,
        ],
        providers: [price_update_cron_1.PriceUpdateCron, position_settlement_cron_1.PositionSettlementCron],
    })
], CronJobsModule);
//# sourceMappingURL=cron-jobs.module.js.map