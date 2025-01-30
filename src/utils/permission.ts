import {Permission} from '../constants/permission';
import {UserRole} from '../constants/role';

const permissionToRoles = {
    [Permission.Manage]: [UserRole.Admin],
    [Permission.InstanceUse]: [
        UserRole.Admin,
        UserRole.Editor,
        UserRole.Viewer,
        UserRole.Visitor,
        UserRole.Creator,
    ],
};

export function checkPermission(args: {role: `${UserRole}`; permission: `${Permission}`}) {
    const {role, permission} = args;
    if (!(permission in permissionToRoles)) {
        return false;
    }
    const roles = permissionToRoles[permission];
    return roles.includes(role as UserRole);
}
