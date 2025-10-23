import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';

describe('AuthController', () => {
    let authController: AuthController;
    let authService: AuthService;

    beforeEach(async () => {
        const mockAuthService = {
            login: jest.fn().mockResolvedValue({ access_token: 'fake-jwt-token' }),
            register: jest.fn().mockResolvedValue({ id: 1, username: 'newuser' }),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
            ],
        }).compile();

        authController = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
    });

    it('should login and return access_token', async () => {
        const loginDto = { username: 'testuser', password: '123456' };
        const result = await authController.login(loginDto);

        expect(result).toEqual({ access_token: 'fake-jwt-token' });
        expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should register new user', async () => {
        const registerDto = {
            username: 'newuser',
            password: '123456',
            email: 'test@example.com',
        };

        const result = await authController.register(registerDto);
        expect(result).toEqual({ id: 1, username: 'newuser' });
        expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should return current user from request', async () => {
        const req = { user: { id: 1, username: 'john' } };
        const result = await authController.getProfile(req as any);
        expect(result).toEqual(req.user);
    });

    it('should return valid: true and user', async () => {
        const req = { user: { id: 1, username: 'john' } };
        const result = await authController.verifyToken(req as any);
        expect(result).toEqual({
            valid: true,
            user: req.user,
        });
    });
});
