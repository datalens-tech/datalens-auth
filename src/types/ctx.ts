export interface UserCtxInfo {
    userId: string;
    login: string;
}

export interface CtxInfo {
    requestId: string;
    isPrivateRoute: boolean;
    readOnlyMode: boolean;
    user: UserCtxInfo;
}
