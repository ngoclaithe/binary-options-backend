import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PriceFeedService } from './price-feed.service';
import { PriceData } from './price-crawler.service';
export declare class PriceFeedGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly priceFeedService;
    server: Server;
    private readonly logger;
    private subscribedClients;
    constructor(priceFeedService: PriceFeedService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleSubscribe(client: Socket, payload: {
        symbols: string[];
    }): {
        status: string;
        symbols: string[];
    };
    handleUnsubscribe(client: Socket, payload: {
        symbols: string[];
    }): {
        status: string;
        symbols: string[];
    };
    broadcastPriceUpdate(priceData: PriceData): void;
    broadcastPriceUpdates(pricesData: PriceData[]): void;
    private sendCurrentPrices;
    getSubscribedSymbols(): string[];
}
