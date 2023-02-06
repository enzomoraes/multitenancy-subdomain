import { Test, TestingModule } from '@nestjs/testing';
import KeycloakFacadeService from './keycloak-facade.service';

describe('KeycloakFacadeService', () => {
  let service: KeycloakFacadeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KeycloakFacadeService],
    }).compile();

    service = module.get<KeycloakFacadeService>(KeycloakFacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
