import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {UserRole} from '../../constants/role';
import {addServiceAccountRoles} from '../../services/service-accounts/add-service-account-roles';
import {SuccessResponseModel, successModel} from '../reponse-models';

const requestSchema = {
    params: z.object({
        serviceAccountId: zc.decodeId(),
    }),
    body: z.object({
        roles: z.enum(UserRole).array().min(1).max(100),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const addServiceAccountRolesController: AppRouteHandler = async (
    req,
    res: Response<SuccessResponseModel>,
) => {
    const {params, body} = await parseReq(req);

    await addServiceAccountRoles(
        {ctx: req.ctx},
        {
            serviceAccountId: params.serviceAccountId,
            roles: body.roles,
        },
    );

    res.status(200).send(successModel.format());
};

addServiceAccountRolesController.api = {
    summary: 'Add service account roles',
    tags: [ApiTag.Management],
    request: {
        params: requestSchema.params,
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
            description: successModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: successModel.schema,
                },
            },
        },
    },
};
