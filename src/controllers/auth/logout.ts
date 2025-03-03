import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {clearAuthCookies, getAuthCookies} from '../../components/cookies';
import {JwtAuth} from '../../components/jwt-auth';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {SuccessResponseModel, cookieHeaderSchema, successModel} from '../reponse-models';

export const logoutController: AppRouteHandler = async (
    req,
    res: Response<SuccessResponseModel>,
) => {
    const {authCookie} = getAuthCookies(req);

    if (authCookie && authCookie.refreshToken) {
        await JwtAuth.closeSession({ctx: req.ctx}, {refreshToken: authCookie.refreshToken});
    }

    clearAuthCookies(req, res);

    res.status(200).send(successModel.format());
};

logoutController.api = {
    summary: 'Logout',
    tags: [ApiTag.Auth],
    request: {
        headers: [cookieHeaderSchema],
    },
    responses: {
        200: {
            description: 'Logout success',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: successModel.schema,
                },
            },
        },
    },
};
