import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {rotateServiceAccountKey} from '../../services/service-accounts/rotate-service-account-key';
import {encodeId} from '../../utils/ids';

const requestSchema = {
    params: z.object({
        serviceAccountId: zc.decodeId(),
    }),
};

const parseReq = makeReqParser(requestSchema);

const responseSchema = z
    .object({
        serviceAccountId: z.string(),
        privateKey: z.string(),
    })
    .describe('Rotated service account key');

type ResponseBody = z.infer<typeof responseSchema>;

export const rotateServiceAccountKeyController: AppRouteHandler = async (
    req,
    res: Response<ResponseBody>,
) => {
    const {params} = await parseReq(req);

    const result = await rotateServiceAccountKey(
        {ctx: req.ctx},
        {serviceAccountId: params.serviceAccountId},
    );

    res.status(200).send({
        serviceAccountId: encodeId(result.serviceAccountId),
        privateKey: result.privateKey,
    });
};

rotateServiceAccountKeyController.api = {
    summary: 'Rotate service account key',
    tags: [ApiTag.Management],
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
