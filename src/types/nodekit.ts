import type {FeaturesConfig} from '../components/features/types';
import type {UserRole} from '../constants/role';
import type {Registry} from '../registry';

import type {PlatformCtxInfo, PlatformCtxUser} from './ctx';

export interface PlatformAppConfig {
    features: FeaturesConfig;
    dynamicFeaturesEndpoint?: string;
    masterToken: string[];

    uiAppEndpoint: string;

    accessTokenTTL: number;
    refreshTokenTTL: number;
    sessionTTL: number;

    tokenPrivateKey: string;
    tokenPublicKey: string;

    defaultRole: `${UserRole}`;

    swaggerEnabled: boolean;

    manageLocalUsersDisabled: boolean;
    signupDisabled: boolean;
}

export interface PlatformAppDynamicConfig {
    features?: FeaturesConfig;
}

export interface PlatformAppContextParams {
    info: PlatformCtxInfo;
    registry: Registry;
    user: PlatformCtxUser;
}
