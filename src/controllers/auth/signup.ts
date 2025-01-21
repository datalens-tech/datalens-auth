import {AppRouteHandler, Response} from '@gravity-ui/expresskit';
import requestIp from 'request-ip';

import {ApiTag} from '../../components/api-docs';
import {setAuthCookie} from '../../components/cookies';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {USER_AGENT_HEADER} from '../../constants/header';
import {signup} from '../../services/auth/signup';
import {SuccessResponseModel, setCookieHeaderSchema, successModel} from '../reponse-models';

const requestSchema = {
    body: z.object({
        login: zc.login(),
        password: zc.password(),
        email: z.string().email().optional(),
        firstName: z.string().min(1).max(200).optional(),
        lastName: z.string().min(1).max(200).optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (req, res: Response<SuccessResponseModel>) => {
    const {body} = await parseReq(req);

    const tokens = await signup(
        {ctx: req.ctx},
        {
            login: body.login,
            email: body.email,
            firstName: body.firstName,
            lastName: body.lastName,
            password: body.password,
            userIp: requestIp.getClientIp(req),
            userAgent: req.headers[USER_AGENT_HEADER],
        },
    );

    setAuthCookie({req, res, tokens});
    res.status(200).send(successModel.format());
};

controller.api = {
    summary: 'Sign up',
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
            description: 'Sign up success',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: successModel.schema,
                },
            },
            headers: setCookieHeaderSchema,
        },
    },
};

export {controller as signup};
