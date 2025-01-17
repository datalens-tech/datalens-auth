import {encodeData} from '../utils/ids';

export async function prepareResponse<R = unknown>(
    data: unknown,
): Promise<{code: number; response: R}> {
    const response: any = await encodeData(data);

    return {code: 200, response};
}
