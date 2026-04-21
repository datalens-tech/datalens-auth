import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {
    ListServiceAccountsResult,
    listServiceAccounts,
} from '../../services/service-accounts/list-service-accounts';
import {serviceAccountWithRolesModelArray} from '../response-models/service-accounts/service-account-with-roles-model-array';

const requestSchema = {
    query: z.object({
        page: zc.stringNumber({min: 0}).optional().describe('Example: 0'),
        pageSize: zc.stringNumber({min: 1, max: 100}).optional().describe('Example: 20'),
    }),
};

const parseReq = makeReqParser(requestSchema);

const responseSchema = z
    .object({
        nextPageToken: z.string().optional(),
        serviceAccounts: serviceAccountWithRolesModelArray.schema,
    })
    .describe('Service accounts list');

type ListServiceAccountsModel = z.infer<typeof responseSchema>;

const format = async (data: ListServiceAccountsResult): Promise<ListServiceAccountsModel> => {
    return {
        nextPageToken: data.nextPageToken,
        serviceAccounts: await serviceAccountWithRolesModelArray.format(data.serviceAccounts),
    };
};

export const listServiceAccountsController: AppRouteHandler = async (
    req,
    res: Response<ListServiceAccountsModel>,
) => {
    const {query} = await parseReq(req);

    const result = await listServiceAccounts(
        {ctx: req.ctx},
        {
            page: query.page,
            pageSize: query.pageSize,
        },
    );

    res.status(200).send(await format(result));
};

listServiceAccountsController.api = {
    summary: 'List service accounts',
    tags: [ApiTag.Management],
    request: {
        query: requestSchema.query,
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
