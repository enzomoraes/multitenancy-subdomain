import { TenancyGuard } from './tenancy.guard';

describe('TenancyGuard', () => {
  it('should be defined', () => {
    expect(new TenancyGuard()).toBeDefined();
  });
});
