import chunk from 'lodash/chunk';
import PowerRadix from 'power-radix';

import {ID_VARIABLES} from '../db/constants/id';
import {BigIntId, StringId} from '../db/types/id';

const CODING_BASE = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');

function rotate(array: string[], start: number) {
    return array.slice(start, array.length).concat(array.slice(0, start));
}

export function encodeId(bigIntId: BigIntId): StringId {
    let encodedId = '';

    if (bigIntId) {
        const bigIntIdShortPart = bigIntId.slice(-2);

        const rotationNumber = Number(bigIntIdShortPart) % CODING_BASE.length;
        const rotatedCodingBase = rotate(CODING_BASE, rotationNumber);

        const encodedLongPart = new PowerRadix(bigIntId, 10).toString(rotatedCodingBase);
        const encodedRotationNumber = new PowerRadix(rotationNumber, 10).toString(CODING_BASE);

        encodedId = encodedLongPart + encodedRotationNumber;
    }

    return encodedId as StringId;
}

export function decodeId(stringId: StringId): BigIntId {
    let decodedId = '';

    if (stringId) {
        const encodedRotationNumber = stringId.slice(-1);
        const encodedLongPart = stringId.slice(0, -1);

        const decodedRotationNumber = Number(
            new PowerRadix(
                encodedRotationNumber,
                CODING_BASE as unknown as number[], // @types/power-radix mistake
            ).toString(10),
        );
        const rotatedCodingBase = rotate(CODING_BASE, decodedRotationNumber);

        const decodedLongPart = new PowerRadix(
            encodedLongPart,
            rotatedCodingBase as unknown as number[], // @types/power-radix mistake
        ).toString(10);

        decodedId = decodedLongPart;
    }

    return decodedId as BigIntId;
}

function encodeIds(object: Record<string, string | BigIntId>) {
    for (const idVariable of ID_VARIABLES) {
        if (object && object[idVariable]) {
            const id = object[idVariable];
            object[idVariable] = id && encodeId(id as BigIntId);
        }
    }
    return object as Record<string, string | StringId>;
}

export async function macrotasksMap<T, R extends (item: T) => unknown>(
    arr: T[],
    cb: R,
    chunkSize = 1000,
): Promise<ReturnType<R>[]> {
    const chunks = chunk(arr, chunkSize);
    const results: ReturnType<R>[] = [];
    for (const chunkItem of chunks) {
        const items = (await new Promise((resolve, reject) => {
            function done() {
                try {
                    resolve(chunkItem.map(cb));
                } catch (error) {
                    reject(error);
                }
            }
            if (chunkItem === chunks[0]) {
                done();
            } else {
                setImmediate(done);
            }
        })) as unknown as ReturnType<R>[];
        results.push(...items);
    }
    return results;
}

export async function encodeData<T, R = T>(data: T) {
    let dataFormed: R;

    if (Array.isArray(data)) {
        dataFormed = (await macrotasksMap(data, encodeIds)) as R;
    } else if (data !== null && typeof data === 'object') {
        dataFormed = encodeIds(data as Record<string, string | BigIntId>) as R;
    } else {
        dataFormed = data as unknown as R;
    }

    return dataFormed;
}
