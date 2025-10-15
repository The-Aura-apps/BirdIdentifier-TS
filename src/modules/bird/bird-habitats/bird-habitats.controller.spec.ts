import { Test, TestingModule } from '@nestjs/testing';
import { BirdHabitatsController } from './bird-habitats.controller';

describe('BirdHabitatsController', () => {
    let controller: BirdHabitatsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BirdHabitatsController],
        }).compile();

        controller = module.get<BirdHabitatsController>(BirdHabitatsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
