import {Request, Response} from '@gravity-ui/expresskit';
import requestIp from 'request-ip';

import {clearAuthCookies, getAuthCookies, setAuthCookie} from '../components/cookies';
import {JwtAuth} from '../components/jwt-auth';
import {USER_AGENT_HEADER} from '../constants/header';
import {signup} from '../services/auth/signup';

export default {
    signup: async (req: Request, res: Response) => {
        const {login, displayName, password} = req.body;

        const tokens = await signup(
            {ctx: req.ctx},
            {
                login,
                displayName,
                password,
                userIp: requestIp.getClientIp(req),
                userAgent: req.headers[USER_AGENT_HEADER],
            },
        );

        setAuthCookie({req, res, tokens});
        res.status(302).redirect('/');
    },

    logout: async (req: Request, res: Response) => {
        const {authCookie} = getAuthCookies(req);

        if (authCookie && authCookie.refreshToken) {
            await JwtAuth.closeSession({ctx: req.ctx}, {refreshToken: authCookie.refreshToken});
        }

        clearAuthCookies(res);
        res.status(302).redirect('/');
    },

    refresh: async (req: Request, res: Response) => {
        const {authCookie} = getAuthCookies(req);

        if (authCookie && authCookie.refreshToken) {
            try {
                const tokens = await JwtAuth.refreshTokens(
                    {ctx: req.ctx},
                    {
                        refreshToken: authCookie.refreshToken,
                        userIp: requestIp.getClientIp(req),
                    },
                );
                setAuthCookie({req, res, tokens});
                res.status(200).send({done: true});
            } catch (err) {
                res.status(401).send("Can't refresh tokens");
            }
        } else {
            res.status(401).send('No refreshToken');
        }
    },
};
