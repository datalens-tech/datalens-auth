export {getGatewayConfig} from '../src/components/gateway';

export {makeSchemaValidator} from '../src/components/validation/validation-schema-compiler';

export {prepareResponse} from '../src/components/response-presenter';
export {prepareErrorResponse} from '../src/components/error/error-response-presenter';

export {isEnabledFeature, Feature} from '../src/components/features';
export type {FeaturesConfig} from '../src/components/features/types';

export {isGatewayError} from '../src/components/gateway';

export {setRegistryToContext} from '../src/components/app-context';
