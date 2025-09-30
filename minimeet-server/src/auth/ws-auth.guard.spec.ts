import { WsAuthGuard } from './ws-auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('WsAuthGuard', () => {
  let guard: WsAuthGuard;

  beforeEach(() => {
    const jwtService = new JwtService({ secret: 'test' });
    guard = new WsAuthGuard(jwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});
