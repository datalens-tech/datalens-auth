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
                    message,
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
