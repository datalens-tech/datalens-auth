import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {listServiceAccounts} from '../../services/service-accounts/list-service-accounts';
import {serviceAccountModelArray} from '../reponse-models/service-accounts/service-account-model-array';

export const listServiceAccountsController: AppRouteHandler = async (req, res) => {
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
            description: serviceAccountModelArray.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: serviceAccountModelArray.schema,
                },
            },
        },
    },
};
