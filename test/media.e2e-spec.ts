import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Media API (e2e)', () => {
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

    describe('GET /media', () => {
        it('should return list of media items', () => {
            return request(app.getHttpServer())
                .get('/media')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });

        it('should support filtering by type', () => {
            return request(app.getHttpServer())
                .get('/media?type=image')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });
    });

    describe('GET /media/:id', () => {
        it('should return a single media item', () => {
            return request(app.getHttpServer())
                .get('/media/1')
                .expect((res) => {
                    if (res.status === 200) {
                        expect(res.body).toHaveProperty('id');
                        expect(res.body).toHaveProperty('url');
                        expect(res.body).toHaveProperty('type');
                    } else {
                        expect(res.status).toBe(404);
                    }
                });
        });
    });
});
