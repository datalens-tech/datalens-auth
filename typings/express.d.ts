import type {AuthorizedUser} from '../src/types/user';

declare global {
    namespace Express {
        interface User extends AuthorizedUser {}
    }
}

export interface SharedAppRouteParams {
    private?: boolean;
    write?: boolean;
}

declare module '@gravity-ui/expresskit' {
    export interface AppRouteParams extends SharedAppRouteParams {}
}
