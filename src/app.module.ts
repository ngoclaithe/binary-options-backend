import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Config imports
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';
import socketConfig from './config/socket.config';

// Module imports
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PriceFeedModule } from './modules/price-feed/price-feed.module';
import { TradingModule } from './modules/trading/trading.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { AssetsModule } from './modules/assets/assets.module';
import { CronJobsModule } from './modules/cron-jobs/cron-jobs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // Config Module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, socketConfig],
      envFilePath: '.env',
    }),

    // TypeORM Module
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.get('database')!,
      inject: [ConfigService],
    }),

    // Schedule Module for Cron Jobs
    ScheduleModule.forRoot(),

    // Feature Modules
    AuthModule,
    UsersModule,
    PriceFeedModule,
    TradingModule,
    WalletModule,
    AssetsModule,
    CronJobsModule,
    NotificationsModule,
  ],
})
export class AppModule {}