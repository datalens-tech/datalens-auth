import request from 'supertest';

import {app} from '../../../auth';

describe('Api Docs', () => {
    test('Get main page', async () => {
        const response = await request(app).get('/api-docs/');

        expect(response.status).toBe(200);
        expect(response.type).toBe('text/html');
        expect(response.text).toContain('Swagger UI');
    });

    test('Get main page with redirect', async () => {
        const response = await request(app).get('/api-docs');

        expect(response.status).toBe(301);
        expect(response.header['location']).toBe('/api-docs/');
    });
});
