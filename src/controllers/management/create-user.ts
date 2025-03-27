import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {UserRole} from '../../constants/role';
import {createUser} from '../../services/users/create-user';
import {encodeId} from '../../utils/ids';

const requestSchema = {
    body: z.object({
        login: zc.login(),
        password: zc.password(),
        email: z.string().email().optional(),
        firstName: z.string().min(1).max(200).optional(),
        lastName: z.string().min(1).max(200).optional(),
        roles: z.nativeEnum(UserRole).array().min(1).max(100).optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

const responseSchema = z
    .object({
        userId: z.string(),
    })
    .describe('Created user model');

type ResponseBody = z.infer<typeof responseSchema>;

const format = (data: Awaited<ReturnType<typeof createUser>>): ResponseBody => {
    return {
        userId: encodeId(data.userId),
    };
};

export const createUserController: AppRouteHandler = async (req, res: Response<ResponseBody>) => {
    const {body} = await parseReq(req);

    const result = await createUser(
        {ctx: req.ctx},
        {
            login: body.login,
            email: body.email,
            firstName: body.firstName,
            lastName: body.lastName,
            password: body.password,
            roles: body.roles,
        },
    );

    res.status(200).send(format(result));
};

createUserController.api = {
    summary: 'Create a user',
    tags: [ApiTag.Management],
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
