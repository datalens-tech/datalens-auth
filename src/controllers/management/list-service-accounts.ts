import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {z} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {UserRole} from '../../constants/role';
import {listServiceAccounts} from '../../services/service-accounts/list-service-accounts';
import {encodeId} from '../../utils/ids';

const responseSchema = z
    .object({
        serviceAccounts: z
            .object({
                serviceAccountId: z.string(),
                name: z.string(),
                description: z.string().nullable(),
                roles: z.enum(UserRole).array(),
                createdBy: z.string(),
                createdAt: z.string(),
                revokedAt: z.string().nullable(),
            })
            .array(),
    })
    .describe('Service accounts list');

type ResponseBody = z.infer<typeof responseSchema>;

export const listServiceAccountsController: AppRouteHandler = async (
    req,
    res: Response<ResponseBody>,
) => {
    const result = await listServiceAccounts({ctx: req.ctx});

    res.status(200).send({
        serviceAccounts: result.map((sa) => ({
            serviceAccountId: encodeId(sa.serviceAccountId),
            name: sa.name,
            description: sa.description,
            roles: sa.roles as UserRole[],
            createdBy: encodeId(sa.createdBy),
            createdAt: sa.createdAt,
            revokedAt: sa.revokedAt,
        })),
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
