import type {AUTHORIZATION_HEADER} from '../../constants/header';

// Copied from @asteasolutions/zod-to-openapi
export type Method = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'trace';

export type ApiHeader = typeof AUTHORIZATION_HEADER;
