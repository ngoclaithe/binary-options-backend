import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly usersService;
    private readonly walletService;
    private readonly jwtService;
    constructor(usersService: UsersService, walletService: WalletService, jwtService: JwtService);
    validateUser(username: string, password: string): Promise<any>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: any;
            username: any;
            email: any;
            fullName: any;
            role: any;
            avatarUrl: any;
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: string;
            username: string;
            email: string;
            fullName: string;
            role: import("../users/entities/user.entity").UserRole;
        };
    }>;
    verifyToken(token: string): Promise<any>;
}
