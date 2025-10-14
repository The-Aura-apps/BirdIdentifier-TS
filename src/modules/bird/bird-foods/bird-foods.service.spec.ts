import { Test, TestingModule } from '@nestjs/testing';
import { BirdFoodsService } from './bird-foods.service';

describe('BirdFoodsService', () => {
  let service: BirdFoodsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BirdFoodsService],
    }).compile();

    service = module.get<BirdFoodsService>(BirdFoodsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
