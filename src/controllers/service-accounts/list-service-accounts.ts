import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {z} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {listServiceAccounts} from '../../services/service-accounts/list-service-accounts';
import {serviceAccountModelArray} from '../reponse-models/service-accounts/service-account-model-array';

const responseSchema = z
    .object({
        serviceAccounts: serviceAccountModelArray.schema,
    })
    .describe('Service accounts list');

type ResponseBody = z.infer<typeof responseSchema>;

export const listServiceAccountsController: AppRouteHandler = async (
    req,
    res: Response<ResponseBody>,
) => {
    const result = await listServiceAccounts({ctx: req.ctx});

    res.status(200).send({
        serviceAccounts: await serviceAccountModelArray.format(result),
    });
};

listServiceAccountsController.api = {
    summary: 'List service accounts',
    tags: [ApiTag.Management],
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
