import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('/ (GET)', () => {
        return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
    });

    describe('Birds API (e2e)', () => {
        it('GET /birds should return list of birds', () => {
            return request(app.getHttpServer())
                .get('/birds')
                .expect(200)
                .expect(res => {
                    expect(res.body).toBeInstanceOf(Array);
                });
        });

        it('POST /birds should create a bird', () => {
            return request(app.getHttpServer())
                .post('/birds')
                .send({ commonName: 'Robin', scientificName: 'Turdus migratorius' })
                .expect(201);
        });
    });
});
