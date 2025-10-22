"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceFeedModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const price_feed_service_1 = require("./price-feed.service");
const price_crawler_service_1 = require("./price-crawler.service");
const price_feed_gateway_1 = require("./price-feed.gateway");
const price_entity_1 = require("./entities/price.entity");
let PriceFeedModule = class PriceFeedModule {
};
exports.PriceFeedModule = PriceFeedModule;
exports.PriceFeedModule = PriceFeedModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([price_entity_1.Price])],
        providers: [price_feed_service_1.PriceFeedService, price_crawler_service_1.PriceCrawlerService, price_feed_gateway_1.PriceFeedGateway],
        exports: [price_feed_service_1.PriceFeedService, price_crawler_service_1.PriceCrawlerService, price_feed_gateway_1.PriceFeedGateway],
    })
], PriceFeedModule);
//# sourceMappingURL=price-feed.module.js.map