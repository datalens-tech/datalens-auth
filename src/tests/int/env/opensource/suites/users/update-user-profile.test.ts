import pick from 'lodash/pick';
import request from 'supertest';

import type {UserProfileResponseModel} from '../../../../../../controllers/reponse-models/users/user-profile-model';
import {UserModel, UserModelColumn} from '../../../../../../db/models/user';
import {encodeId} from '../../../../../../utils/ids';
import {AUTH_ERROR, UserRole, app, auth} from '../../../../auth';
import {createTestUsers, generateTokens} from '../../../../helpers';
import {makeRoute} from '../../../../routes';

type CreatedUsers = {
    admin: UserProfileResponseModel['profile'];
    user: UserProfileResponseModel['profile'];
};

const pickCreatedUserFields = (
    user: UserModel,
    roles: UserRole[],
): UserProfileResponseModel['profile'] => ({
    ...pick(user, [
        UserModelColumn.Login,
        UserModelColumn.Email,
        UserModelColumn.FirstName,
        UserModelColumn.LastName,
    ]),
    userId: encodeId(user.userId),
    roles: expect.toIncludeSameMembers(roles),
});

describe('Update a user profile', () => {
    let admin = {} as Awaited<ReturnType<typeof createTestUsers>>,
        user = {} as Awaited<ReturnType<typeof createTestUsers>>,
        adminTokens = {} as Awaited<ReturnType<typeof generateTokens>>,
        userTokens = {} as Awaited<ReturnType<typeof generateTokens>>;
    const createdUsers = {} as CreatedUsers;

    beforeAll(async () => {
        const adminRoles = [UserRole.Admin];
        admin = await createTestUsers({
            login: 'test-admin',
            lastName: 'Admin',
            email: 'admin@edu.ru',
            roles: adminRoles,
        });
        createdUsers['admin'] = pickCreatedUserFields(admin, adminRoles);

        const userRoles = [UserRole.Viewer];
        user = await createTestUsers({
            login: 'test-user',
            lastName: 'User',
            email: 'user@edu.ru',
            roles: userRoles,
        });
        createdUsers['user'] = pickCreatedUserFields(user, userRoles);

        adminTokens = await generateTokens({userId: admin.userId});
        userTokens = await generateTokens({userId: user.userId});
    });

    describe('[Manage] update a user profile', () => {
        test('Access denied without the token', async () => {
            const response = await request(app)
                .post(makeRoute('updateUserProfile', {userId: createdUsers['admin'].userId}))
                .send({firstName: 'Name'});
            expect(response.status).toBe(401);
        });

        test('Admin can update a user profile', async () => {
            const firstName = 'Name';
            const response = await auth(
                request(app).post(
                    makeRoute('updateUserProfile', {
                        userId: createdUsers['user'].userId,
                    }),
                ),
                {
                    accessToken: adminTokens.accessToken,
                },
            ).send({firstName});

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({done: true});

            const response2 = await auth(
                request(app).get(
                    makeRoute('getUserProfile', {userId: createdUsers['user'].userId}),
                ),
                {
                    accessToken: adminTokens.accessToken,
                },
            );

            expect(response2.status).toBe(200);
            expect(response2.body).toStrictEqual({
                profile: {...createdUsers['user'], firstName},
            });
        });

        test("User can't update admin profile", async () => {
            const response = await auth(
                request(app).post(
                    makeRoute('updateUserProfile', {userId: createdUsers['admin'].userId}),
                ),
                {
                    accessToken: userTokens.accessToken,
                },
            ).send({firstName: 'Name2'});

            expect(response.status).toBe(403);
            expect(response.body).toStrictEqual({
                message: expect.any(String),
                code: AUTH_ERROR.ACCESS_DENIED,
            });
        });
    });

    describe('Update current user profile', () => {
        test('Access denied without the token', async () => {
            const response = await request(app)
                .post(makeRoute('updateMyUserProfile'))
                .send({firstName: 'Name3'});
            expect(response.status).toBe(401);
        });

        test('User can update current profile', async () => {
            const firstName = 'Jing';
            const response = await auth(request(app).post(makeRoute('updateMyUserProfile')), {
                accessToken: userTokens.accessToken,
            }).send({firstName});

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({done: true});

            const response2 = await auth(
                request(app).get(
                    makeRoute('getUserProfile', {userId: createdUsers['user'].userId}),
                ),
                {
                    accessToken: adminTokens.accessToken,
                },
            );
            expect(response2.status).toBe(200);
            expect(response2.body).toStrictEqual({
                profile: {...createdUsers['user'], firstName},
            });
        });

        test('User can update current profile and set null', async () => {
            const firstName = null;
            const lastName = 'Horacio';
            const email = 'horacio@be.me';

            const response = await auth(request(app).post(makeRoute('updateMyUserProfile')), {
                accessToken: userTokens.accessToken,
            }).send({firstName, lastName, email});

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({done: true});

            const response2 = await auth(
                request(app).get(
                    makeRoute('getUserProfile', {userId: createdUsers['user'].userId}),
                ),
                {
                    accessToken: adminTokens.accessToken,
                },
            );
            expect(response2.status).toBe(200);
            expect(response2.body).toStrictEqual({
                profile: {...createdUsers['user'], firstName, lastName, email},
            });
        });

        test("User can't update login", async () => {
            const login = 'new-best-login';
            const firstName = 'new-first-name';

            const response = await auth(request(app).post(makeRoute('updateMyUserProfile')), {
                accessToken: userTokens.accessToken,
            }).send({login, firstName});

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({done: true});

            const response2 = await auth(
                request(app).get(
                    makeRoute('getUserProfile', {userId: createdUsers['user'].userId}),
                ),
                {
                    accessToken: adminTokens.accessToken,
                },
            );
            expect(response2.status).toBe(200);
            expect(response2.body.profile.login).toBe(createdUsers['user'].login);
        });
    });
});
