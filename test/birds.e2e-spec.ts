import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Birds API (e2e)', () => {
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

    describe('GET /birds', () => {
        it('should return a list of birds', () => {
            return request(app.getHttpServer())
                .get('/birds')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });

        it('should support pagination', () => {
            return request(app.getHttpServer())
                .get('/birds?page=1&limit=10')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    expect(res.body.length).toBeLessThanOrEqual(10);
                });
        });
    });

    describe('GET /birds/:id', () => {
        it('should return a single bird by ID', () => {
            return request(app.getHttpServer())
                .get('/birds/1')
                .expect((res) => {
                    if (res.status === 200) {
                        expect(res.body).toHaveProperty('id');
                        expect(res.body).toHaveProperty('scientificName');
                    } else {
                        expect(res.status).toBe(404);
                    }
                });
        });

        it('should return 404 for non-existent bird', () => {
            return request(app.getHttpServer())
                .get('/birds/999999')
                .expect(404);
        });
    });

    describe('GET /birds/search', () => {
        it('should search birds by name', () => {
            return request(app.getHttpServer())
                .get('/birds/search?q=Robin')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });

        it('should return empty array for non-matching search', () => {
            return request(app.getHttpServer())
                .get('/birds/search?q=XYZ123NONEXISTENT')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    expect(res.body.length).toBe(0);
                });
        });
    });
});
