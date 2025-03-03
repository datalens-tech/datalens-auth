import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {updateUserProfile} from '../../services/users/update-user-profile';
import {SuccessResponseModel, successModel} from '../reponse-models';

const requestSchema = {
    body: z.object({
        email: z.string().email().optional().nullable(),
        firstName: z.string().min(1).max(200).optional().nullable(),
        lastName: z.string().min(1).max(200).optional().nullable(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const updateUserProfileController: AppRouteHandler = async (
    req,
    res: Response<SuccessResponseModel>,
) => {
    const {body} = await parseReq(req);

    await updateUserProfile(
        {ctx: req.ctx},
        {
            userId: req.ctx.get('user').userId,
            email: body.email,
            firstName: body.firstName,
            lastName: body.lastName,
        },
    );

    res.status(200).send(successModel.format());
};

updateUserProfileController.api = {
    summary: 'Update current user profile',
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
