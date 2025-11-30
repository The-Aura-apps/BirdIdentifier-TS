import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Taxonomy API (e2e)', () => {
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

    describe('GET /taxonomy', () => {
        it('should return taxonomy data', () => {
            return request(app.getHttpServer())
                .get('/taxonomy')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });

        it('should filter by taxonomic rank', () => {
            return request(app.getHttpServer())
                .get('/taxonomy?rank=family')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });
    });

    describe('GET /taxonomy/:id', () => {
        it('should return taxonomy item by ID', () => {
            return request(app.getHttpServer())
                .get('/taxonomy/1')
                .expect((res) => {
                    if (res.status === 200) {
                        expect(res.body).toHaveProperty('id');
                    } else {
                        expect(res.status).toBe(404);
                    }
                });
        });
    });
});
