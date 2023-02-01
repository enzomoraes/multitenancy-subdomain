import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenancyService } from './tenancy.service';

@Injectable()
export class TenancyGuard implements CanActivate {
  constructor(private tenantService: TenancyService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const subdomain = request.user.subdomain;
    this.tenantService.subdomain = subdomain;

    return true;
  }
}
