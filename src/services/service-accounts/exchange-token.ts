import {exchangeServiceAccountToken as jwtExchangeServiceAccountToken} from '../../components/jwt-auth';
import {ServiceArgs} from '../../types/service';

export type ExchangeServiceAccountTokenResult = {
    accessToken: string;
};

export const exchangeServiceAccountToken = async (
    {ctx, trx}: ServiceArgs,
    {saToken}: {saToken: string},
): Promise<ExchangeServiceAccountTokenResult> => {
    const accessToken = await jwtExchangeServiceAccountToken({ctx, trx}, {saToken});

    return {accessToken};
};
