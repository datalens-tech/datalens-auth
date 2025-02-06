import type {PlatformAppRouteHandler, PlatformAppRouteParams} from '../src/types/expresskit';
import type {PlatformAuthorizedUser} from '../src/types/user';

declare global {
    namespace Express {
        interface User extends PlatformAuthorizedUser {}
    }
}

declare module '@gravity-ui/expresskit' {
    interface AppRouteParams extends PlatformAppRouteParams {}

    interface AppRouteHandler extends PlatformAppRouteHandler {}
}
