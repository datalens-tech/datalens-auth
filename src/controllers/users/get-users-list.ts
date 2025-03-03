import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {UserRole} from '../../constants/role';
import {getUsersList} from '../../services/users/get-users-list';

import {UserListResponseModel, usersListModel} from './response-models/users-list-model';

const requestSchema = {
    query: z.object({
        page: zc.stringNumber({min: 0}).optional().describe('Example: 0'),
        pageSize: zc.stringNumber({min: 1, max: 100}).optional().describe('Example: 20'),
        filterString: z.string().min(1).max(100).optional().describe('Example: Smith'),
        idpType: z.string().min(1).max(100).optional().describe('Example: ldap'),
        roles: zc
            .enumToArray({value: UserRole, min: 1, max: 10})
            .optional()
            .describe(`Example: ?roles=${UserRole.Admin}&roles=${UserRole.Editor}`),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getUsersListController: AppRouteHandler = async (
    req,
    res: Response<UserListResponseModel>,
) => {
    const {query} = await parseReq(req);

    const result = await getUsersList(
        {ctx: req.ctx},
        {
            page: query.page,
            pageSize: query.pageSize,
            filterString: query.filterString,
            idpType: query.idpType,
            roles: query.roles,
        },
    );

    res.status(200).send(await usersListModel.format(result));
};

getUsersListController.api = {
    summary: 'Users list',
    tags: [ApiTag.Users],
    request: {
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: usersListModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: usersListModel.schema,
                },
            },
        },
    },
};
