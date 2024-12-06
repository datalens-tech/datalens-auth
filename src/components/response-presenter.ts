import {encodeData} from '../utils/ids';

export async function prepareResponse<R = unknown>(
    data: unknown,
): Promise<{code: number; response: R}> {
    const response: any = await encodeData(data);

    if (response.results) {
        response.results = await encodeData(response.results);
    }

    return {code: 200, response};
}
