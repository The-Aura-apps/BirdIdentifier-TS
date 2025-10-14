import { Test, TestingModule } from '@nestjs/testing';
import { BirdHabitatsService } from './bird-habitats.service';

describe('BirdHabitatsService', () => {
  let service: BirdHabitatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BirdHabitatsService],
    }).compile();

    service = module.get<BirdHabitatsService>(BirdHabitatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
