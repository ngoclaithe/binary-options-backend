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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const asset_entity_1 = require("./entities/asset.entity");
let AssetsService = class AssetsService {
    assetRepository;
    constructor(assetRepository) {
        this.assetRepository = assetRepository;
    }
    async create(createAssetDto) {
        const existingAsset = await this.assetRepository.findOne({
            where: { symbol: createAssetDto.symbol },
        });
        if (existingAsset) {
            throw new common_1.ConflictException('Asset with this symbol already exists');
        }
        const asset = this.assetRepository.create(createAssetDto);
        return await this.assetRepository.save(asset);
    }
    async findAll() {
        return await this.assetRepository.find({
            order: { displayOrder: 'ASC', name: 'ASC' },
        });
    }
    async findActive() {
        return await this.assetRepository.find({
            where: { status: asset_entity_1.AssetStatus.ACTIVE, isAvailable: true },
            order: { displayOrder: 'ASC', name: 'ASC' },
        });
    }
    async findOne(id) {
        const asset = await this.assetRepository.findOne({ where: { id } });
        if (!asset) {
            throw new common_1.NotFoundException(`Asset with ID ${id} not found`);
        }
        return asset;
    }
    async findBySymbol(symbol) {
        const asset = await this.assetRepository.findOne({ where: { symbol } });
        if (!asset) {
            throw new common_1.NotFoundException(`Asset with symbol ${symbol} not found`);
        }
        return asset;
    }
    async update(id, updateData) {
        const asset = await this.findOne(id);
        Object.assign(asset, updateData);
        return await this.assetRepository.save(asset);
    }
    async updateStatus(id, status) {
        const asset = await this.findOne(id);
        asset.status = status;
        return await this.assetRepository.save(asset);
    }
    async remove(id) {
        const asset = await this.findOne(id);
        await this.assetRepository.remove(asset);
    }
    async seedDefaultAssets() {
        const defaultAssets = [
            {
                symbol: 'BTC/USDT',
                name: 'Bitcoin',
                type: asset_entity_1.AssetType.CRYPTO,
                apiSymbol: 'BTCUSDT',
                profitPercentage: 85,
                icon: '₿',
            },
            {
                symbol: 'ETH/USDT',
                name: 'Ethereum',
                type: asset_entity_1.AssetType.CRYPTO,
                apiSymbol: 'ETHUSDT',
                profitPercentage: 85,
                icon: 'Ξ',
            },
            {
                symbol: 'EUR/USD',
                name: 'Euro vs US Dollar',
                type: asset_entity_1.AssetType.FOREX,
                apiSymbol: 'EURUSD',
                profitPercentage: 80,
                icon: '€/$',
            },
            {
                symbol: 'GBP/USD',
                name: 'British Pound vs US Dollar',
                type: asset_entity_1.AssetType.FOREX,
                apiSymbol: 'GBPUSD',
                profitPercentage: 80,
                icon: '£/$',
            },
        ];
        for (const assetData of defaultAssets) {
            const exists = await this.assetRepository.findOne({
                where: { symbol: assetData.symbol },
            });
            if (!exists) {
                const asset = this.assetRepository.create(assetData);
                await this.assetRepository.save(asset);
            }
        }
    }
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(asset_entity_1.Asset)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AssetsService);
//# sourceMappingURL=assets.service.js.map