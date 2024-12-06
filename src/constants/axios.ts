import http from 'node:http';
import https from 'node:https';

export const IPV6_AXIOS_OPTIONS = {
    httpAgent: new http.Agent({
        //@ts-ignore https://github.com/nodejs/node/blob/master/lib/_http_agent.js#L233
        family: 6,
    }),
    httpsAgent: new https.Agent({
        //@ts-ignore https://github.com/nodejs/node/blob/master/lib/_http_agent.js#L233
        family: 6,
    }),
};
