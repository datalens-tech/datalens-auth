import {randomBytes} from 'node:crypto';

import {decrypt, encrypt} from './cipher';

const text = 'Hello, мир!';
const longText = randomBytes(256).toString('hex');
const publicKeyText =
    '-----BEGIN PUBLIC KEY-----\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAuDlaRfE/755Vd0c0C9O9\n5tvepCGBJ4Bis32UHn8dIKTABLvvj1Usk5gxa7Qp4dOYFinyNUFX0+IBZ4ZcxWxp\nEZct2VDXkU9K6vYzVlfjNpaygW3cj77zhcKEAzTueyJ6zOR68ozEKu5rz6wTYKly\n9DL4/tXjO55lLpvT3tYQRYIbAOzFCEeIgkLBGtLOlUQmmKRrMGQ1Xk7jivh61rVN\ni16lNijRvUBIB0oEyc25D7LJf5drkuYyZbThG1i+cEsqeVs6JGalIvGwkCoBe1JT\nS1/E73wxyJYhTucWbWekHfydzGySSp8DrnAkO2gztYDf3pLyfkKU01m/rc5su7Uv\nBiH4z3VLE9KL2j1Dzrx6OAZ0h9hJa0YecsFcOr7p/pwbdNPOM2tnfOZkWd71ogQ4\nQFu+pqq9SGvhR6K6pegsTEvX3uacvOwtscJbyqcfMPLpzD0qriyyZn3sAjlLviUH\nsy29W1n3APPpAGVFUAx9dKc6u+W1UU4a/DWgWlFB9nnILn2UaKN1G4kImaqQ60rB\npIZMmSDJD9U3aIvQv5Dp4o5BDqP0ea//oVk0nHNGO0Y2TIZcTm+YFaWiwrYAJt6h\nrevltWzGZOCRSgjTv9rDNOf3cLFyk24QTd72ADf0Bm0Y2KdittxeHmTQ73lrUnXc\nwEkYiASAST3iA+X+yg6exOcCAwEAAQ==\n-----END PUBLIC KEY-----\n';
const securitykey1 = randomBytes(16).toString('hex');
const securitykey2 = randomBytes(16).toString('hex');

describe('cipher', () => {
    test('encrypt/decrypt: equal', async () => {
        const encryptedText1 = await encrypt(text, securitykey1);
        const decryptedText1 = await decrypt(encryptedText1, securitykey1);
        expect(text).toBe(decryptedText1);

        const encryptedText2 = await encrypt(text, securitykey2);
        const decryptedText2 = await decrypt(encryptedText2, securitykey2);
        expect(text).toBe(decryptedText2);

        const encryptedLongText = await encrypt(longText, securitykey1);
        const decryptedLongText = await decrypt(encryptedLongText, securitykey1);
        expect(longText).toBe(decryptedLongText);

        const encryptedPublicKeyText = await encrypt(publicKeyText, securitykey1);
        const decryptedPublicKeyText = await decrypt(encryptedPublicKeyText, securitykey1);
        expect(publicKeyText).toBe(decryptedPublicKeyText);
    });

    test('encrypt/decrypt: not equal', async () => {
        const encryptedText1 = await encrypt(text.slice(0, -1), securitykey1);
        const decryptedText1 = await decrypt(encryptedText1, securitykey1);
        expect(text === decryptedText1).toBe(false);

        let threwError = false;
        try {
            const encryptedText2 = await encrypt(text, securitykey1);
            const decryptedText2 = await decrypt(encryptedText2, securitykey2);
            expect(text === decryptedText2).toBe(false);
        } catch {
            threwError = true;
        }
        if (threwError) {
            expect(threwError).toBe(true);
        }
    });

    test('encrypted text not equal with the same text', async () => {
        const encryptedText1 = await encrypt(text, securitykey1);
        const encryptedText2 = await encrypt(text, securitykey1);
        expect(encryptedText1 === encryptedText2).toBe(false);
    });
});
