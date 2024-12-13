import {encodeData} from '../utils/ids';

export async function prepareResponse<R = unknown>(
    data: unknown,
): Promise<{code: number; response: R}> {
    const response: any = await encodeData(data);

    if (response.refreshTokens) {
        response.refreshTokens = await encodeData(response.refreshTokens);
    }
    if (response.sessions) {
        response.sessions = await encodeData(response.sessions);
    }
    if (response.users) {
        response.users = await encodeData(response.sessions);
    }

    return {code: 200, response};
}
