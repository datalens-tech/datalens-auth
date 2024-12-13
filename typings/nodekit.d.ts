import type {FeaturesConfig} from '../src/components/features/types';
import type {Registry} from '../src/registry';
import type {CtxInfo, CtxUser} from '../src/types/ctx';

export interface SharedAppConfig {
    features: FeaturesConfig;
    dynamicFeaturesEndpoint?: string;
    masterToken: string[];

    uiAppEndpoint: string;

    accessTokenTTL: number;
    refreshTokenTTL: number;
    sessionTTL: number;

    tokenPrivateKey: string;
    tokenPublicKey: string;
}

export interface SharedAppDynamicConfig {
    features?: FeaturesConfig;
}

export interface SharedAppContextParams {
    info: CtxInfo;
    registry: Registry;
    user: CtxUser;
}

declare module '@gravity-ui/nodekit' {
    export interface AppConfig extends SharedAppConfig {}

    export interface AppDynamicConfig extends SharedAppDynamicConfig {}

    export interface AppContextParams extends SharedAppContextParams {}
}
