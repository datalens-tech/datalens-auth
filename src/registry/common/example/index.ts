export interface ExampleConstructor {
    new (): {};
}

export interface ExampleInstance {}

export const Example: ExampleConstructor = class Example implements ExampleInstance {};
