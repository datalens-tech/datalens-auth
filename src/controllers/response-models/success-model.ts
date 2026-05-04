import {z} from '../../components/zod';

const schema = z
    .object({
        done: z.boolean({message: 'true'}),
    })
    .describe('Success reponse');

export type SuccessResponseModel = z.infer<typeof schema>;

const format = (): SuccessResponseModel => ({done: true});

export const successModel = {
    schema,
    format,
};
