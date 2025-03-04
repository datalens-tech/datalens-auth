import type {Request, Response} from '@gravity-ui/expresskit';
import type {ApiServiceActionConfig, GetAuthHeaders} from '@gravity-ui/gateway';
import type {AppContext} from '@gravity-ui/nodekit';

import {AUTHORIZATION_HEADER, AUTHORIZATION_HEADER_VALUE_PREFIX} from '../../constants/header';

export function createAction<TOutput, TParams = undefined, TTransformed = TOutput>(
    config: ApiServiceActionConfig<AppContext, Request, Response, TOutput, TParams, TTransformed>,
) {
    return config;
}

export type AuthArgsData = {
    accessToken?: string;
};

export const getAuthArgs = (req: Request, _res: Response): AuthArgsData => {
    return {
        accessToken: req.ctx.get('user')?.accessToken,
    };
};

const createGetAuthHeaders: () => GetAuthHeaders<AuthArgsData> = () => (params) => {
    const {authArgs} = params;

    const resultHeaders = {};

    if (authArgs?.accessToken) {
        Object.assign(resultHeaders, {
            [AUTHORIZATION_HEADER]: `${AUTHORIZATION_HEADER_VALUE_PREFIX} ${authArgs.accessToken}`,
        });
    }

    return resultHeaders;
};

export const getAuthHeaders: GetAuthHeaders<AuthArgsData> = createGetAuthHeaders();
