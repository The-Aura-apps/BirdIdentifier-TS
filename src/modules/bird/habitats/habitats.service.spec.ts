import { Test, TestingModule } from '@nestjs/testing';
import { HabitatsService } from './habitats.service';

describe('HabitatsService', () => {
  let service: HabitatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HabitatsService],
    }).compile();

    service = module.get<HabitatsService>(HabitatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
