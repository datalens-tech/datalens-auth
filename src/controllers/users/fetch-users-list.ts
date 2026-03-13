import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {UserRole} from '../../constants/role';
import {getUsersList} from '../../services/users/get-users-list';
import {userWithRolesModelArray} from '../reponse-models/users/user-with-roles-model-array';

const requestSchema = {
    body: z.object({
        page: z.number().int().min(0).optional(),
        pageSize: z.number().int().min(1).max(1000).optional(),
        filterString: z.string().min(1).max(100).optional(),
        idpType: z.string().min(1).max(100).optional(),
        roles: z.enum(UserRole).array().min(1).max(10).optional(),
        userIds: zc.decodeIdArray({min: 1}).optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

const responseSchema = z
    .object({
        nextPageToken: z.string().optional(),
        users: userWithRolesModelArray.schema,
    })
    .describe('Fetched users list');

export type FetchUsersListModel = z.infer<typeof responseSchema>;

const format = async (
    data: Awaited<ReturnType<typeof getUsersList>>,
): Promise<FetchUsersListModel> => {
    return {
        nextPageToken: data.nextPageToken,
        users: await userWithRolesModelArray.format(data.users),
    };
};

export const fetchUsersListController: AppRouteHandler = async (
    req,
    res: Response<FetchUsersListModel>,
) => {
    const {body} = await parseReq(req);

    const result = await getUsersList(
        {ctx: req.ctx},
        {
            page: body.page,
            pageSize: body.pageSize,
            filterString: body.filterString,
            idpType: body.idpType,
            roles: body.roles,
            userIds: body.userIds,
        },
    );

    res.status(200).send(await format(result));
};

fetchUsersListController.api = {
    summary: 'Fetch users list',
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
