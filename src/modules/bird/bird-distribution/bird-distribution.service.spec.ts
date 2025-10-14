import { Test, TestingModule } from '@nestjs/testing';
import { BirdDistributionService } from './bird-distribution.service';

describe('BirdDistributionService', () => {
  let service: BirdDistributionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BirdDistributionService],
    }).compile();

    service = module.get<BirdDistributionService>(BirdDistributionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
