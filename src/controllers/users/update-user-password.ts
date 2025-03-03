import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {updateUserPassword} from '../../services/users/update-user-password';
import {SuccessResponseModel, successModel} from '../reponse-models';

const requestSchema = {
    body: z.object({
        newPassword: zc.password(),
        oldPassword: zc.password(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const updateUserPasswordController: AppRouteHandler = async (
    req,
    res: Response<SuccessResponseModel>,
) => {
    const {body} = await parseReq(req);

    await updateUserPassword(
        {ctx: req.ctx},
        {
            userId: req.ctx.get('user').userId,
            newPassword: body.newPassword,
            oldPassword: body.oldPassword,
            checkOldPassword: true,
        },
    );

    res.status(200).send(successModel.format());
};

updateUserPasswordController.api = {
    summary: 'Update current user password',
    tags: [ApiTag.Users],
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
            description: successModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: successModel.schema,
                },
            },
        },
    },
};
