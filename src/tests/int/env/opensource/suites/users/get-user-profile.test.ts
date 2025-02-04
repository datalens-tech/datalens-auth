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
    userWithoutRoles: UserProfileResponseModel['profile'];
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

describe('Get a user profile', () => {
    let admin = {} as Awaited<ReturnType<typeof createTestUsers>>,
        user = {} as Awaited<ReturnType<typeof createTestUsers>>,
        userWithoutRoles = {} as Awaited<ReturnType<typeof createTestUsers>>,
        adminTokens = {} as Awaited<ReturnType<typeof generateTokens>>,
        userTokens = {} as Awaited<ReturnType<typeof generateTokens>>,
        simpleUserTokens = {} as Awaited<ReturnType<typeof generateTokens>>;
    const createdUsers = {} as CreatedUsers;

    beforeAll(async () => {
        const adminRoles = [UserRole.Admin];
        admin = await createTestUsers({
            login: 'test-admin-user',
            firstName: 'Some',
            lastName: 'Admin',
            email: 'admin@edu.ru',
            roles: adminRoles,
        });
        createdUsers['admin'] = pickCreatedUserFields(admin, adminRoles);

        const userRoles = [UserRole.Viewer, UserRole.Editor];
        user = await createTestUsers({
            login: 'Alex',
            firstName: 'Alex',
            roles: userRoles,
        });
        createdUsers['user'] = pickCreatedUserFields(user, userRoles);

        userWithoutRoles = await createTestUsers({
            login: 'test-user-without-roles',
            roles: [],
        });
        createdUsers['userWithoutRoles'] = pickCreatedUserFields(userWithoutRoles, []);

        adminTokens = await generateTokens({userId: admin.userId});
        userTokens = await generateTokens({userId: user.userId});
        simpleUserTokens = await generateTokens({userId: userWithoutRoles.userId});
    });

    describe('[Manage] Get a user profile', () => {
        test('Access denied without the token', async () => {
            const response = await request(app).get(
                makeRoute('getUserProfile', {userId: createdUsers['user'].userId}),
            );
            expect(response.status).toBe(401);
        });

        test('Admin can get a user profile', async () => {
            const response = await auth(
                request(app).get(
                    makeRoute('getUserProfile', {userId: createdUsers['user'].userId}),
                ),
                {
                    accessToken: adminTokens.accessToken,
                },
            );

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({
                profile: createdUsers['user'],
            });
        });

        test("User can't get a user profile", async () => {
            const response = await auth(
                request(app).get(
                    makeRoute('getUserProfile', {userId: createdUsers['user'].userId}),
                ),
                {
                    accessToken: userTokens.accessToken,
                },
            );

            expect(response.status).toBe(403);
            expect(response.body).toStrictEqual({
                message: expect.any(String),
                code: AUTH_ERROR.ACCESS_DENIED,
            });
        });
    });

    describe('Get current user profile', () => {
        test('Access denied without the token', async () => {
            const response = await request(app).get(makeRoute('getMyUserProfile'));
            expect(response.status).toBe(401);
        });

        test('User can get current profile', async () => {
            const response = await auth(request(app).get(makeRoute('getMyUserProfile')), {
                accessToken: userTokens.accessToken,
            });

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({
                profile: createdUsers['user'],
            });
        });

        test('User without roles can get current profile', async () => {
            const response = await auth(request(app).get(makeRoute('getMyUserProfile')), {
                accessToken: simpleUserTokens.accessToken,
            });

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({
                profile: createdUsers['userWithoutRoles'],
            });
        });
    });
});
