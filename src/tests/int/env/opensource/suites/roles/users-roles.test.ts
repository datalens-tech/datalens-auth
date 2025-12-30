import request from 'supertest';

import {BigIntId} from '../../../../../../db/types/id';
import {encodeId} from '../../../../../../utils/ids';
import {AUTH_ERROR, UserRole, app, auth, authMasterToken} from '../../../../auth';
import {createTestUsers, generateTokens} from '../../../../helpers';
import {makeRoute} from '../../../../routes';

async function expectUserRoles({
    userId,
    accessToken,
    roles,
}: {
    userId: BigIntId;
    accessToken: string;
    roles: `${UserRole}`[];
}) {
    const response = await auth(
        request(app).get(makeRoute('getUserProfile', {userId: encodeId(userId)})),
        {
            accessToken,
        },
    );
    expect(response.status).toBe(200);
    expect(response.body.profile.roles).toStrictEqual(expect.toIncludeSameMembers(roles));
}

describe('Change users roles', () => {
    let admin = {} as Awaited<ReturnType<typeof createTestUsers>>,
        user = {} as Awaited<ReturnType<typeof createTestUsers>>,
        userWithManyRoles = {} as Awaited<ReturnType<typeof createTestUsers>>,
        adminTokens = {} as Awaited<ReturnType<typeof generateTokens>>,
        userTokens = {} as Awaited<ReturnType<typeof generateTokens>>,
        userWithManyRolesTokens = {} as Awaited<ReturnType<typeof generateTokens>>;

    beforeAll(async () => {
        admin = await createTestUsers({login: 'test-admin', roles: [UserRole.Admin]});
        user = await createTestUsers({login: 'test-user', roles: [UserRole.Visitor]});
        userWithManyRoles = await createTestUsers({
            login: 'test-user-with-many-roles',
            roles: [
                UserRole.Visitor,
                UserRole.Viewer,
                UserRole.Editor,
                UserRole.Creator,
                UserRole.Admin,
            ],
        });
        adminTokens = await generateTokens({userId: admin.userId});
        userTokens = await generateTokens({userId: user.userId});
        userWithManyRolesTokens = await generateTokens({userId: userWithManyRoles.userId});
    });

    test('Access denied without the token', async () => {
        const responseAdd = await request(app)
            .post(makeRoute('addUsersRoles'))
            .send({
                deltas: [{role: UserRole.Viewer, subjectId: encodeId(user.userId)}],
            });
        expect(responseAdd.status).toBe(401);

        const responseRemove = await request(app)
            .post(makeRoute('removeUsersRoles'))
            .send({
                deltas: [{role: UserRole.Visitor, subjectId: encodeId(user.userId)}],
            });
        expect(responseRemove.status).toBe(401);

        const responseUpdate = await request(app)
            .post(makeRoute('updateUsersRoles'))
            .send({
                deltas: [
                    {
                        oldRole: UserRole.Visitor,
                        newRole: UserRole.Viewer,
                        subjectId: encodeId(user.userId),
                    },
                ],
            });
        expect(responseUpdate.status).toBe(401);
    });

    test("User can't change roles", async () => {
        const responseAdd = await auth(request(app).post(makeRoute('addUsersRoles')), {
            accessToken: userTokens.accessToken,
        }).send({
            deltas: [{role: UserRole.Viewer, subjectId: encodeId(user.userId)}],
        });
        expect(responseAdd.status).toBe(403);
        expect(responseAdd.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ACCESS_DENIED,
        });

        const responseRemove = await auth(request(app).post(makeRoute('removeUsersRoles')), {
            accessToken: userTokens.accessToken,
        }).send({
            deltas: [{role: UserRole.Visitor, subjectId: encodeId(user.userId)}],
        });
        expect(responseRemove.status).toBe(403);
        expect(responseRemove.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ACCESS_DENIED,
        });

        const responseUpdate = await auth(request(app).post(makeRoute('updateUsersRoles')), {
            accessToken: userTokens.accessToken,
        }).send({
            deltas: [
                {
                    oldRole: UserRole.Visitor,
                    newRole: UserRole.Viewer,
                    subjectId: encodeId(user.userId),
                },
            ],
        });
        expect(responseUpdate.status).toBe(403);
        expect(responseUpdate.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ACCESS_DENIED,
        });
    });

    test('Admin can add a role', async () => {
        const response = await auth(request(app).post(makeRoute('addUsersRoles')), {
            accessToken: adminTokens.accessToken,
        }).send({
            deltas: [{role: UserRole.Viewer, subjectId: encodeId(user.userId)}],
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});
        await expectUserRoles({
            userId: user.userId,
            accessToken: adminTokens.accessToken,
            roles: [UserRole.Visitor, UserRole.Viewer],
        });
    });

    test('Admin can add roles with previous role', async () => {
        const response = await auth(request(app).post(makeRoute('addUsersRoles')), {
            accessToken: adminTokens.accessToken,
        }).send({
            deltas: [
                {role: UserRole.Viewer, subjectId: encodeId(user.userId)},
                {role: UserRole.Creator, subjectId: encodeId(user.userId)},
                {role: UserRole.Editor, subjectId: encodeId(user.userId)},
                {role: UserRole.Visitor, subjectId: encodeId(admin.userId)},
            ],
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});
        await expectUserRoles({
            userId: user.userId,
            accessToken: adminTokens.accessToken,
            roles: [UserRole.Visitor, UserRole.Viewer, UserRole.Creator, UserRole.Editor],
        });
        await expectUserRoles({
            userId: admin.userId,
            accessToken: adminTokens.accessToken,
            roles: [UserRole.Visitor, UserRole.Admin],
        });
    });

    test('Admin can remove a role', async () => {
        const response = await auth(request(app).post(makeRoute('removeUsersRoles')), {
            accessToken: adminTokens.accessToken,
        }).send({
            deltas: [{role: UserRole.Viewer, subjectId: encodeId(user.userId)}],
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});
        await expectUserRoles({
            userId: user.userId,
            accessToken: adminTokens.accessToken,
            roles: [UserRole.Visitor, UserRole.Creator, UserRole.Editor],
        });
    });

    test('Admin can remove roles with not existed role', async () => {
        const response = await auth(request(app).post(makeRoute('removeUsersRoles')), {
            accessToken: adminTokens.accessToken,
        }).send({
            deltas: [
                {role: UserRole.Viewer, subjectId: encodeId(user.userId)},
                {role: UserRole.Visitor, subjectId: encodeId(user.userId)},
                {role: UserRole.Visitor, subjectId: encodeId(admin.userId)},
            ],
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});
        await expectUserRoles({
            userId: user.userId,
            accessToken: adminTokens.accessToken,
            roles: [UserRole.Creator, UserRole.Editor],
        });
        await expectUserRoles({
            userId: admin.userId,
            accessToken: adminTokens.accessToken,
            roles: [UserRole.Admin],
        });
    });

    test('Admin can update a role', async () => {
        const response = await auth(request(app).post(makeRoute('updateUsersRoles')), {
            accessToken: adminTokens.accessToken,
        }).send({
            deltas: [
                {
                    oldRole: UserRole.Creator,
                    newRole: UserRole.Viewer,
                    subjectId: encodeId(user.userId),
                },
            ],
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});
        await expectUserRoles({
            userId: user.userId,
            accessToken: adminTokens.accessToken,
            roles: [UserRole.Viewer, UserRole.Editor],
        });
    });

    test("Admin can't update not exists old role", async () => {
        const response = await auth(request(app).post(makeRoute('updateUsersRoles')), {
            accessToken: adminTokens.accessToken,
        }).send({
            deltas: [
                {
                    oldRole: UserRole.Creator,
                    newRole: UserRole.Admin,
                    subjectId: encodeId(user.userId),
                },
            ],
        });

        expect(response.status).toBe(404);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ROLE_NOT_EXISTS,
        });
    });

    test("Admin can't update a role to already exists", async () => {
        const response = await auth(request(app).post(makeRoute('updateUsersRoles')), {
            accessToken: adminTokens.accessToken,
        }).send({
            deltas: [
                {
                    oldRole: UserRole.Viewer,
                    newRole: UserRole.Editor,
                    subjectId: encodeId(user.userId),
                },
            ],
        });

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.NOT_CONSISTENT,
        });
    });

    test('Admin can update roles', async () => {
        const response = await auth(request(app).post(makeRoute('updateUsersRoles')), {
            accessToken: adminTokens.accessToken,
        }).send({
            deltas: [
                {
                    oldRole: UserRole.Viewer,
                    newRole: UserRole.Visitor,
                    subjectId: encodeId(user.userId),
                },
                {
                    oldRole: UserRole.Editor,
                    newRole: UserRole.Creator,
                    subjectId: encodeId(user.userId),
                },
                {
                    oldRole: UserRole.Admin,
                    newRole: UserRole.Editor,
                    subjectId: encodeId(admin.userId),
                },
            ],
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});
        await expectUserRoles({
            userId: user.userId,
            accessToken: userWithManyRolesTokens.accessToken,
            roles: [UserRole.Visitor, UserRole.Creator],
        });
        await expectUserRoles({
            userId: admin.userId,
            accessToken: userWithManyRolesTokens.accessToken,
            roles: [UserRole.Editor],
        });
    });

    test('The user with many roles has the same roles', async () => {
        await expectUserRoles({
            userId: userWithManyRoles.userId,
            accessToken: userWithManyRolesTokens.accessToken,
            roles: [
                UserRole.Visitor,
                UserRole.Viewer,
                UserRole.Editor,
                UserRole.Admin,
                UserRole.Creator,
            ],
        });
    });

    test('Add user role via private call', async () => {
        const response = await authMasterToken(
            request(app).post(makeRoute('privateAddUsersRoles')),
        ).send({
            deltas: [{role: UserRole.Viewer, subjectId: encodeId(user.userId)}],
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});
        await expectUserRoles({
            userId: user.userId,
            accessToken: userWithManyRolesTokens.accessToken,
            roles: [UserRole.Visitor, UserRole.Creator, UserRole.Viewer],
        });
    });

    test('Update user role via private call', async () => {
        const response = await authMasterToken(
            request(app).post(makeRoute('privateUpdateUsersRoles')),
        ).send({
            deltas: [
                {
                    oldRole: UserRole.Viewer,
                    newRole: UserRole.Editor,
                    subjectId: encodeId(user.userId),
                },
            ],
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});
        await expectUserRoles({
            userId: user.userId,
            accessToken: userWithManyRolesTokens.accessToken,
            roles: [UserRole.Visitor, UserRole.Creator, UserRole.Editor],
        });
    });

    test('Remove user role via private call', async () => {
        const response = await authMasterToken(
            request(app).post(makeRoute('privateRemoveUsersRoles')),
        ).send({
            deltas: [{role: UserRole.Editor, subjectId: encodeId(user.userId)}],
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});
        await expectUserRoles({
            userId: user.userId,
            accessToken: userWithManyRolesTokens.accessToken,
            roles: [UserRole.Visitor, UserRole.Creator],
        });
    });
});

