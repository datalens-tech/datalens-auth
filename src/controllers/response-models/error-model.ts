import {z} from '../../components/zod';

const schema = z
    .object({
        message: z.string(),
        code: z.string().optional(),
        details: z.optional(z.record(z.string(), z.unknown())),
    })
    .describe('Success reponse');

export type ErrorResponseModel = z.infer<typeof schema>;

const format = (args: ErrorResponseModel): ErrorResponseModel => args;

export const errorModel = {
    schema,
    format,
};
