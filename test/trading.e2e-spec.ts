import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TradingService } from '../src/modules/trading/trading.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { ValidationPipe } from '@nestjs/common';

describe('TradingController (e2e)', () => {
    let app: INestApplication;
    let tradingService = {
        createOrder: jest.fn().mockResolvedValue({
            id: 'mock-order-1',
            assetId: 'BTCUSD',
            amount: 100,
            direction: 'CALL',
            duration: 60,
            status: 'ACTIVE',
        }),
        getUserOrders: jest.fn().mockResolvedValue([]),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            // ⚡ Mock TradingService
            .overrideProvider(TradingService)
            .useValue(tradingService)
            // ⚡ Mock JwtAuthGuard để bypass xác thực
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: (context: ExecutionContext) => {
                    const req = context.switchToHttp().getRequest();
                    req.user = { userId: 1, username: 'testuser' }; // fake user
                    return true;
                },
            })
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
        app.setGlobalPrefix('api/v1');
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    const fakeToken = 'Bearer faketoken123';

    describe('POST /api/v1/trading/orders', () => {
        it('should create order successfully', async () => {
            const createOrderDto = {
                assetId: '550e8400-e29b-41d4-a716-446655440000',
                direction: 'up',
                investAmount: 100,
                duration: 60,
            };

            const res = await request(app.getHttpServer())
                .post('/api/v1/trading/orders')
                .set('Authorization', fakeToken)
                .send(createOrderDto)
                .expect(201);

            expect(res.body).toHaveProperty('id');
            expect(res.body.status).toBe('ACTIVE');
        });


        it('should return 400 if missing fields', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/trading/orders')
                .set('Authorization', fakeToken)
                .send({ assetId: 'BTCUSD' })
                .expect(400);
        });
    });
});
