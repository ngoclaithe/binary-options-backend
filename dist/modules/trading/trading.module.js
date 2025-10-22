"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const trading_controller_1 = require("./trading.controller");
const trading_service_1 = require("./trading.service");
const trading_gateway_1 = require("./trading.gateway");
const order_entity_1 = require("./entities/order.entity");
const position_entity_1 = require("./entities/position.entity");
const wallet_module_1 = require("../wallet/wallet.module");
const assets_module_1 = require("../assets/assets.module");
const price_feed_module_1 = require("../price-feed/price-feed.module");
let TradingModule = class TradingModule {
};
exports.TradingModule = TradingModule;
exports.TradingModule = TradingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([order_entity_1.Order, position_entity_1.Position]),
            wallet_module_1.WalletModule,
            assets_module_1.AssetsModule,
            price_feed_module_1.PriceFeedModule,
        ],
        controllers: [trading_controller_1.TradingController],
        providers: [trading_service_1.TradingService, trading_gateway_1.TradingGateway],
        exports: [trading_service_1.TradingService, trading_gateway_1.TradingGateway],
    })
], TradingModule);
//# sourceMappingURL=trading.module.js.map