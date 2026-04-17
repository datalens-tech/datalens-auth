import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {exchangeServiceAccountToken} from '../../services/service-accounts/exchange-token';

const requestSchema = {
    body: z.object({
        jwt: z.string().min(1),
    }),
};

const parseReq = makeReqParser(requestSchema);

const responseSchema = z
    .object({
        accessToken: z.string(),
    })
    .describe('Service account access token');

type ResponseBody = z.infer<typeof responseSchema>;

export const exchangeTokenController: AppRouteHandler = async (
    req,
    res: Response<ResponseBody>,
) => {
    const {body} = await parseReq(req);

    const result = await exchangeServiceAccountToken({ctx: req.ctx}, {clientJwt: body.jwt});

    res.status(200).send(result);
};

exchangeTokenController.api = {
    summary: 'Exchange service account JWT for access token',
    tags: [ApiTag.Auth],
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
