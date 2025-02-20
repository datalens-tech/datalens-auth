import {AppError} from '@gravity-ui/nodekit';
import {DBError} from 'db-errors';
import PG_ERROR from 'pg-error-constants';

import {AUTH_ERROR, READ_ONLY_MODE_CODE} from '../../constants/error-constants';

function getDBErrorCode(error: DBError): string {
    const nativeError = error.nativeError as Error & {code?: string};
    return nativeError?.code || '';
}

// eslint-disable-next-line complexity
export const prepareErrorResponse = (error: AppError | DBError) => {
    if (error instanceof DBError) {
        const dbCode = getDBErrorCode(error);
        switch (dbCode) {
            case PG_ERROR.UNIQUE_VIOLATION: {
                return {
                    code: 400,
                    response: {
                        code: AUTH_ERROR.DB_UNIQUE_VIOLATION,
                        message: 'The entity already exists',
                    },
                };
            }
            case PG_ERROR.NUMERIC_VALUE_OUT_OF_RANGE: {
                return {
                    code: 400,
                    response: {
                        code: AUTH_ERROR.NUMERIC_VALUE_OUT_OF_RANGE,
                        message: 'Wrong passed id',
                    },
                };
            }
            default:
                return {
                    code: 500,
                    response: {
                        message: 'Database error',
                    },
                };
        }
    }

    const {code, message, details} = error as AppError;

    switch (code) {
        case AUTH_ERROR.READ_ONLY_MODE_ENABLED: {
            return {
                code: READ_ONLY_MODE_CODE,
                response: {
                    code,
                },
            };
        }

        case AUTH_ERROR.VALIDATION_ERROR: {
            return {
                code: 400,
                response: {
                    code,
                    message,
                    details,
                },
            };
        }

        case AUTH_ERROR.USER_ALREADY_EXISTS: {
            return {
                code: 409,
                response: {
                    code,
                    message: 'The user already exists',
                },
            };
        }

        case AUTH_ERROR.USER_NOT_EXISTS: {
            return {
                code: 404,
                response: {
                    code,
                    message: "The user doesn't exist",
                },
            };
        }

        case AUTH_ERROR.OLD_PASSWORD_INCORRECT: {
            return {
                code: 400,
                response: {
                    code,
                    message: 'The old password is incorrect',
                },
            };
        }

        case AUTH_ERROR.ROLE_NOT_EXISTS: {
            return {
                code: 404,
                response: {
                    code,
                    message,
                },
            };
        }

        case AUTH_ERROR.NOT_CONSISTENT: {
            return {
                code: 400,
                response: {
                    code,
                    message,
                },
            };
        }

        case AUTH_ERROR.IDP_USER_UPDATE_NOT_ALLOWED: {
            return {
                code: 403,
                response: {
                    code,
                    message: 'Not allowed to change IdP user settings',
                },
            };
        }

        default:
            return {
                code: 500,
                response: {
                    message: 'Internal Server Error',
                },
            };
    }
};
