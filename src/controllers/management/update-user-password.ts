import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {updateUserPassword} from '../../services/users/update-user-password';
import {SuccessResponseModel, successModel} from '../reponse-models';

const requestSchema = {
    params: z.object({
        userId: zc.decodeId(),
    }),
    body: z.object({
        newPassword: zc.password(),
    }),
};

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (req, res: Response<SuccessResponseModel>) => {
    const {params, body} = await parseReq(req);

    await updateUserPassword(
        {ctx: req.ctx},
        {
            userId: params.userId,
            newPassword: body.newPassword,
            oldPassword: body.newPassword,
            checkOldPassword: false,
        },
    );

    res.status(200).send(successModel.format());
};

controller.api = {
    summary: 'Update a user password',
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

export {controller as updateUserPassword};
