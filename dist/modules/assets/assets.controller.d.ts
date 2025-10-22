import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
export declare class AssetsController {
    private readonly assetsService;
    constructor(assetsService: AssetsService);
    findAll(): Promise<import("./entities/asset.entity").Asset[]>;
    findActive(): Promise<import("./entities/asset.entity").Asset[]>;
    findOne(id: string): Promise<import("./entities/asset.entity").Asset>;
    create(createAssetDto: CreateAssetDto): Promise<import("./entities/asset.entity").Asset>;
    update(id: string, updateData: Partial<CreateAssetDto>): Promise<import("./entities/asset.entity").Asset>;
    remove(id: string): Promise<void>;
}
