import { Test, TestingModule } from '@nestjs/testing';
import { ApnsService } from './apns.service';

describe('ApnsService', () => {
  let service: ApnsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApnsService],
    }).compile();

    service = module.get<ApnsService>(ApnsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
