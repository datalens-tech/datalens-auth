import {registry} from '../index';

import {Example} from './example';
import {createUserSuccess} from './services/create-user-success';
import {getUsersByIdsSuccess} from './services/get-users-by-ids-success';
import {getUsersListSuccess} from './services/get-users-list-success';
import {signinSuccess} from './services/signin-success';
import {signupSuccess} from './services/signup-success';

export const registerCommonPlugins = () => {
    registry.common.classes.register({
        Example,
    });

    registry.common.functions.register({
        signinSuccess,
        signupSuccess,
        createUserSuccess,
        getUsersListSuccess,
        getUsersByIdsSuccess,
    });
};
