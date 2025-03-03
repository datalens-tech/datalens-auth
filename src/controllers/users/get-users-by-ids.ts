import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {getUsersByIds} from '../../services/users/get-users-by-Ids';

import {UsersByIdsResponseModel, usersByIdsModel} from './response-models/users-model';

const requestSchema = {
    body: z.object({
        subjectIds: zc.decodeIdArray({min: 1, max: 1000}),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getUsersByIdsController: AppRouteHandler = async (
    req,
    res: Response<UsersByIdsResponseModel>,
) => {
    const {body} = await parseReq(req);

    const result = await getUsersByIds(
        {ctx: req.ctx},
        {
            subjectIds: body.subjectIds,
        },
    );

    res.status(200).send(await usersByIdsModel.format(result));
};

getUsersByIdsController.api = {
    summary: 'Users list by ids',
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
            description: usersByIdsModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: usersByIdsModel.schema,
                },
            },
        },
    },
};
