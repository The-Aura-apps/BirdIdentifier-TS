import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Conservation Status API (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /conservation-status', () => {
        it('should return list of conservation statuses', () => {
            return request(app.getHttpServer())
                .get('/conservation-status')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });
    });

    describe('GET /conservation-status/:id', () => {
        it('should return conservation status by ID', () => {
            return request(app.getHttpServer())
                .get('/conservation-status/1')
                .expect((res) => {
                    if (res.status === 200) {
                        expect(res.body).toHaveProperty('id');
                        expect(res.body).toHaveProperty('status');
                    } else {
                        expect(res.status).toBe(404);
                    }
                });
        });
    });
});
