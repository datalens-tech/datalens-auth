import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {deleteServiceAccountKey} from '../../services/service-accounts/delete-service-account-key';
import {SuccessResponseModel, successModel} from '../response-models';

const requestSchema = {
    params: z.object({
        serviceAccountId: zc.decodeId(),
        keyId: zc.decodeId(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const deleteServiceAccountKeyController: AppRouteHandler = async (
    req,
    res: Response<SuccessResponseModel>,
) => {
    const {params} = await parseReq(req);

    await deleteServiceAccountKey(
        {ctx: req.ctx},
        {serviceAccountId: params.serviceAccountId, keyId: params.keyId},
    );

    res.status(200).send(successModel.format());
};

deleteServiceAccountKeyController.api = {
    summary: 'Delete a service account key',
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
