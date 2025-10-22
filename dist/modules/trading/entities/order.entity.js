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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = exports.OrderStatus = exports.OrderDirection = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const asset_entity_1 = require("../../assets/entities/asset.entity");
var OrderDirection;
(function (OrderDirection) {
    OrderDirection["UP"] = "up";
    OrderDirection["DOWN"] = "down";
})(OrderDirection || (exports.OrderDirection = OrderDirection = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["ACTIVE"] = "active";
    OrderStatus["WON"] = "won";
    OrderStatus["LOST"] = "lost";
    OrderStatus["DRAW"] = "draw";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
let Order = class Order {
    id;
    userId;
    assetId;
    direction;
    investAmount;
    openPrice;
    closePrice;
    openTime;
    closeTime;
    duration;
    status;
    profitAmount;
    profitPercentage;
    metadata;
    createdAt;
    updatedAt;
    user;
    asset;
};
exports.Order = Order;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Order.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Order.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Order.prototype, "assetId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: OrderDirection,
    }),
    __metadata("design:type", String)
], Order.prototype, "direction", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], Order.prototype, "investAmount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 18, scale: 8 }),
    __metadata("design:type", Number)
], Order.prototype, "openPrice", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 18, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], Order.prototype, "closePrice", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint'),
    __metadata("design:type", Number)
], Order.prototype, "openTime", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint'),
    __metadata("design:type", Number)
], Order.prototype, "closeTime", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], Order.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "profitAmount", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "profitPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Order.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Order.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Order.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.orders),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], Order.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => asset_entity_1.Asset, (asset) => asset.orders),
    (0, typeorm_1.JoinColumn)({ name: 'assetId' }),
    __metadata("design:type", asset_entity_1.Asset)
], Order.prototype, "asset", void 0);
exports.Order = Order = __decorate([
    (0, typeorm_1.Entity)('orders'),
    (0, typeorm_1.Index)(['userId', 'status']),
    (0, typeorm_1.Index)(['assetId', 'status'])
], Order);
//# sourceMappingURL=order.entity.js.map