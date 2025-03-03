import {AppRouteHandler, Response} from '@gravity-ui/expresskit';
import requestIp from 'request-ip';

import {ApiTag} from '../../components/api-docs';
import {getAuthCookies, setAuthCookie} from '../../components/cookies';
import {JwtAuth} from '../../components/jwt-auth';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {AUTH_ERROR} from '../../constants/error-constants';
import {
    ErrorResponseModel,
    SuccessResponseModel,
    cookieHeaderSchema,
    errorModel,
    setCookieHeaderSchema,
    successModel,
} from '../reponse-models';

export const refreshController: AppRouteHandler = async (
    req,
    res: Response<SuccessResponseModel | ErrorResponseModel>,
) => {
    const {authCookie} = getAuthCookies(req);

    if (authCookie && authCookie.refreshToken) {
        try {
            const tokens = await JwtAuth.refreshTokens(
                {ctx: req.ctx},
                {
                    refreshToken: authCookie.refreshToken,
                    userIp: requestIp.getClientIp(req),
                },
            );
            setAuthCookie({req, res, tokens});
            res.status(200).send(successModel.format());
        } catch (err) {
            res.status(401).send({
                code: AUTH_ERROR.NEED_RESET,
                message: "Can't refresh tokens",
            });
        }
    } else {
        res.status(401).send({
            code: AUTH_ERROR.NEED_RESET,
            message: 'No refreshToken',
        });
    }
};

refreshController.api = {
    summary: 'Refresh token',
    tags: [ApiTag.Auth],
    request: {
        headers: [cookieHeaderSchema],
    },
    responses: {
        200: {
            description: 'Refresh token success',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: successModel.schema,
                },
            },
            headers: setCookieHeaderSchema,
        },
        401: {
            description: AUTH_ERROR.NEED_RESET,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: errorModel.schema,
                },
            },
        },
    },
};
