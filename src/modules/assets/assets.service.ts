import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset, AssetStatus, AssetType } from './entities/asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
  ) {}

  async create(createAssetDto: CreateAssetDto): Promise<Asset> {
    const existingAsset = await this.assetRepository.findOne({
      where: { symbol: createAssetDto.symbol },
    });

    if (existingAsset) {
      throw new ConflictException('Asset with this symbol already exists');
    }

    const asset = this.assetRepository.create(createAssetDto);
    return await this.assetRepository.save(asset);
  }

  async findAll(): Promise<Asset[]> {
    return await this.assetRepository.find({
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  async findActive(): Promise<Asset[]> {
    return await this.assetRepository.find({
      where: { status: AssetStatus.ACTIVE, isAvailable: true },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Asset> {
    const asset = await this.assetRepository.findOne({ where: { id } });
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }
    return asset;
  }

  async findBySymbol(symbol: string): Promise<Asset> {
    const asset = await this.assetRepository.findOne({ where: { symbol } });
    if (!asset) {
      throw new NotFoundException(`Asset with symbol ${symbol} not found`);
    }
    return asset;
  }

  async update(id: string, updateData: Partial<Asset>): Promise<Asset> {
    const asset = await this.findOne(id);
    Object.assign(asset, updateData);
    return await this.assetRepository.save(asset);
  }

  async updateStatus(id: string, status: AssetStatus): Promise<Asset> {
    const asset = await this.findOne(id);
    asset.status = status;
    return await this.assetRepository.save(asset);
  }

  async remove(id: string): Promise<void> {
    const asset = await this.findOne(id);
    await this.assetRepository.remove(asset);
  }

async seedDefaultAssets(): Promise<void> {
  const defaultAssets = [
    {
      symbol: 'BTC/USDT',
      name: 'Bitcoin',
      type: AssetType.CRYPTO,
      apiSymbol: 'BTCUSDT',
      profitPercentage: 85,
      icon: '₿',
    },
    {
      symbol: 'ETH/USDT',
      name: 'Ethereum',
      type: AssetType.CRYPTO,
      apiSymbol: 'ETHUSDT',
      profitPercentage: 85,
      icon: 'Ξ',
    },
    {
      symbol: 'EUR/USD',
      name: 'Euro vs US Dollar',
      type: AssetType.FOREX,
      apiSymbol: 'EURUSD',
      profitPercentage: 80,
      icon: '€/$',
    },
    {
      symbol: 'GBP/USD',
      name: 'British Pound vs US Dollar',
      type: AssetType.FOREX,
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

}