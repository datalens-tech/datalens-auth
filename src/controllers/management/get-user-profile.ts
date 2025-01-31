import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {getUserProfile} from '../../services/users/get-user-profile';
import {
    UserProfileResponseModel,
    userProfileModel,
} from '../reponse-models/users/user-profile-model';

const requestSchema = {
    params: z.object({
        userId: zc.decodeId(),
    }),
};

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (req, res: Response<UserProfileResponseModel>) => {
    const {params} = await parseReq(req);

    const result = await getUserProfile(
        {ctx: req.ctx},
        {
            userId: params.userId,
        },
    );

    res.status(200).send(await userProfileModel.format(result));
};

controller.api = {
    summary: 'Get a user profile',
    tags: [ApiTag.Management],
    request: {
        params: requestSchema.params,
    },
    responses: {
        200: {
            description: userProfileModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: userProfileModel.schema,
                },
            },
        },
    },
};

export {controller as getUserProfile};
