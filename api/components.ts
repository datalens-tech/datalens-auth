export {getGatewayConfig} from '../src/components/gateway';

export {prepareErrorResponse} from '../src/components/error/error-response-presenter';

export {isEnabledFeature, Feature} from '../src/components/features';
export type {FeaturesConfig} from '../src/components/features/types';

export {isGatewayError} from '../src/components/gateway';

export {setRegistryToContext} from '../src/components/app-context';

export {registerApiRoute, initSwagger, ApiTag} from '../src/components/api-docs';

export {initPassport} from '../src/components/passport';
