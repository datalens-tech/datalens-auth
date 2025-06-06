import type {
    PlatformAppConfig,
    PlatformAppContextParams,
    PlatformAppDynamicConfig,
} from '../src/types/nodekit';

declare module '@gravity-ui/nodekit' {
    interface AppConfig extends PlatformAppConfig {}

    interface AppDynamicConfig extends PlatformAppDynamicConfig {}

    interface AppContextParams extends PlatformAppContextParams {}
}
