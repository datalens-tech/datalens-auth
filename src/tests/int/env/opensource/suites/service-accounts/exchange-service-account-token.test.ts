import jwt from 'jsonwebtoken';
import request from 'supertest';

import {AUTH_ERROR, UserRole, app, auth} from '../../../../auth';
import {createTestUsers, generateTokens} from '../../../../helpers';
import {makeRoute} from '../../../../routes';

const signClientJwt = (
    saId: string,
    keyId: string,
    privateKey: string,
    overrides?: Partial<{iat: number; exp: number}>,
) => {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: saId,
        iat: overrides?.iat ?? now,
        exp: overrides?.exp ?? now + 300,
    };
    return jwt.sign(payload, privateKey, {algorithm: 'RS256', keyid: keyId, noTimestamp: true});
};

describe('Exchange service account token', () => {
    let admin = {} as Awaited<ReturnType<typeof createTestUsers>>,
        adminTokens = {} as Awaited<ReturnType<typeof generateTokens>>;

    let saId: string;
    let keyId: string;
    let privateKey: string;

    beforeAll(async () => {
        admin = await createTestUsers({roles: [UserRole.Admin], login: 'exchange-token-admin'});
        adminTokens = await generateTokens({userId: admin.userId});

        const saResp = await auth(request(app).post(makeRoute('createServiceAccount')), {
            accessToken: adminTokens.accessToken,
        }).send({
            name: 'exchange-token-sa',
            roles: [UserRole.Viewer],
        });
        saId = saResp.body.serviceAccountId;

        const keyResp = await auth(
            request(app).post(makeRoute('createServiceAccountKey', {serviceAccountId: saId})),
            {accessToken: adminTokens.accessToken},
        );
        keyId = keyResp.body.keyId;
        privateKey = keyResp.body.privateKey;
    });

    test('Validation error without body', async () => {
        const response = await request(app).post(makeRoute('exchangeServiceAccountToken')).send({});

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.VALIDATION_ERROR,
            details: expect.any(Array),
        });
    });

    test('Returns 401 for malformed JWT string', async () => {
        const response = await request(app)
            .post(makeRoute('exchangeServiceAccountToken'))
            .send({jwt: 'this-is-not-a-jwt'});

        expect(response.status).toBe(401);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.INVALID_SERVICE_ACCOUNT_JWT,
        });
    });

    test('Returns 401 for JWT signed with wrong key', async () => {
        const {privateKey: wrongKey} = await import('node:crypto').then((c) =>
            c.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {type: 'spki', format: 'pem'},
                privateKeyEncoding: {type: 'pkcs8', format: 'pem'},
            }),
        );

        const clientJwt = signClientJwt(saId, keyId, wrongKey);

        const response = await request(app)
            .post(makeRoute('exchangeServiceAccountToken'))
            .send({jwt: clientJwt});

        expect(response.status).toBe(401);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.INVALID_SERVICE_ACCOUNT_JWT,
        });
    });

    test('Returns 401 for JWT with TTL exceeding 600 seconds', async () => {
        const now = Math.floor(Date.now() / 1000);
        const clientJwt = signClientJwt(saId, keyId, privateKey, {
            iat: now,
            exp: now + 601,
        });

        const response = await request(app)
            .post(makeRoute('exchangeServiceAccountToken'))
            .send({jwt: clientJwt});

        expect(response.status).toBe(401);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.INVALID_SERVICE_ACCOUNT_JWT,
        });
    });

    test('Returns 404 for JWT with non-existent service account', async () => {
        const deletedSaResp = await auth(request(app).post(makeRoute('createServiceAccount')), {
            accessToken: adminTokens.accessToken,
        }).send({name: 'exchange-token-deleted-sa', roles: [UserRole.Viewer]});
        const deletedSaId = deletedSaResp.body.serviceAccountId;

        const deletedKeyResp = await auth(
            request(app).post(
                makeRoute('createServiceAccountKey', {serviceAccountId: deletedSaId}),
            ),
            {accessToken: adminTokens.accessToken},
        );

        await auth(
            request(app).delete(makeRoute('deleteServiceAccount', {serviceAccountId: deletedSaId})),
            {accessToken: adminTokens.accessToken},
        );

        const clientJwt = signClientJwt(
            deletedSaId,
            deletedKeyResp.body.keyId,
            deletedKeyResp.body.privateKey,
        );

        const response = await request(app)
            .post(makeRoute('exchangeServiceAccountToken'))
            .send({jwt: clientJwt});

        expect(response.status).toBe(404);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS,
        });
    });

    test('Valid JWT returns access token', async () => {
        const clientJwt = signClientJwt(saId, keyId, privateKey);

        const response = await request(app)
            .post(makeRoute('exchangeServiceAccountToken'))
            .send({jwt: clientJwt});

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
            accessToken: expect.any(String),
        });
    });
});
