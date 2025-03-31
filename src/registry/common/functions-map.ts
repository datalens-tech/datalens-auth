import {makeFunctionTemplate} from '../utils/make-function-template';

import type {createUserSuccess} from './services/create-user-success';
import type {getUsersByIdsSuccess} from './services/get-users-by-ids-success';
import type {getUsersListSuccess} from './services/get-users-list-success';
import type {signinSuccess} from './services/signin-success';
import type {signupSuccess} from './services/signup-success';

export const commonFunctionsMap = {
    signinSuccess: makeFunctionTemplate<typeof signinSuccess>(),
    signupSuccess: makeFunctionTemplate<typeof signupSuccess>(),
    createUserSuccess: makeFunctionTemplate<typeof createUserSuccess>(),
    getUsersListSuccess: makeFunctionTemplate<typeof getUsersListSuccess>(),
    getUsersByIdsSuccess: makeFunctionTemplate<typeof getUsersByIdsSuccess>(),
} as const;
