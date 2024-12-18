import {PASSWORD_REGEX} from './regexp';

describe('password regexp', () => {
    test('valid', () => {
        expect(PASSWORD_REGEX.test('$%_s-D123trg')).toBe(true);
        expect(PASSWORD_REGEX.test('12345678aA$')).toBe(true);
        expect(PASSWORD_REGEX.test('Флё_aA12345')).toBe(true);
    });

    test('not valid', () => {
        expect(PASSWORD_REGEX.test('')).toBe(false);
        expect(PASSWORD_REGEX.test('123')).toBe(false);
        expect(PASSWORD_REGEX.test('abcdefgtrh')).toBe(false);
        expect(PASSWORD_REGEX.test('abcde_fgtrh')).toBe(false);
        expect(PASSWORD_REGEX.test('abcde_fgt123')).toBe(false);
        expect(PASSWORD_REGEX.test('aA_1')).toBe(false);
    });
});
