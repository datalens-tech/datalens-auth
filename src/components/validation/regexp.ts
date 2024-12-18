// more than 8 chars
// less than 200 chars
// at least one uppercase character [A-Z]
// at least one lowercase character [a-z]
// at least one special character [!@#$%^&*-_]
// at least one number
// and any other symbols
export const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*-_]).{8,200}$/;
