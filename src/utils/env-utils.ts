import fs from 'node:fs';

export function getEnvVariable(envVariableName: string) {
    const valueFromEnv = process.env[envVariableName];
    if (valueFromEnv) {
        return valueFromEnv;
    }
    const FILE_PATH_POSTFIX = '_FILE_PATH';
    const filePath = process.env[`${envVariableName}${FILE_PATH_POSTFIX}`];
    if (filePath) {
        return fs.readFileSync(filePath, 'utf8').toString();
    }
    return undefined;
}

export function getEnvTokenVariable(envTokenVariableName: string) {
    const TOKEN_SEPARATOR = ',';
    const valueFromEnv = getEnvVariable(envTokenVariableName);

    if (!valueFromEnv) {
        return undefined;
    }

    if (valueFromEnv.includes(TOKEN_SEPARATOR)) {
        return valueFromEnv
            .split(TOKEN_SEPARATOR)
            .map((token) => token && token.trim())
            .filter((token) => token);
    }

    return [valueFromEnv.trim()];
}

const TRUE_FLAGS = ['1', 'true', true];

export function isTrueArg(arg: any): boolean {
    return TRUE_FLAGS.includes(arg);
}

export const getEnvCert = (envCert: string) => envCert.replace(/\\n/g, '\n');
