import { Injectable } from '@nestjs/common';

@Injectable()
export class TenancyService {
  subdomain: string;
}
