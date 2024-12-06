export enum Feature {
    ReadOnlyMode = 'ReadOnlyMode',
    UseIpV6 = 'UseIpV6',
}

export type FeaturesConfig = {
    [key in Feature]?: boolean;
};
