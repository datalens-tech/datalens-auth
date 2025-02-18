import {Buffer} from 'node:buffer';
import {createCipheriv, createDecipheriv, randomBytes} from 'node:crypto';
import {promisify} from 'node:util';

const randomBytesAsync = promisify(randomBytes);

const OUTPUT_ENCODING = 'base64url';
const TEXT_ENCODING = 'utf8';
const SEPARATOR = ':';
const ALGORITHM = 'aes-256-cbc';

/**
 * @param {string} text - text to encrypt
 * @param {number} securitykey - should be 16 bytes like 4a17ab470ff92acec6ca9a9cb82d25db - randomBytes(16).toString('hex')
 * @returns {string}
 */
export async function encrypt(text: string, securitykey: string) {
    const iv = await randomBytesAsync(16);
    const cipher = createCipheriv(ALGORITHM, Buffer.from(securitykey), iv);
    let encrypted = cipher.update(text, TEXT_ENCODING, OUTPUT_ENCODING);
    encrypted += cipher.final(OUTPUT_ENCODING);
    return iv.toString(OUTPUT_ENCODING) + SEPARATOR + encrypted;
}

/**
 * @param {string} encryptedText - text returned from encrypt function
 * @param {number} securitykey - should be 16 bytes like 4a17ab470ff92acec6ca9a9cb82d25db - randomBytes(16).toString('hex')
 * @returns {string}
 */
export async function decrypt(encryptedText: string, securitykey: string) {
    const [iv, text] = encryptedText.split(SEPARATOR);
    const ivBuffer = Buffer.from(iv, OUTPUT_ENCODING);
    const decipher = createDecipheriv(ALGORITHM, Buffer.from(securitykey), ivBuffer);
    let decrypted = decipher.update(text, OUTPUT_ENCODING, TEXT_ENCODING);
    decrypted += decipher.final(TEXT_ENCODING);
    return decrypted;
}
