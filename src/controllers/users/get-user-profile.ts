import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {getUserProfile} from '../../services/users/get-user-profile';
import {
    UserProfileResponseModel,
    userProfileModel,
} from '../reponse-models/users/user-profile-model';

const controller: AppRouteHandler = async (req, res: Response<UserProfileResponseModel>) => {
    const result = await getUserProfile(
        {ctx: req.ctx},
        {
            userId: req.ctx.get('user').userId,
        },
    );

    res.status(200).send(await userProfileModel.format(result));
};

controller.api = {
    summary: 'Get current user profile',
    tags: [ApiTag.Users],
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
