import {JwtAuth} from '../../components/jwt-auth';
import {ServiceArgs} from '../../types/service';

export type ExchangeServiceAccountTokenResult = {
    accessToken: string;
};

export const exchangeServiceAccountToken = async (
    {ctx, trx}: ServiceArgs,
    {clientJwt}: {clientJwt: string},
): Promise<ExchangeServiceAccountTokenResult> => {
    const accessToken = await JwtAuth.exchangeServiceAccountToken({ctx, trx}, {clientJwt});

    return {accessToken};
};
