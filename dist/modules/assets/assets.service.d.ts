import { Repository } from 'typeorm';
import { Asset, AssetStatus } from './entities/asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
export declare class AssetsService {
    private readonly assetRepository;
    constructor(assetRepository: Repository<Asset>);
    create(createAssetDto: CreateAssetDto): Promise<Asset>;
    findAll(): Promise<Asset[]>;
    findActive(): Promise<Asset[]>;
    findOne(id: string): Promise<Asset>;
    findBySymbol(symbol: string): Promise<Asset>;
    update(id: string, updateData: Partial<Asset>): Promise<Asset>;
    updateStatus(id: string, status: AssetStatus): Promise<Asset>;
    remove(id: string): Promise<void>;
    seedDefaultAssets(): Promise<void>;
}
