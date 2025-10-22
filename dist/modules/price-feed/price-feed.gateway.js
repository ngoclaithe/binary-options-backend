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
var PriceFeedGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceFeedGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const price_feed_service_1 = require("./price-feed.service");
let PriceFeedGateway = PriceFeedGateway_1 = class PriceFeedGateway {
    priceFeedService;
    server;
    logger = new common_1.Logger(PriceFeedGateway_1.name);
    subscribedClients = new Map();
    constructor(priceFeedService) {
        this.priceFeedService = priceFeedService;
    }
    afterInit(server) {
        this.logger.log('Price Feed WebSocket Gateway initialized');
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.subscribedClients.forEach((clients, symbol) => {
            clients.delete(client.id);
            if (clients.size === 0) {
                this.subscribedClients.delete(symbol);
            }
        });
    }
    handleSubscribe(client, payload) {
        const { symbols } = payload;
        symbols.forEach((symbol) => {
            let clients = this.subscribedClients.get(symbol);
            if (!clients) {
                clients = new Set();
                this.subscribedClients.set(symbol, clients);
            }
            clients.add(client.id);
        });
        this.logger.log(`Client ${client.id} subscribed to ${symbols.join(', ')}`);
        this.sendCurrentPrices(client, symbols);
        return { status: 'subscribed', symbols };
    }
    handleUnsubscribe(client, payload) {
        const { symbols } = payload;
        symbols.forEach((symbol) => {
            const clients = this.subscribedClients.get(symbol);
            if (clients) {
                clients.delete(client.id);
                if (clients.size === 0) {
                    this.subscribedClients.delete(symbol);
                }
            }
        });
        this.logger.log(`Client ${client.id} unsubscribed from ${symbols.join(', ')}`);
        return { status: 'unsubscribed', symbols };
    }
    broadcastPriceUpdate(priceData) {
        const clients = this.subscribedClients.get(priceData.symbol);
        if (clients && clients.size > 0) {
            this.server.to(Array.from(clients)).emit('price-update', priceData);
        }
    }
    broadcastPriceUpdates(pricesData) {
        pricesData.forEach((priceData) => {
            this.broadcastPriceUpdate(priceData);
        });
    }
    async sendCurrentPrices(client, symbols) {
        for (const symbol of symbols) {
            const price = await this.priceFeedService.getLatestPrice(symbol);
            if (price) {
                client.emit('price-update', price);
            }
        }
    }
    getSubscribedSymbols() {
        return Array.from(this.subscribedClients.keys());
    }
};
exports.PriceFeedGateway = PriceFeedGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], PriceFeedGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], PriceFeedGateway.prototype, "handleSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], PriceFeedGateway.prototype, "handleUnsubscribe", null);
exports.PriceFeedGateway = PriceFeedGateway = PriceFeedGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        namespace: '/price-feed',
    }),
    __metadata("design:paramtypes", [price_feed_service_1.PriceFeedService])
], PriceFeedGateway);
//# sourceMappingURL=price-feed.gateway.js.map