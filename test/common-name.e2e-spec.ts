import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Common Names API (e2e)', () => {
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

    describe('GET /common-names', () => {
        it('should return list of common names', () => {
            return request(app.getHttpServer())
                .get('/common-names')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });
    });

    describe('GET /common-names/:id', () => {
        it('should return a common name by ID', () => {
            return request(app.getHttpServer())
                .get('/common-names/1')
                .expect((res) => {
                    if (res.status === 200) {
                        expect(res.body).toHaveProperty('id');
                        expect(res.body).toHaveProperty('name');
                    } else {
                        expect(res.status).toBe(404);
                    }
                });
        });
    });
});
