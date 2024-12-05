import type {FeaturesConfig} from '../src/components/features/types';
import type {Registry} from '../src/registry';
import type {CtxInfo} from '../src/types/ctx';

export interface SharedAppConfig {
    features: FeaturesConfig;
    dynamicFeaturesEndpoint?: string;
    masterToken: string[];
}

export interface SharedAppDynamicConfig {
    features?: FeaturesConfig;
}

export interface SharedAppContextParams {
    info: CtxInfo;
    registry: Registry;
}

declare module '@gravity-ui/nodekit' {
    export interface AppConfig extends SharedAppConfig {}

    export interface AppDynamicConfig extends SharedAppDynamicConfig {}

    export interface AppContextParams extends SharedAppContextParams {}
}

export interface SharedAppRouteParams {
    private?: boolean;
    write?: boolean;
}

declare module '@gravity-ui/expresskit' {
    export interface AppRouteParams extends SharedAppRouteParams {}
}
