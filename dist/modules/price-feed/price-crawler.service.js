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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PriceCrawlerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceCrawlerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = __importDefault(require("axios"));
const detailed_price_data_entity_1 = require("./entities/detailed-price-data.entity");
let PriceCrawlerService = PriceCrawlerService_1 = class PriceCrawlerService {
    configService;
    detailedPriceRepo;
    logger = new common_1.Logger(PriceCrawlerService_1.name);
    baseUrl;
    previousPriceData = new Map();
    constructor(configService, detailedPriceRepo) {
        this.configService = configService;
        this.detailedPriceRepo = detailedPriceRepo;
        this.baseUrl =
            this.configService.get('app.priceApiUrl') ||
                'https://api.binance.com/api/v3';
    }
    async fetchPriceFromBinance(symbol) {
        try {
            const tickerResponse = await axios_1.default.get(`${this.baseUrl}/ticker/price`, {
                params: { symbol },
            });
            const ticker24hResponse = await axios_1.default.get(`${this.baseUrl}/ticker/24hr`, {
                params: { symbol },
            });
            const ticker24h = ticker24hResponse.data;
            const currentData = {
                symbol: symbol,
                price: parseFloat(tickerResponse.data.price),
                timestamp: Date.now(),
                open: parseFloat(ticker24h.openPrice),
                high: parseFloat(ticker24h.highPrice),
                low: parseFloat(ticker24h.lowPrice),
                close: parseFloat(ticker24h.lastPrice),
                volume: parseFloat(ticker24h.volume),
            };
            await this.generateAndSaveDetailedPrices(symbol, currentData);
            return currentData;
        }
        catch (error) {
            this.logger.error(`Failed to fetch price for ${symbol} from Binance: ${error.message}`);
            return null;
        }
    }
    async generateAndSaveDetailedPrices(symbol, currentData) {
        const previousData = this.previousPriceData.get(symbol);
        if (!previousData) {
            this.previousPriceData.set(symbol, currentData);
            return;
        }
        try {
            const secondsData = [];
            const minuteTimestamp = this.roundToMinute(previousData.timestamp);
            let minuteHigh = -Infinity;
            let minuteLow = Infinity;
            for (let i = 0; i < 60; i++) {
                const progress = i / 60;
                const timestamp = previousData.timestamp + i * 1000;
                const interpolated = this.interpolatePrice(previousData, currentData, progress);
                minuteHigh = Math.max(minuteHigh, interpolated.high);
                minuteLow = Math.min(minuteLow, interpolated.low);
                secondsData.push({
                    t: timestamp,
                    p: interpolated.price,
                    o: interpolated.open,
                    h: interpolated.high,
                    l: interpolated.low,
                    c: interpolated.close,
                    v: interpolated.volume,
                });
            }
            const detailedPrice = this.detailedPriceRepo.create({
                symbol,
                minuteTimestamp,
                minuteOpen: secondsData[0].o,
                minuteHigh,
                minuteLow,
                minuteClose: secondsData[secondsData.length - 1].c,
                minuteVolume: secondsData.reduce((sum, d) => sum + d.v, 0),
                secondsData,
            });
            await this.detailedPriceRepo.save(detailedPrice);
            this.logger.debug(`Saved 60 seconds data for ${symbol} at minute ${new Date(minuteTimestamp).toISOString()}`);
            this.previousPriceData.set(symbol, currentData);
        }
        catch (error) {
            this.logger.error(`Failed to generate detailed prices for ${symbol}: ${error.message}`);
        }
    }
    interpolatePrice(startData, endData, progress) {
        const basePrice = startData.price + (endData.price - startData.price) * progress;
        const noise = (Math.random() - 0.5) * basePrice * 0.0005;
        const price = basePrice + noise;
        const priceRange = Math.abs(endData.price - startData.price);
        const volatilityFactor = Math.random() * 0.3;
        const open = progress === 0
            ? startData.close
            : basePrice * (1 + (Math.random() - 0.5) * 0.001);
        const close = price;
        const maxOC = Math.max(open, close);
        const minOC = Math.min(open, close);
        const high = maxOC + priceRange * volatilityFactor * Math.random();
        const low = minOC - priceRange * volatilityFactor * Math.random();
        const baseVolume = (endData.volume - (startData.volume || 0)) / 60;
        const volumeMultiplier = 1 + Math.abs(progress - 0.5);
        const volume = baseVolume * volumeMultiplier * (0.8 + Math.random() * 0.4);
        return {
            price,
            open,
            high,
            low,
            close,
            volume,
        };
    }
    roundToMinute(timestamp) {
        return Math.floor(timestamp / 60000) * 60000;
    }
    async fetchPriceFromAlternative(symbol) {
        try {
            const coinGeckoUrl = 'https://api.coingecko.com/api/v3';
            const coinId = this.mapSymbolToCoinGeckoId(symbol);
            if (!coinId) {
                return null;
            }
            const response = await axios_1.default.get(`${coinGeckoUrl}/simple/price`, {
                params: {
                    ids: coinId,
                    vs_currencies: 'usd',
                    include_24hr_change: true,
                    include_24hr_vol: true,
                },
            });
            const data = response.data[coinId];
            return {
                symbol: symbol,
                price: data.usd,
                timestamp: Date.now(),
                volume: data.usd_24h_vol,
            };
        }
        catch (error) {
            this.logger.error(`Failed to fetch price for ${symbol} from alternative API: ${error.message}`);
            return null;
        }
    }
    async fetchMultiplePrices(symbols) {
        const promises = symbols.map((symbol) => this.fetchPriceFromBinance(symbol));
        const results = await Promise.allSettled(promises);
        return results
            .filter((result) => result.status === 'fulfilled' && result.value !== null)
            .map((result) => result.value);
    }
    mapSymbolToCoinGeckoId(symbol) {
        const mapping = {
            BTCUSDT: 'bitcoin',
            ETHUSDT: 'ethereum',
            BNBUSDT: 'binancecoin',
            ADAUSDT: 'cardano',
            DOGEUSDT: 'dogecoin',
            XRPUSDT: 'ripple',
            DOTUSDT: 'polkadot',
            UNIUSDT: 'uniswap',
            LINKUSDT: 'chainlink',
            LTCUSDT: 'litecoin',
        };
        return mapping[symbol] || null;
    }
    generateMockPrice(symbol, basePrice = 50000) {
        const change = (Math.random() - 0.5) * basePrice * 0.02;
        const price = basePrice + change;
        return {
            symbol,
            price,
            timestamp: Date.now(),
            open: basePrice,
            high: price + Math.random() * 100,
            low: price - Math.random() * 100,
            close: price,
            volume: Math.random() * 1000000,
        };
    }
};
exports.PriceCrawlerService = PriceCrawlerService;
exports.PriceCrawlerService = PriceCrawlerService = PriceCrawlerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(detailed_price_data_entity_1.DetailedPriceData)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository])
], PriceCrawlerService);
//# sourceMappingURL=price-crawler.service.js.map