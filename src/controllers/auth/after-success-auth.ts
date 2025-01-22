import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {setAuthCookie} from '../../components/cookies';
import {z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {
    ErrorResponseModel,
    SuccessResponseModel,
    errorModel,
    setCookieHeaderSchema,
    successModel,
} from '../reponse-models';

const requestSchema = {
    body: z.object({
        login: zc.login(),
        password: zc.password(),
    }),
};

export const makeAfterSuccessAuthController = (summary: string) => {
    const controller: AppRouteHandler = async (
        req,
        res: Response<SuccessResponseModel | ErrorResponseModel>,
    ) => {
        if (!req.user) {
            res.status(500).send({message: 'No user'});
            return;
        }

        setAuthCookie({
            req,
            res,
            tokens: {
                accessToken: req.user.accessToken,
                refreshToken: req.user.refreshToken,
            },
        });

        res.status(200).send(successModel.format());
    };

    controller.api = {
        summary,
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
                description: 'Auth success',
                content: {
                    [CONTENT_TYPE_JSON]: {
                        schema: successModel.schema,
                    },
                },
                headers: setCookieHeaderSchema,
            },
            500: {
                description: 'No user',
                content: {
                    [CONTENT_TYPE_JSON]: {
                        schema: errorModel.schema,
                    },
                },
            },
        },
    };

    return controller;
};
