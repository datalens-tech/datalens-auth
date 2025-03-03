import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeIdDecoder, makeReqParser, z} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {UserRole} from '../../constants/role';
import {removeUsersRoles} from '../../services/roles/remove-users-roles';
import {macrotasksMap} from '../../utils/ids';
import {SuccessResponseModel, successModel} from '../reponse-models';

const requestSchema = {
    body: z.object({
        deltas: z
            .object({
                role: z.nativeEnum(UserRole),
                subjectId: z.string(),
            })
            .array()
            .min(1)
            .max(50)
            .transform(async (values, ctx) => {
                return await macrotasksMap(values, (value) => ({
                    ...value,
                    subjectId: makeIdDecoder(ctx)(value.subjectId),
                }));
            }),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const removeUsersRolesController: AppRouteHandler = async (
    req,
    res: Response<SuccessResponseModel>,
) => {
    const {body} = await parseReq(req);

    await removeUsersRoles(
        {ctx: req.ctx},
        {
            deltas: body.deltas,
        },
    );

    res.status(200).send(successModel.format());
};

removeUsersRolesController.api = {
    summary: 'Remove users roles',
    tags: [ApiTag.Management],
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
