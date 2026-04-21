import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {UserRole} from '../../constants/role';
import {createServiceAccount} from '../../services/service-accounts/create-service-account';
import {serviceAccountModel} from '../response-models/service-accounts/service-account-model';

const requestSchema = {
    body: z.object({
        name: z.string().min(1).max(200),
        description: z.string().min(1).max(500).optional(),
        roles: z.enum(UserRole).array().min(1).max(100),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const createServiceAccountController: AppRouteHandler = async (req, res) => {
    const {body} = await parseReq(req);

    const result = await createServiceAccount(
        {ctx: req.ctx},
        {
            name: body.name,
            description: body.description,
            roles: body.roles,
        },
    );

    res.status(200).send(serviceAccountModel.format(result));
};

createServiceAccountController.api = {
    summary: 'Create a service account',
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
            description: serviceAccountModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: serviceAccountModel.schema,
                },
            },
        },
    },
};
