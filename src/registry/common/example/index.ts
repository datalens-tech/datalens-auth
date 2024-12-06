export interface ExampleContructor {
    new (): {};
}

export interface ExampleInstance {}

export const Example: ExampleContructor = class Example implements ExampleInstance {};

export function example() {}
