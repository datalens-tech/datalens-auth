import {AppError} from '@gravity-ui/nodekit';
import Ajv from 'ajv';

import {AUTH_ERROR} from '../../constants/error-constants';

const ajv = new Ajv({
    allErrors: true,
    verbose: true,
});

const compileSchema = (schema: object) => {
    const validate = ajv.compile(schema);

    return (data: object) => {
        const isValid = validate(data);

        return {
            isValid,
            validationErrors: ajv.errorsText(validate.errors),
        };
    };
};

export const makeSchemaValidator = (schema: object) => {
    const preparedSchema = compileSchema(schema);
    return <T extends object>(data: T): T => {
        const {isValid, validationErrors} = preparedSchema(data);
        if (!isValid) {
            throw new AppError('Validation error', {
                code: AUTH_ERROR.VALIDATION_ERROR,
                details: {validationErrors},
            });
        }
        return data;
    };
};
