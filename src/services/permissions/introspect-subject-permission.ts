import type {Permission} from '../../constants/permission';
import type {PlatformCtxSubject} from '../../types/ctx';
import type {ServiceArgs} from '../../types/service';

import {introspectServiceAccountPermission} from './introspect-service-account-permission';
import {introspectUserPermission} from './introspect-user-permission';

export const introspectSubjectPermission = async (
    args: ServiceArgs,
    subject: PlatformCtxSubject,
    permission: `${Permission}`,
): Promise<boolean> => {
    if (subject.type === 'user') {
        return introspectUserPermission(args, {
            userId: subject.subjectId,
            permission,
        });
    }
    return introspectServiceAccountPermission(args, {
        serviceAccountId: subject.subjectId,
        permission,
    });
};
