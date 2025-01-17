import {NextFunction, Request, Response} from '@gravity-ui/expresskit';
import {AppError} from '@gravity-ui/nodekit';

import {AUTH_ERROR} from '../../constants/error-constants';
import {ID_VARIABLES} from '../../db/constants/id';
import type {StringId} from '../../db/types/id';
import {macrotasksMap, decodeId as utilsDecodeId} from '../../utils/ids';

export const decodeId = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        for (const idVariable of ID_VARIABLES) {
            if (req.params && req.params[idVariable]) {
                const encodedId = req.params[idVariable] as StringId;
                req.params[idVariable] = utilsDecodeId(encodedId);
            }

            if (req.query && req.query[idVariable]) {
                const entity = req.query[idVariable] as StringId | StringId[];

                if (Array.isArray(entity)) {
                    req.query[idVariable] = await macrotasksMap(entity, utilsDecodeId);
                } else {
                    const encodedId = entity;
                    req.query[idVariable] = utilsDecodeId(encodedId);
                }
            }

            if (req.body && req.body[idVariable]) {
                const entity = req.body[idVariable] as StringId | StringId[];

                if (Array.isArray(entity)) {
                    req.body[idVariable] = await macrotasksMap(entity, utilsDecodeId);
                } else {
                    const encodedId = req.body[idVariable];
                    req.body[idVariable] = utilsDecodeId(encodedId);
                }
            }
        }
    } catch {
        throw new AppError(
            'Some of the Ids do not have a correct format — an id should be in the lower case and consist of 13 symbols',
            {
                code: AUTH_ERROR.DECODE_ID_FAILED,
            },
        );
    }

    return next();
};