describe('Revoked admin role introspection', () => {
    let admin = {} as Awaited<ReturnType<typeof createTestUsers>>,
        revokedAdmin = {} as Awaited<ReturnType<typeof createTestUsers>>,
        user = {} as Awaited<ReturnType<typeof createTestUsers>>,
        adminTokens = {} as Awaited<ReturnType<typeof generateTokens>>,
        revokedAdminTokens = {} as Awaited<ReturnType<typeof generateTokens>>;

    beforeAll(async () => {
        admin = await createTestUsers({login: 'introspect-admin', roles: [UserRole.Admin]});
        revokedAdmin = await createTestUsers({
            login: 'introspect-revoked-admin',
            roles: [UserRole.Admin],
        });
        user = await createTestUsers({login: 'introspect-user', roles: [UserRole.Visitor]});

        adminTokens = await generateTokens({userId: admin.userId});
        revokedAdminTokens = await generateTokens({userId: revokedAdmin.userId});

        const response = await authMasterToken(
            request(app).post(makeRoute('privateRemoveUsersRoles')),
        ).send({
            deltas: [{role: UserRole.Admin, subjectId: encodeId(revokedAdmin.userId)}],
        });
        expect(response.status).toBe(200);
    });

    test("Revoked admin can't add roles (introspection failed)", async () => {
        const response = await auth(request(app).post(makeRoute('addUsersRoles')), {
            accessToken: revokedAdminTokens.accessToken,
        }).send({
            deltas: [{role: UserRole.Viewer, subjectId: encodeId(user.userId)}],
        });

        expect(response.status).toBe(403);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ACCESS_DENIED,
        });
    });

    test("Revoked admin can't remove roles (introspection failed)", async () => {
        const response = await auth(request(app).post(makeRoute('removeUsersRoles')), {
            accessToken: revokedAdminTokens.accessToken,
        }).send({
            deltas: [{role: UserRole.Visitor, subjectId: encodeId(user.userId)}],
        });

        expect(response.status).toBe(403);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ACCESS_DENIED,
        });
    });

    test("Revoked admin can't update roles (introspection failed)", async () => {
        const response = await auth(request(app).post(makeRoute('updateUsersRoles')), {
            accessToken: revokedAdminTokens.accessToken,
        }).send({
            deltas: [
                {
                    oldRole: UserRole.Visitor,
                    newRole: UserRole.Viewer,
                    subjectId: encodeId(user.userId),
                },
            ],
        });

        expect(response.status).toBe(403);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ACCESS_DENIED,
        });
    });

    test('Active admin can still add roles', async () => {
        const response = await auth(request(app).post(makeRoute('addUsersRoles')), {
            accessToken: adminTokens.accessToken,
        }).send({
            deltas: [{role: UserRole.Viewer, subjectId: encodeId(user.userId)}],
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});
    });
});
