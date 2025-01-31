import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {UserRole} from '../../constants/role';
import {createUser} from '../../services/users/create-user';

import {CreateUserResponseModel, createUserModel} from './response-models/create-user-model';

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

const controller: AppRouteHandler = async (req, res: Response<CreateUserResponseModel>) => {
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

    res.status(200).send(createUserModel.format(result));
};

controller.api = {
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
            description: createUserModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: createUserModel.schema,
                },
            },
        },
    },
};

export {controller as createUser};
