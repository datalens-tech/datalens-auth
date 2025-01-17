import type {Brand} from 'utility-types';

/**
 * DataBase id like 1863898161001530427
 * */
export type BigIntId = Brand<string, 'BIGINT_ID'>;

/**
 * Encoded DataBase id like '5wjfix26nmlar'
 * */
export type StringId = Brand<string, 'SHORT_STRING_ID'>;
