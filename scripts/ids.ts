/*
    Use:
    ts-node scripts/ids.ts --helper=decode -- r41ri22abtygq r41ri22abtygq
    npm run decode r41ri22abtygq r41ri22abtygq
*/
import util from 'node:util';

import minimist from 'minimist';

import {decodeId, encodeId} from '../api/utils';

util.inspect.defaultOptions.maxArrayLength = null;

const args = minimist(process.argv.slice(2), {
    alias: {
        h: 'helper',
    },
    string: ['_'],
});

const {helper} = args;

switch (helper) {
    case 'decode': {
        const encodedIds = args._;
        const decodedIds = encodedIds.map(decodeId);

        console.log(decodedIds);
        break;
    }
    case 'encode': {
        const encodedIds = args._;
        const decodedIds = encodedIds.map(encodeId);

        console.log(decodedIds);
        break;
    }
    default: {
        console.log('not exist helper');
    }
}
