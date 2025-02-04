import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {deleteUser} from '../../services/users/delete-user';
import {SuccessResponseModel, successModel} from '../reponse-models';

const requestSchema = {
    params: z.object({
        userId: zc.decodeId(),
    }),
};

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (req, res: Response<SuccessResponseModel>) => {
    const {params} = await parseReq(req);

    await deleteUser(
        {ctx: req.ctx},
        {
            userId: params.userId,
        },
    );

    res.status(200).send(successModel.format());
};

controller.api = {
    summary: 'Delete a user',
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

export {controller as deleteUser};
