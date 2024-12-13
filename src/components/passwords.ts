import {Buffer} from 'node:buffer';
import {randomBytes, scrypt, timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';

const scryptAsync = promisify(scrypt);
const randomBytesAsync = promisify(randomBytes);

const KEY_LENGTH = 64;
const ENCODING = 'base64url';
const SEPARATOR = ':';

export async function hashPassword(password: string) {
    const salt = await randomBytesAsync(16);
    const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
    return salt.toString(ENCODING) + SEPARATOR + derivedKey.toString(ENCODING);
}

export async function comparePasswords({
    inputPassword,
    storedPasswordHash,
}: {
    inputPassword: string;
    storedPasswordHash: string;
}) {
    const [salt, key] = storedPasswordHash.split(SEPARATOR);
    const keyBuffer = Buffer.from(key, ENCODING);
    const saltBuffer = Buffer.from(salt, ENCODING);
    const derivedKey = (await scryptAsync(inputPassword, saltBuffer, KEY_LENGTH)) as Buffer;
    return timingSafeEqual(keyBuffer, derivedKey);
}
