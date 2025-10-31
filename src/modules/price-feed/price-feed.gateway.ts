import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PriceFeedService } from './price-feed.service';
import { PriceData } from './price-crawler.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/price-feed',
})
export class PriceFeedGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PriceFeedGateway.name);
  private subscribedClients: Map<string, Set<string>> = new Map();

  constructor(private readonly priceFeedService: PriceFeedService) { }

  afterInit(server: Server) {
    this.logger.log('Price Feed WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Cleanup subscriptions
    this.subscribedClients.forEach((clients, symbol) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.subscribedClients.delete(symbol);
      }
    });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { symbols: string[] }) {
    const { symbols } = payload;

    symbols.forEach((symbol) => {
      let clients = this.subscribedClients.get(symbol);
      if (!clients) {
        clients = new Set();
        this.subscribedClients.set(symbol, clients);
      }
      clients.add(client.id);
    });

    this.logger.log(`Client ${client.id} subscribed to ${symbols.join(', ')}`);

    this.sendCurrentPrices(client, symbols);

    return { status: 'subscribed', symbols };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: { symbols: string[] }) {
    const { symbols } = payload;

    symbols.forEach((symbol) => {
      const clients = this.subscribedClients.get(symbol);
      if (clients) {
        clients.delete(client.id);
        if (clients.size === 0) {
          this.subscribedClients.delete(symbol);
        }
      }
    });

    this.logger.log(`Client ${client.id} unsubscribed from ${symbols.join(', ')}`);

    return { status: 'unsubscribed', symbols };
  }

  /**
   * Broadcast price update to all subscribed clients
   */
  broadcastPriceUpdate(priceData: PriceData) {
    const clients = this.subscribedClients.get(priceData.symbol);
    if (clients && clients.size > 0) {
      this.server.to(Array.from(clients)).emit('price-update', priceData);
    }
  }

  /**
   * Broadcast multiple price updates
   */
  broadcastPriceUpdates(pricesData: PriceData[]) {
    pricesData.forEach((priceData) => {
      this.broadcastPriceUpdate(priceData);
    });
  }

  /**
   * Send current prices to a specific client
   */
  private async sendCurrentPrices(client: Socket, symbols: string[]) {
    for (const symbol of symbols) {
      const price = await this.priceFeedService.getLatestPrice(symbol);
      if (price) {
        client.emit('price-update', price);
      }
    }
  }

  /**
   * Get all subscribed symbols
   */
  getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedClients.keys());
  }
}