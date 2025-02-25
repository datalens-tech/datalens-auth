import {randomBytes} from 'node:crypto';

import {comparePasswords, hashPassword} from './passwords';

const password = 'qwerty@123!';
const longPassword = randomBytes(256).toString('hex');
const dummyPassword = 'Password1!';
// hash from dummyPassword
const dummyHash =
    'arnHVFl5whQaxDvvdwQcBw:m9tBazMcHIsi3hiRX-qM9STQZYau3rCNTXxRQ9692EEYX-cJhidHjsYuBQnaErHdED0v2t7apJRALkGVtNTMFg';

describe('passwords', () => {
    test('comparePasswords: equal', async () => {
        const storedPasswordHash1 = await hashPassword(password);
        const compareResult1 = await comparePasswords({
            storedPasswordHash: storedPasswordHash1,
            inputPassword: password,
        });

        expect(compareResult1).toBe(true);
        expect(storedPasswordHash1.length).toBe(109);

        const storedPasswordHash2 = await hashPassword(longPassword);
        const compareResult2 = await comparePasswords({
            storedPasswordHash: storedPasswordHash2,
            inputPassword: longPassword,
        });

        expect(compareResult2).toBe(true);
        expect(storedPasswordHash2.length).toBe(109);
    });

    test('comparePasswords: not equal', async () => {
        const inputPassword = 'qwerty@321!';
        const storedPasswordHash = await hashPassword(password);
        const compareResult1 = await comparePasswords({storedPasswordHash, inputPassword});
        const compareResult2 = await comparePasswords({
            storedPasswordHash,
            inputPassword: longPassword,
        });

        expect(compareResult1).toBe(false);
        expect(compareResult2).toBe(false);
    });

    test('hashPassword: not equal with the same password', async () => {
        const hash1 = await hashPassword(password);
        const hash2 = await hashPassword(password);

        expect(hash1 === hash2).toBe(false);

        const hash3 = await hashPassword(longPassword);
        const hash4 = await hashPassword(longPassword);

        expect(hash3 === hash4).toBe(false);
    });

    test('dummy hash compare', async () => {
        const compareResult = await comparePasswords({
            storedPasswordHash: dummyHash,
            inputPassword: dummyPassword,
        });

        expect(compareResult).toBe(true);
    });
});
