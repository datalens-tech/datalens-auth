export {getGatewayConfig} from '../src/components/gateway';

export {prepareErrorResponse} from '../src/components/error/error-response-presenter';

export {isEnabledFeature, Feature} from '../src/components/features';
export type {FeaturesConfig} from '../src/components/features/types';

export {isGatewayError} from '../src/components/gateway';
export {
    createAction,
    getAuthArgs,
    getAuthHeaders,
    type AuthArgsData,
} from '../src/components/gateway/utils';

export {setRegistryToContext} from '../src/components/app-context';

export {registerApiRoute, initSwagger, ApiTag} from '../src/components/api-docs';

export {initPassport} from '../src/components/passport';

export {hashPassword, comparePasswords} from '../src/components/passwords';

export {encrypt, decrypt} from '../src/components/cipher';

export {
    makeParser,
    makeParserSync,
    makeReqParser,
    makeReqParserSync,
    makeIdDecoder,
    z,
    zc,
} from '../src/components/zod';

export {JwtAuth} from '../src/components/jwt-auth';

export {
    getBaseCookieOptions,
    setAuthCookie,
    clearAuthCookies,
    getAuthCookies,
    generateCookieName,
    getAuthCookieName,
    getAuthExpCookieName,
} from '../src/components/cookies';
