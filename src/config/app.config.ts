import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT!, 10) || 3001,
  environment: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-this',
  jwtExpiration: process.env.JWT_EXPIRATION || '7d',

  priceApiUrl: process.env.PRICE_API_URL || 'https://api.binance.com/api/v3',
  priceApiKey: process.env.PRICE_API_KEY || '',

  // Trading Configuration
  minTradeAmount: parseInt(process.env.MIN_TRADE_AMOUNT!) || 1,
  maxTradeAmount: parseInt(process.env.MAX_TRADE_AMOUNT!) || 10000,
  profitPercentage: parseInt(process.env.PROFIT_PERCENTAGE!) || 85,

  // Cron Configuration
  priceUpdateInterval: process.env.PRICE_UPDATE_INTERVAL || '*/1 * * * *',
}));
