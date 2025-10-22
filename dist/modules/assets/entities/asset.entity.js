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
exports.Asset = exports.AssetStatus = exports.AssetType = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("../../trading/entities/order.entity");
var AssetType;
(function (AssetType) {
    AssetType["CRYPTO"] = "crypto";
    AssetType["FOREX"] = "forex";
    AssetType["STOCK"] = "stock";
    AssetType["COMMODITY"] = "commodity";
})(AssetType || (exports.AssetType = AssetType = {}));
var AssetStatus;
(function (AssetStatus) {
    AssetStatus["ACTIVE"] = "active";
    AssetStatus["INACTIVE"] = "inactive";
    AssetStatus["MAINTENANCE"] = "maintenance";
})(AssetStatus || (exports.AssetStatus = AssetStatus = {}));
let Asset = class Asset {
    id;
    symbol;
    name;
    type;
    status;
    icon;
    description;
    minTradeAmount;
    maxTradeAmount;
    profitPercentage;
    isAvailable;
    apiSymbol;
    displayOrder;
    createdAt;
    updatedAt;
    orders;
};
exports.Asset = Asset;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Asset.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Asset.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Asset.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AssetType,
    }),
    __metadata("design:type", String)
], Asset.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AssetStatus,
        default: AssetStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], Asset.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "icon", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, default: 1 }),
    __metadata("design:type", Number)
], Asset.prototype, "minTradeAmount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, default: 10000 }),
    __metadata("design:type", Number)
], Asset.prototype, "maxTradeAmount", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 85 }),
    __metadata("design:type", Number)
], Asset.prototype, "profitPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Asset.prototype, "isAvailable", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "apiSymbol", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Asset.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Asset.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Asset.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_entity_1.Order, (order) => order.asset),
    __metadata("design:type", Array)
], Asset.prototype, "orders", void 0);
exports.Asset = Asset = __decorate([
    (0, typeorm_1.Entity)('assets')
], Asset);
//# sourceMappingURL=asset.entity.js.map