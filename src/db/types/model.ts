import type {Model} from 'objection';

export type ModelInstance<T> = InstanceType<typeof Model> & T;
