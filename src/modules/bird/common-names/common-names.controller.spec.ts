import { Test, TestingModule } from '@nestjs/testing';
import { CommonNamesController } from './common-names.controller';

describe('CommonNamesController', () => {
    let controller: CommonNamesController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CommonNamesController],
        }).compile();

        controller = module.get<CommonNamesController>(CommonNamesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
