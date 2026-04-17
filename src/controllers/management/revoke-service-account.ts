import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {revokeServiceAccount} from '../../services/service-accounts/revoke-service-account';
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
    })
    .describe('Revoked service account');

type ResponseBody = z.infer<typeof responseSchema>;

export const revokeServiceAccountController: AppRouteHandler = async (
    req,
    res: Response<ResponseBody>,
) => {
    const {params} = await parseReq(req);

    const result = await revokeServiceAccount(
        {ctx: req.ctx},
        {serviceAccountId: params.serviceAccountId},
    );

    res.status(200).send({serviceAccountId: encodeId(result.serviceAccountId)});
};

revokeServiceAccountController.api = {
    summary: 'Revoke a service account',
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
