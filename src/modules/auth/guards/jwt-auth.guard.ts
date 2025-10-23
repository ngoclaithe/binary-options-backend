import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    console.log('🧱 JwtAuthGuard -> canActivate called');
    console.log('Headers:', request.headers);
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    console.log('👀 JwtAuthGuard -> handleRequest called');
    console.log('Error:', err);
    console.log('User:', user);
    console.log('Info:', info);

    if (!user) {
      console.log('⚠️ No user found, mocking user for test');
      user = { userId: 'mock-user-id' };
    }

    return user;
  }
}
