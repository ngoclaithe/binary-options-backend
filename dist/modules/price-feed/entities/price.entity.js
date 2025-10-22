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
exports.Price = void 0;
const typeorm_1 = require("typeorm");
let Price = class Price {
    id;
    symbol;
    price;
    open;
    high;
    low;
    close;
    volume;
    timestamp;
    metadata;
    createdAt;
};
exports.Price = Price;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Price.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Price.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 18, scale: 8 }),
    __metadata("design:type", Number)
], Price.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 18, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], Price.prototype, "open", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 18, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], Price.prototype, "high", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 18, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], Price.prototype, "low", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 18, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], Price.prototype, "close", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 20, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Price.prototype, "volume", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Price.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Price.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Price.prototype, "createdAt", void 0);
exports.Price = Price = __decorate([
    (0, typeorm_1.Entity)('prices'),
    (0, typeorm_1.Index)(['symbol', 'timestamp'])
], Price);
//# sourceMappingURL=price.entity.js.map