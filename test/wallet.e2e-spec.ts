import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { WalletService } from '../src/modules/wallet/wallet.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';

describe('WalletController (e2e)', () => {
    let app: INestApplication;

    const walletService = {
        getBalance: jest.fn().mockResolvedValue({ balance: 1000 }),
        findByUserId: jest.fn().mockResolvedValue({ id: 1, balance: 1000 }),
        deposit: jest.fn().mockResolvedValue({ success: true, balance: 1500 }),
        withdraw: jest.fn().mockResolvedValue({ success: true, balance: 500 }),
        getTransactionHistory: jest.fn().mockResolvedValue([
            { id: 1, amount: 100, type: 'deposit' },
            { id: 2, amount: 50, type: 'withdraw' },
        ]),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(WalletService)
            .useValue(walletService)
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: (context: ExecutionContext) => {
                    const req = context.switchToHttp().getRequest();
                    req.user = { userId: 1, username: 'testuser' };
                    return true;
                },
            })
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    const fakeToken = 'Bearer faketoken123';

    describe('GET /wallet/balance', () => {
        it('should return balance', async () => {
            const res = await request(app.getHttpServer())
                .get('/wallet/balance')
                .set('Authorization', fakeToken)
                .expect(200);

            expect(res.body).toEqual({ balance: 1000 });
            expect(walletService.getBalance).toHaveBeenCalledWith(1);
        });
    });

    describe('GET /wallet', () => {
        it('should return wallet info', async () => {
            const res = await request(app.getHttpServer())
                .get('/wallet')
                .set('Authorization', fakeToken)
                .expect(200);

            expect(res.body).toHaveProperty('balance', 1000);
            expect(walletService.findByUserId).toHaveBeenCalledWith(1);
        });
    });

    describe('POST /wallet/deposit', () => {
        it('should deposit successfully', async () => {
            const res = await request(app.getHttpServer())
                .post('/wallet/deposit')
                .set('Authorization', fakeToken)
                .send({ amount: 500, description: 'Top-up' })
                .expect(200);

            expect(res.body).toEqual({ success: true, balance: 1500 });
            expect(walletService.deposit).toHaveBeenCalledWith(1, 500, 'Top-up');
        });
    });

    describe('POST /wallet/withdraw', () => {
        it('should withdraw successfully', async () => {
            const res = await request(app.getHttpServer())
                .post('/wallet/withdraw')
                .set('Authorization', fakeToken)
                .send({ amount: 500, description: 'Cash out' })
                .expect(200);

            expect(res.body).toEqual({ success: true, balance: 500 });
            expect(walletService.withdraw).toHaveBeenCalledWith(1, 500, 'Cash out');
        });
    });

    describe('GET /wallet/transactions', () => {
        it('should return transaction history', async () => {
            const res = await request(app.getHttpServer())
                .get('/wallet/transactions')
                .set('Authorization', fakeToken)
                .query({ limit: 2 })
                .expect(200);

            expect(res.body.length).toBeGreaterThan(0);
            expect(walletService.getTransactionHistory).toHaveBeenCalledWith(1, "2");
        });
    });
});
