import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import requestIp from 'request-ip';

import {JwtAuth} from '../components/jwt-auth';
import {USER_AGENT_HEADER} from '../constants/header';
import {UserModel, UserModelColumn} from '../db/models/user';
import {getReplica} from '../db/utils/db';
import type {PlatformAuthorizedUser} from '../types/user';
import {encodeId} from '../utils/ids';

import {comparePasswords} from './passwords';
import {makeParser, z, zc} from './zod';

const parseRequest = makeParser(
    z.strictObject({
        login: zc.login(),
        password: zc.password(),
    }),
);

export const initPassport = () => {
    passport.serializeUser((user, cb) => {
        process.nextTick(() => {
            cb(null, {
                userId: user.userId,
                accessToken: user.accessToken,
                refreshToken: user.refreshToken,
            });
        });
    });

    passport.deserializeUser((user: PlatformAuthorizedUser, cb) => {
        process.nextTick(() => {
            cb(null, user);
        });
    });

    const usernameField = 'login';

    passport.use(
        new LocalStrategy(
            {usernameField, passReqToCallback: true},
            async (req, username, password, done) => {
                try {
                    const parsedRequest = await parseRequest({login: username, password});

                    const user = await UserModel.query(getReplica())
                        .select([UserModelColumn.UserId, UserModelColumn.Password])
                        .where({
                            [UserModelColumn.Login]: parsedRequest.login,
                            [UserModelColumn.ProviderId]: null,
                        })
                        .first()
                        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

                    if (!user) {
                        throw new Error('No local user');
                    }

                    if (!user.password) {
                        throw new Error('No password for local user');
                    }

                    const authResult = await comparePasswords({
                        inputPassword: parsedRequest.password,
                        storedPasswordHash: user.password,
                    });

                    if (authResult) {
                        const {accessToken, refreshToken} = await JwtAuth.startSession(
                            {ctx: req.ctx},
                            {
                                userId: user.userId,
                                userAgent: req.headers[USER_AGENT_HEADER],
                                userIp: requestIp.getClientIp(req),
                            },
                        );
                        done(null, {
                            userId: encodeId(user.userId),
                            accessToken,
                            refreshToken,
                        });
                        return;
                    } else {
                        throw new Error('Incorrect password');
                    }
                } catch (err) {
                    req.ctx.logError('AUTH_ERROR', err);
                    done(null, false);
                    return;
                }
            },
        ),
    );
};
