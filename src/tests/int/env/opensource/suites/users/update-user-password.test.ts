import request from 'supertest';

import {encodeId} from '../../../../../../utils/ids';
import {AUTH_ERROR, UserRole, app, auth, authMasterToken} from '../../../../auth';
import {testUserPassword} from '../../../../constants';
import {createTestUsers, generateTokens} from '../../../../helpers';
import {makeRoute} from '../../../../routes';

const NEW_MANAGE_PASSWORD = 'NewManagePa$$word1';
const NEW_PRIVATE_PASSWORD = 'NewPrivatePa$$word1';
const NEW_PASSWORD = 'New_Pa$sword1';

describe('Update a user password', () => {
    let admin = {} as Awaited<ReturnType<typeof createTestUsers>>,
        user = {} as Awaited<ReturnType<typeof createTestUsers>>,
        adminTokens = {} as Awaited<ReturnType<typeof generateTokens>>,
        userTokens = {} as Awaited<ReturnType<typeof generateTokens>>;

    beforeAll(async () => {
        admin = await createTestUsers({
            login: 'admin-user',
            lastName: 'Admin',
            roles: [UserRole.Admin],
            password: testUserPassword,
        });

        user = await createTestUsers({
            login: 'editor-user',
            lastName: 'Editor',
            roles: [UserRole.Editor],
            password: testUserPassword,
        });

        adminTokens = await generateTokens({userId: admin.userId});
        userTokens = await generateTokens({userId: user.userId});
    });

    describe('[Manage] update a user password', () => {
        test('Access denied without the token', async () => {
            const response = await request(app)
                .post(makeRoute('updateUserPassword', {userId: encodeId(admin.userId)}))
                .send({newPassword: NEW_MANAGE_PASSWORD});
            expect(response.status).toBe(401);
        });

        test("User can't update admin password", async () => {
            const response = await auth(
                request(app).post(
                    makeRoute('updateUserPassword', {userId: encodeId(admin.userId)}),
                ),
                {
                    accessToken: userTokens.accessToken,
                },
            ).send({newPassword: NEW_MANAGE_PASSWORD});

            expect(response.status).toBe(403);
            expect(response.body).toStrictEqual({
                message: expect.any(String),
                code: AUTH_ERROR.ACCESS_DENIED,
            });
        });

        test('Admin can update a user password', async () => {
            const response = await auth(
                request(app).post(
                    makeRoute('updateUserPassword', {
                        userId: encodeId(user.userId),
                    }),
                ),
                {
                    accessToken: adminTokens.accessToken,
                },
            ).send({newPassword: NEW_MANAGE_PASSWORD});

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({done: true});
        });

        test('User can sign in with new password', async () => {
            const response = await request(app).post(makeRoute('signin')).send({
                login: user.login,
                password: NEW_MANAGE_PASSWORD,
            });
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({done: true});
        });
    });

    describe('[Private] update a user password', () => {
        test('Update a user password', async () => {
            const response = await authMasterToken(
                request(app).post(
                    makeRoute('privateUpdateUserPassword', {
                        userId: encodeId(user.userId),
                    }),
                ),
            ).send({newPassword: NEW_PRIVATE_PASSWORD});

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({done: true});
        });

        test('User can sign in with new password', async () => {
            const response = await request(app).post(makeRoute('signin')).send({
                login: user.login,
                password: NEW_PRIVATE_PASSWORD,
            });
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({done: true});
        });
    });

    describe('Update current user password', () => {
        test('Access denied without the token', async () => {
            const response = await request(app)
                .post(makeRoute('updateMyUserPassword'))
                .send({oldPassword: NEW_PRIVATE_PASSWORD, newPassword: NEW_PASSWORD});
            expect(response.status).toBe(401);
        });

        test('User can update current password', async () => {
            const response = await auth(request(app).post(makeRoute('updateMyUserPassword')), {
                accessToken: userTokens.accessToken,
            }).send({oldPassword: NEW_PRIVATE_PASSWORD, newPassword: NEW_PASSWORD});

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({done: true});
        });

        test('User can sign in with new password', async () => {
            const response = await request(app).post(makeRoute('signin')).send({
                login: user.login,
                password: NEW_PASSWORD,
            });
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({done: true});
        });

        test("User can't update current password with incorrect old password", async () => {
            const response = await auth(request(app).post(makeRoute('updateMyUserPassword')), {
                accessToken: userTokens.accessToken,
            }).send({oldPassword: NEW_MANAGE_PASSWORD, newPassword: testUserPassword});

            expect(response.status).toBe(400);
            expect(response.body).toStrictEqual({
                message: expect.any(String),
                code: AUTH_ERROR.OLD_PASSWORD_INCORRECT,
            });
        });
    });
});
