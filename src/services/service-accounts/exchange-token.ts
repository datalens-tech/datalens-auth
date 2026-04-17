import {JwtAuth} from '../../components/jwt-auth';
import {ServiceArgs} from '../../types/service';

export const exchangeServiceAccountToken = async (
    {ctx, trx}: ServiceArgs,
    {clientJwt}: {clientJwt: string},
) => {
    const accessToken = await JwtAuth.exchangeServiceAccountToken({ctx, trx}, {clientJwt});
    return {accessToken};
};
