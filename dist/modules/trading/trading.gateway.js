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
var TradingGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
let TradingGateway = TradingGateway_1 = class TradingGateway {
    server;
    logger = new common_1.Logger(TradingGateway_1.name);
    afterInit(server) {
        this.logger.log('Trading WebSocket Gateway initialized');
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    notifyOrderUpdate(userId, order) {
        this.server.to(`user:${userId}`).emit('order-update', order);
    }
    notifyOrderClosed(userId, order) {
        this.server.to(`user:${userId}`).emit('order-closed', order);
    }
    broadcastMessage(event, data) {
        this.server.emit(event, data);
    }
};
exports.TradingGateway = TradingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], TradingGateway.prototype, "server", void 0);
exports.TradingGateway = TradingGateway = TradingGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        namespace: '/trading',
    })
], TradingGateway);
//# sourceMappingURL=trading.gateway.js.map