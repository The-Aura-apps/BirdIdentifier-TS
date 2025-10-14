import { Test, TestingModule } from '@nestjs/testing';
import { BirdFoodsController } from './bird-foods.controller';

describe('BirdFoodsController', () => {
  let controller: BirdFoodsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BirdFoodsController],
    }).compile();

    controller = module.get<BirdFoodsController>(BirdFoodsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
