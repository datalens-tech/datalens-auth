import pick from 'lodash/pick';
import request from 'supertest';

import type {UserWithRoleResponseModel} from '../../../../../../controllers/users/response-models/user-with-role-model';
import {UserModel, UserModelColumn} from '../../../../../../db/models/user';
import {encodeId} from '../../../../../../utils/ids';
import {AUTH_ERROR, UserRole, app, auth} from '../../../../auth';
import {createTestUsers, generateTokens} from '../../../../helpers';
import {makeRoute} from '../../../../routes';

type CreatedUsers = {
    admin: UserWithRoleResponseModel;
    user: UserWithRoleResponseModel;
    user2: UserWithRoleResponseModel;
    userWithoutRoles: UserWithRoleResponseModel;
};

const pickCreatedUserFields = (user: UserModel, roles: UserRole[]): UserWithRoleResponseModel => ({
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

describe('Get users list', () => {
    let user = {} as Awaited<ReturnType<typeof createTestUsers>>,
        userWithoutRoles = {} as Awaited<ReturnType<typeof createTestUsers>>,
        userTokens = {} as Awaited<ReturnType<typeof generateTokens>>,
        simpleUserTokens = {} as Awaited<ReturnType<typeof generateTokens>>;
    const createdUsers = {} as CreatedUsers;

    beforeAll(async () => {
        const adminRoles = [UserRole.Admin];
        const admin = await createTestUsers({
            login: 'test-admin-user',
            firstName: 'Vosgi',
            lastName: 'Astghik',
            email: 'first@edu.ru',
            roles: adminRoles,
        });
        createdUsers['admin'] = pickCreatedUserFields(admin, adminRoles);

        const userRoles = [UserRole.Viewer];
        user = await createTestUsers({
            login: 'test-user',
            firstName: 'Алексей',
            lastName: 'Толстой',
            email: 'second@edu.ru',
            roles: userRoles,
        });
        createdUsers['user'] = pickCreatedUserFields(user, userRoles);

        const user2Roles = [UserRole.Editor, UserRole.Viewer];
        const user2 = await createTestUsers({
            login: 'test-user-2',
            firstName: 'Armen',
            lastName: 'Manesgi',
            email: 'third@edu.ru',
            roles: user2Roles,
        });
        createdUsers['user2'] = pickCreatedUserFields(user2, user2Roles);

        userWithoutRoles = await createTestUsers({
            login: 'test-user-without-roles',
            roles: [],
        });
        createdUsers['userWithoutRoles'] = pickCreatedUserFields(userWithoutRoles, []);

        userTokens = await generateTokens({userId: user.userId});
        simpleUserTokens = await generateTokens({userId: userWithoutRoles.userId});
    });

    test('Access denied without the token', async () => {
        const response = await request(app).get(makeRoute('getUsersList'));
        expect(response.status).toBe(401);
    });

    test("User without roles can't get users", async () => {
        const response = await auth(request(app).get(makeRoute('getUsersList')), {
            accessToken: simpleUserTokens.accessToken,
        });
        expect(response.status).toBe(403);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ACCESS_DENIED,
        });
    });

    test('User can list all users', async () => {
        const response = await auth(request(app).get(makeRoute('getUsersList')), {
            accessToken: userTokens.accessToken,
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
            users: [
                createdUsers['admin'],
                createdUsers['user'],
                createdUsers['user2'],
                createdUsers['userWithoutRoles'],
            ],
        });
    });

    test('Filter by idpType', async () => {
        const response = await auth(request(app).get(makeRoute('getUsersList')), {
            accessToken: userTokens.accessToken,
        }).query({
            idpType: 'null',
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
            users: [
                createdUsers['admin'],
                createdUsers['user'],
                createdUsers['user2'],
                createdUsers['userWithoutRoles'],
            ],
        });
    });

    test('Filter by roles', async () => {
        const response1 = await auth(request(app).get(makeRoute('getUsersList')), {
            accessToken: userTokens.accessToken,
        }).query({
            roles: [UserRole.Editor],
        });
        expect(response1.status).toBe(200);
        expect(response1.body).toStrictEqual({
            users: [createdUsers['user2']],
        });

        const response2 = await auth(request(app).get(makeRoute('getUsersList')), {
            accessToken: userTokens.accessToken,
        }).query({
            roles: [UserRole.Admin, UserRole.Viewer],
        });
        expect(response2.status).toBe(200);
        expect(response2.body).toStrictEqual({
            users: [createdUsers['admin'], createdUsers['user'], createdUsers['user2']],
        });
    });

    test('Filter by filterString', async () => {
        const response1 = await auth(request(app).get(makeRoute('getUsersList')), {
            accessToken: userTokens.accessToken,
        }).query({
            filterString: 'test-user',
        });
        expect(response1.status).toBe(200);
        expect(response1.body).toStrictEqual({
            users: [createdUsers['user'], createdUsers['user2'], createdUsers['userWithoutRoles']],
        });

        const response2 = await auth(request(app).get(makeRoute('getUsersList')), {
            accessToken: userTokens.accessToken,
        }).query({
            filterString: 'Алекс',
        });
        expect(response2.status).toBe(200);
        expect(response2.body).toStrictEqual({
            users: [createdUsers['user']],
        });

        const response3 = await auth(request(app).get(makeRoute('getUsersList')), {
            accessToken: userTokens.accessToken,
        }).query({
            filterString: '@edu.ru',
        });
        expect(response3.status).toBe(200);
        expect(response3.body).toStrictEqual({
            users: [createdUsers['admin'], createdUsers['user'], createdUsers['user2']],
        });

        const response4 = await auth(request(app).get(makeRoute('getUsersList')), {
            accessToken: userTokens.accessToken,
        }).query({
            filterString: '%',
        });
        expect(response4.status).toBe(200);
        expect(response4.body).toStrictEqual({
            users: [],
        });
    });

    test('Filter by page, pageSize', async () => {
        const response1 = await auth(request(app).get(makeRoute('getUsersList')), {
            accessToken: userTokens.accessToken,
        }).query({
            page: 0,
            pageSize: 2,
        });
        expect(response1.status).toBe(200);
        expect(response1.body).toStrictEqual({
            nextPageToken: '1',
            users: [createdUsers['admin'], createdUsers['user']],
        });

        const response2 = await auth(request(app).get(makeRoute('getUsersList')), {
            accessToken: userTokens.accessToken,
        }).query({
            page: 1,
            pageSize: 2,
        });
        expect(response2.status).toBe(200);
        expect(response2.body).toStrictEqual({
            nextPageToken: '2',
            users: [createdUsers['user2'], createdUsers['userWithoutRoles']],
        });

        const response3 = await auth(request(app).get(makeRoute('getUsersList')), {
            accessToken: userTokens.accessToken,
        }).query({
            page: 2,
            pageSize: 2,
        });
        expect(response3.status).toBe(200);
        expect(response3.body).toStrictEqual({
            users: [],
        });
    });
});
