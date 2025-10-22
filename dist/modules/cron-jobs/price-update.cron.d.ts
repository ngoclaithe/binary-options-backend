import { PriceCrawlerService } from '../price-feed/price-crawler.service';
import { PriceFeedService } from '../price-feed/price-feed.service';
import { PriceFeedGateway } from '../price-feed/price-feed.gateway';
import { AssetsService } from '../assets/assets.service';
export declare class PriceUpdateCron {
    private readonly priceCrawlerService;
    private readonly priceFeedService;
    private readonly priceFeedGateway;
    private readonly assetsService;
    private readonly logger;
    private isRunning;
    constructor(priceCrawlerService: PriceCrawlerService, priceFeedService: PriceFeedService, priceFeedGateway: PriceFeedGateway, assetsService: AssetsService);
    updatePrices(): Promise<void>;
    onModuleInit(): Promise<void>;
}
