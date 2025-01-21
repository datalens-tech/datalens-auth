// more than 8 chars
// at least one uppercase character [A-Z]
// at least one lowercase character [a-z]
// at least one special character [!@#$%^&*-_]
// at least one number
// and any other symbols
export const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*_-]).{8,}$/;
export const PASSWORD_REGEX_ERROR_MESSAGE =
    'Password should be >= 8 chars with uppercase [A-Z] and lowercase [a-z] character, number and special character [!@#$%^&*_-]';

export const LOGIN_REGEX = /^[a-zA-Z][a-zA-Z\d_-]+[a-zA-Z\d]$/;
export const LOGIN_REGEX_ERROR_MESSAGE =
    'Login should starts with [a-zA-Z] character and may contain number and special character [_-]';
