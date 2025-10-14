import { Test, TestingModule } from '@nestjs/testing';
import { CommonNamesService } from './common-names.service';

describe('CommonNamesService', () => {
  let service: CommonNamesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommonNamesService],
    }).compile();

    service = module.get<CommonNamesService>(CommonNamesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
