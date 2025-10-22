"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const wallet_service_1 = require("../wallet/wallet.service");
let AuthService = class AuthService {
    usersService;
    walletService;
    jwtService;
    constructor(usersService, walletService, jwtService) {
        this.usersService = usersService;
        this.walletService = walletService;
        this.jwtService = jwtService;
    }
    async validateUser(username, password) {
        let user = await this.usersService.findByEmail(username);
        if (!user) {
            user = await this.usersService.findByUsername(username);
        }
        if (!user) {
            return null;
        }
        const isPasswordValid = await this.usersService.validatePassword(user, password);
        if (!isPasswordValid) {
            return null;
        }
        const { password: _, ...result } = user;
        return result;
    }
    async login(loginDto) {
        const user = await this.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.usersService.updateLastLogin(user.id);
        const payload = {
            username: user.username,
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                avatarUrl: user.avatarUrl,
            },
        };
    }
    async register(registerDto) {
        const user = await this.usersService.create({
            email: registerDto.email,
            username: registerDto.username,
            password: registerDto.password,
            fullName: registerDto.fullName,
            phone: registerDto.phone,
        });
        await this.walletService.create(user.id);
        const payload = {
            username: user.username,
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
        };
    }
    async verifyToken(token) {
        try {
            const payload = this.jwtService.verify(token);
            return payload;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        wallet_service_1.WalletService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map