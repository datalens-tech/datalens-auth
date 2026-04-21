import pick from 'lodash/pick';
import request from 'supertest';

import type {UserWithRolesModel} from '../../../../../../controllers/response-models/users/user-with-roles-model';
import {UserModel, UserModelColumn} from '../../../../../../db/models/user';
import {encodeId} from '../../../../../../utils/ids';
import {AUTH_ERROR, UserRole, app, auth} from '../../../../auth';
import {createTestUsers, generateTokens} from '../../../../helpers';
import {makeRoute} from '../../../../routes';

type CreatedUsers = {
    admin: UserWithRolesModel;
    user: UserWithRolesModel;
    user2: UserWithRolesModel;
    userWithoutRoles: UserWithRolesModel;
};

const pickCreatedUserFields = (user: UserModel, roles: UserRole[]): UserWithRolesModel => ({
    ...pick(user, [
        UserModelColumn.Login,
        UserModelColumn.Email,
        UserModelColumn.FirstName,
        UserModelColumn.LastName,
        UserModelColumn.IdpSlug,
        UserModelColumn.IdpType,
    ]),
    userId: encodeId(user.userId),
    roles: expect.toIncludeSameMembers(roles),
});

describe('Fetch users list', () => {
    let user = {} as Awaited<ReturnType<typeof createTestUsers>>,
        userWithoutRoles = {} as Awaited<ReturnType<typeof createTestUsers>>,
        userTokens = {} as Awaited<ReturnType<typeof generateTokens>>,
        simpleUserTokens = {} as Awaited<ReturnType<typeof generateTokens>>;
    const createdUsers = {} as CreatedUsers;

    beforeAll(async () => {
        const adminRoles = [UserRole.Admin];
        const admin = await createTestUsers({
            login: 'fetch-test-admin-user',
            firstName: 'Vosgi',
            lastName: 'Astghik',
            email: 'fetch-first@edu.ru',
            roles: adminRoles,
        });
        createdUsers['admin'] = pickCreatedUserFields(admin, adminRoles);

        const userRoles = [UserRole.Viewer];
        user = await createTestUsers({
            login: 'fetch-test-user',
            firstName: 'Алексей',
            lastName: 'Толстой',
            email: 'fetch-second@edu.ru',
            roles: userRoles,
        });
        createdUsers['user'] = pickCreatedUserFields(user, userRoles);

        const user2Roles = [UserRole.Editor, UserRole.Viewer];
        const user2 = await createTestUsers({
            login: 'fetch-test-user-2',
            firstName: 'Armen',
            lastName: 'Manesgi',
            email: 'fetch-third@edu.ru',
            roles: user2Roles,
        });
        createdUsers['user2'] = pickCreatedUserFields(user2, user2Roles);

        userWithoutRoles = await createTestUsers({
            login: 'fetch-test-user-without-roles',
            roles: [],
        });
        createdUsers['userWithoutRoles'] = pickCreatedUserFields(userWithoutRoles, []);

        userTokens = await generateTokens({userId: user.userId});
        simpleUserTokens = await generateTokens({userId: userWithoutRoles.userId});
    });

    test('Access denied without the token', async () => {
        const response = await request(app).post(makeRoute('fetchUsersList')).send({});
        expect(response.status).toBe(401);
    });

    test("User without roles can't fetch users", async () => {
        const response = await auth(request(app).post(makeRoute('fetchUsersList')), {
            accessToken: simpleUserTokens.accessToken,
        }).send({});

        expect(response.status).toBe(403);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ACCESS_DENIED,
        });
    });

    test('User can fetch users with userIds + filterString', async () => {
        const response = await auth(request(app).post(makeRoute('fetchUsersList')), {
            accessToken: userTokens.accessToken,
        }).send({
            userIds: [
                createdUsers['admin'].userId,
                createdUsers['user'].userId,
                createdUsers['user2'].userId,
                createdUsers['userWithoutRoles'].userId,
            ],
            filterString: 'fetch-test-user',
            pageSize: 1000,
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
            users: [createdUsers['user'], createdUsers['user2'], createdUsers['userWithoutRoles']],
        });
    });

    test('Filter by page, pageSize with userIds', async () => {
        const response1 = await auth(request(app).post(makeRoute('fetchUsersList')), {
            accessToken: userTokens.accessToken,
        }).send({
            userIds: [createdUsers['admin'].userId, createdUsers['user'].userId],
            page: 0,
            pageSize: 1,
        });
        expect(response1.status).toBe(200);
        expect(response1.body).toStrictEqual({
            nextPageToken: '1',
            users: [createdUsers['admin']],
        });

        const response2 = await auth(request(app).post(makeRoute('fetchUsersList')), {
            accessToken: userTokens.accessToken,
        }).send({
            userIds: [createdUsers['admin'].userId, createdUsers['user'].userId],
            page: 1,
            pageSize: 1,
        });
        expect(response2.status).toBe(200);
        expect(response2.body).toStrictEqual({
            nextPageToken: '2',
            users: [createdUsers['user']],
        });
    });
});
