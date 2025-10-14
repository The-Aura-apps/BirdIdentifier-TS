import { Test, TestingModule } from '@nestjs/testing';
import { BirdDistributionController } from './bird-distribution.controller';

describe('BirdDistributionController', () => {
  let controller: BirdDistributionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BirdDistributionController],
    }).compile();

    controller = module.get<BirdDistributionController>(BirdDistributionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
