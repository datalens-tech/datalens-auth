import pick from 'lodash/pick';
import request from 'supertest';

import {UserModel, UserModelColumn} from '../../../../../../db/models/user';
import {encodeId} from '../../../../../../utils/ids';
import {UserRole, app, auth} from '../../../../auth';
import {createTestUsers, generateTokens} from '../../../../helpers';
import {makeRoute} from '../../../../routes';

type CreatedUsers = {
    user1: ReturnType<typeof pickCreatedUserFields>;
    user2: ReturnType<typeof pickCreatedUserFields>;
    user3: ReturnType<typeof pickCreatedUserFields>;
};

const pickCreatedUserFields = (user: UserModel) => ({
    ...pick(user, [
        UserModelColumn.Login,
        UserModelColumn.Email,
        UserModelColumn.FirstName,
        UserModelColumn.LastName,
    ]),
    userId: encodeId(user.userId),
});

describe('Get users by ids', () => {
    let userTokens = {} as Awaited<ReturnType<typeof generateTokens>>;
    const createdUsers = {} as CreatedUsers;

    beforeAll(async () => {
        const user1 = await createTestUsers({
            login: 'user1',
            firstName: 'User1',
            email: 'user1@user.ru',
            roles: [UserRole.Visitor],
        });
        createdUsers['user1'] = pickCreatedUserFields(user1);

        const user2 = await createTestUsers({
            login: 'user2',
            firstName: 'User2',
        });
        createdUsers['user2'] = pickCreatedUserFields(user2);

        const user3 = await createTestUsers({
            login: 'user3',
        });
        createdUsers['user3'] = pickCreatedUserFields(user3);

        userTokens = await generateTokens({userId: user1.userId});
    });

    test('Access denied without the token', async () => {
        const response = await request(app)
            .post(makeRoute('getUsersByIds'))
            .send({
                subjectIds: [createdUsers.user2.userId],
            });
        expect(response.status).toBe(401);
    });

    test('User can get all users', async () => {
        const response = await auth(request(app).post(makeRoute('getUsersByIds')), {
            accessToken: userTokens.accessToken,
        }).send({
            subjectIds: [
                createdUsers.user1.userId,
                createdUsers.user2.userId,
                createdUsers.user3.userId,
            ],
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
            users: expect.toIncludeSameMembers([
                createdUsers['user1'],
                createdUsers['user2'],
                createdUsers['user3'],
            ]),
        });
    });

    test('Skip not exists id', async () => {
        const response = await auth(request(app).post(makeRoute('getUsersByIds')), {
            accessToken: userTokens.accessToken,
        }).send({
            subjectIds: [createdUsers.user1.userId, 'jghw6klpj6tm5'],
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
            users: expect.toIncludeSameMembers([createdUsers['user1']]),
        });
    });
});
