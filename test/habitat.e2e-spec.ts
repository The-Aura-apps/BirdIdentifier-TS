import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Habitats API (e2e)', () => {
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

    describe('GET /habitats', () => {
        it('should return list of habitat types', () => {
            return request(app.getHttpServer())
                .get('/habitats')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });
    });

    describe('GET /habitats/:id', () => {
        it('should return a habitat by ID', () => {
            return request(app.getHttpServer())
                .get('/habitats/1')
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
