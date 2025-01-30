import request from 'supertest';

import {app} from '../../../auth';

describe('Healthcheck', () => {
    test('Ping', async () => {
        const response = await request(app).get('/ping');

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({result: 'pong'});
    });

    test('Ping DB', async () => {
        const response = await request(app).get('/ping-db');

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({result: 'pong-db'});
    });

    test('Ping DB primary', async () => {
        const response = await request(app).get('/ping-db-primary');

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({result: 'db primary is ok'});
    });

    test('Ping pool', async () => {
        const response = await request(app).get('/pool');

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
            result: {
                primary: {
                    free: expect.any(Number),
                    numPendingAcquires: expect.any(Number),
                    numPendingCreates: expect.any(Number),
                    used: expect.any(Number),
                },
                replica: {
                    free: expect.any(Number),
                    numPendingAcquires: expect.any(Number),
                    numPendingCreates: expect.any(Number),
                    used: expect.any(Number),
                },
            },
        });
    });
});
