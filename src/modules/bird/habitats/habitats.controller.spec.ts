import { Test, TestingModule } from '@nestjs/testing';
import { HabitatsController } from './habitats.controller';

describe('HabitatsController', () => {
  let controller: HabitatsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HabitatsController],
    }).compile();

    controller = module.get<HabitatsController>(HabitatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
