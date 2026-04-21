import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {deleteServiceAccount} from '../../services/service-accounts/delete-service-account';
import {SuccessResponseModel, successModel} from '../response-models';

const requestSchema = {
    params: z.object({
        serviceAccountId: zc.decodeId(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const deleteServiceAccountController: AppRouteHandler = async (
    req,
    res: Response<SuccessResponseModel>,
) => {
    const {params} = await parseReq(req);

    await deleteServiceAccount({ctx: req.ctx}, {serviceAccountId: params.serviceAccountId});

    res.status(200).send(successModel.format());
};

deleteServiceAccountController.api = {
    summary: 'Delete a service account',
    tags: [ApiTag.Management],
    request: {
        params: requestSchema.params,
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
