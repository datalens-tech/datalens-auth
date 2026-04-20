import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {createServiceAccountKey} from '../../services/service-accounts/create-service-account-key';
import {encodeId} from '../../utils/ids';

const requestSchema = {
    params: z.object({
        serviceAccountId: zc.decodeId(),
    }),
};

const parseReq = makeReqParser(requestSchema);

const responseSchema = z
    .object({
        keyId: z.string(),
        serviceAccountId: z.string(),
        privateKey: z.string(),
    })
    .describe('Created service account key');

type ResponseBody = z.infer<typeof responseSchema>;

export const createServiceAccountKeyController: AppRouteHandler = async (
    req,
    res: Response<ResponseBody>,
) => {
    const {params} = await parseReq(req);

    const result = await createServiceAccountKey(
        {ctx: req.ctx},
        {serviceAccountId: params.serviceAccountId},
    );

    res.status(200).send({
        keyId: encodeId(result.keyId),
        serviceAccountId: encodeId(result.serviceAccountId),
        privateKey: result.privateKey,
    });
};

createServiceAccountKeyController.api = {
    summary: 'Create a service account key',
    tags: [ApiTag.Management],
    request: {
        params: requestSchema.params,
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
