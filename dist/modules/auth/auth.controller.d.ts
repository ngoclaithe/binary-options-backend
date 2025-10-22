import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    getProfile(req: any): Promise<any>;
    verifyToken(req: any): Promise<{
        valid: boolean;
        user: any;
    }>;
}
