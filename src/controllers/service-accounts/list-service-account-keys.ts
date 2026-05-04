import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {
    ListServiceAccountKeysResult,
    listServiceAccountKeys,
} from '../../services/service-accounts/list-service-account-keys';
import {serviceAccountKeyModelArray} from '../response-models/service-accounts/service-account-key-model-array';

const requestSchema = {
    params: z.object({
        serviceAccountId: zc.decodeId(),
    }),
    query: z.object({
        page: zc.stringNumber({min: 0}).optional().describe('Example: 0'),
        pageSize: zc.stringNumber({min: 1, max: 100}).optional().describe('Example: 20'),
    }),
};

const parseReq = makeReqParser(requestSchema);

const responseSchema = z
    .object({
        nextPageToken: z.string().optional(),
        keys: serviceAccountKeyModelArray.schema,
    })
    .describe('Service account keys list');

type ListServiceAccountKeysModel = z.infer<typeof responseSchema>;

const format = async (data: ListServiceAccountKeysResult): Promise<ListServiceAccountKeysModel> => {
    return {
        nextPageToken: data.nextPageToken,
        keys: await serviceAccountKeyModelArray.format(data.keys),
    };
};

export const listServiceAccountKeysController: AppRouteHandler = async (
    req,
    res: Response<ListServiceAccountKeysModel>,
) => {
    const {params, query} = await parseReq(req);

    const result = await listServiceAccountKeys(
        {ctx: req.ctx},
        {
            serviceAccountId: params.serviceAccountId,
            page: query.page,
            pageSize: query.pageSize,
        },
    );

    res.status(200).send(await format(result));
};

listServiceAccountKeysController.api = {
    summary: 'List service account keys',
    tags: [ApiTag.Management],
    request: {
        params: requestSchema.params,
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
