import {LOGIN_REGEX, PASSWORD_REGEX} from './regexp';

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

describe('login regexp', () => {
    test('valid', () => {
        expect(LOGIN_REGEX.test('abc')).toBe(true);
        expect(LOGIN_REGEX.test('a1V')).toBe(true);
        expect(LOGIN_REGEX.test('b_2')).toBe(true);
        expect(LOGIN_REGEX.test('b-2')).toBe(true);
        expect(LOGIN_REGEX.test('ass223af_asf')).toBe(true);
    });

    test('not valid', () => {
        expect(LOGIN_REGEX.test('')).toBe(false);
        expect(LOGIN_REGEX.test('absds_')).toBe(false);
        expect(LOGIN_REGEX.test('3dr3ff')).toBe(false);
        expect(LOGIN_REGEX.test('ab')).toBe(false);
        expect(LOGIN_REGEX.test('_dsf')).toBe(false);
        expect(LOGIN_REGEX.test('aAф1')).toBe(false);
        expect(LOGIN_REGEX.test('g&ood')).toBe(false);
        expect(LOGIN_REGEX.test('a.b')).toBe(false);
    });
});
