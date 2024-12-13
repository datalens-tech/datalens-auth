export interface CtxUser {
    userId: string;
    sessionId: string;
}

export interface CtxInfo {
    isPrivateRoute: boolean;
    readOnlyMode: boolean;
}
