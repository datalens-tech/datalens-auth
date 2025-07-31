import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {getUsersByIds} from '../../services/users/get-users-by-Ids';
import {userWithRolesModelArray} from '../reponse-models/users/user-with-roles-model-array';

const requestSchema = {
    body: z.object({
        subjectIds: zc.decodeIdArray({min: 1, max: 1000}),
    }),
};

const parseReq = makeReqParser(requestSchema);

const responseSchema = z
    .object({
        users: userWithRolesModelArray.schema,
    })
    .describe('Users by ids');

export type GetUsersByIdsModel = z.infer<typeof responseSchema>;

const format = async (
    data: Awaited<ReturnType<typeof getUsersByIds>>,
): Promise<GetUsersByIdsModel> => {
    const users = data.users.map((user) => ({...user, roles: user.roles.map(({role}) => role)}));
    return {
        users: await userWithRolesModelArray.format(users),
    };
};

export const getUsersByIdsController: AppRouteHandler = async (
    req,
    res: Response<GetUsersByIdsModel>,
) => {
    const {body} = await parseReq(req);

    const result = await getUsersByIds(
        {ctx: req.ctx},
        {
            subjectIds: body.subjectIds,
        },
    );

    res.status(200).send(await format(result));
};

getUsersByIdsController.api = {
    summary: 'Users list by ids',
    tags: [ApiTag.Users],
    request: {
        body: {
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: requestSchema.body,
                },
            },
        },
    },
    responses: {
        200: {
            description: responseSchema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: responseSchema,
                },
            },
        },
    },
};
