import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

export const waitDatabase = async (req: Request, _res: Response, next: NextFunction) => {
    const {db} = req.ctx.get('registry').getDbInstance();
    await db.ready();
    next();
};
