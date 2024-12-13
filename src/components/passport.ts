import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import requestIp from 'request-ip';

import {JwtAuth} from '../components/jwt-auth';
import {USER_AGENT_HEADER} from '../constants/header';
import {LOCAL_IDENTITY_ID} from '../db/constants/id';
import {UserModel, UserModelColumn} from '../db/models/user';
import {getReplica} from '../db/utils/db';
import {escapeStringForLike} from '../db/utils/query';
import type {AuthorizedUser} from '../types/user';

import {comparePasswords} from './passwords';

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

    passport.deserializeUser((user: AuthorizedUser, cb) => {
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
                    const user = await UserModel.query(getReplica())
                        .select([UserModelColumn.UserId, UserModelColumn.Password])
                        .where(UserModelColumn.Login, username)
                        .andWhereLike(
                            UserModelColumn.UserId,
                            `${escapeStringForLike(LOCAL_IDENTITY_ID)}:%`,
                        )
                        .first()
                        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

                    if (!user) {
                        throw new Error('No local user');
                    }

                    if (!user.password) {
                        throw new Error('No password for local user');
                    }

                    const authResult = await comparePasswords({
                        inputPassword: password,
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
                            userId: user.userId,
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
