import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {
    ExchangeServiceAccountTokenResult,
    exchangeServiceAccountToken,
} from '../../services/service-accounts/exchange-token';

const requestSchema = {
    body: z.object({
        jwt: z.string().min(1),
    }),
};

const responseSchema = z
    .object({
        accessToken: z.string(),
    })
    .describe('Service account access token');

type ExchangeServiceAccountTokenModel = z.infer<typeof responseSchema>;

const format = (data: ExchangeServiceAccountTokenResult): ExchangeServiceAccountTokenModel => {
    return {
        accessToken: data.accessToken,
    };
};

const parseReq = makeReqParser(requestSchema);

export const exchangeServiceAccountTokenController: AppRouteHandler = async (
    req,
    res: Response<ExchangeServiceAccountTokenModel>,
) => {
    const {body} = await parseReq(req);

    const result = await exchangeServiceAccountToken({ctx: req.ctx}, {clientJwt: body.jwt});

    res.status(200).send(format(result));
};

exchangeServiceAccountTokenController.api = {
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
