import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {updateServiceAccount} from '../../services/service-accounts/update-service-account';
import {SuccessResponseModel, successModel} from '../response-models';

const requestSchema = {
    params: z.object({
        serviceAccountId: zc.decodeId(),
    }),
    body: z.object({
        name: z.string().min(1).max(200),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const updateServiceAccountController: AppRouteHandler = async (
    req,
    res: Response<SuccessResponseModel>,
) => {
    const {params, body} = await parseReq(req);

    await updateServiceAccount(
        {ctx: req.ctx},
        {
            serviceAccountId: params.serviceAccountId,
            name: body.name,
        },
    );

    res.status(200).send(successModel.format());
};

updateServiceAccountController.api = {
    summary: 'Update a service account',
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
