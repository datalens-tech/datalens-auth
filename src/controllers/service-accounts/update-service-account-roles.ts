import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {UserRole} from '../../constants/role';
import {updateServiceAccountRoles} from '../../services/service-accounts/update-service-account-roles';
import {SuccessResponseModel, successModel} from '../reponse-models';

const requestSchema = {
    params: z.object({
        serviceAccountId: zc.decodeId(),
    }),
    body: z.object({
        deltas: z
            .object({
                oldRole: z.enum(UserRole),
                newRole: z.enum(UserRole),
            })
            .array()
            .min(1)
            .max(50),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const updateServiceAccountRolesController: AppRouteHandler = async (
    req,
    res: Response<SuccessResponseModel>,
) => {
    const {params, body} = await parseReq(req);

    await updateServiceAccountRoles(
        {ctx: req.ctx},
        {
            serviceAccountId: params.serviceAccountId,
            deltas: body.deltas,
        },
    );

    res.status(200).send(successModel.format());
};

updateServiceAccountRolesController.api = {
    summary: 'Update service account roles',
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
