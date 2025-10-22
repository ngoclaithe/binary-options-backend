declare const _default: (() => {
    port: number;
    environment: string;
    jwtSecret: string;
    jwtExpiration: string;
    priceApiUrl: string;
    priceApiKey: string;
    minTradeAmount: number;
    maxTradeAmount: number;
    profitPercentage: number;
    priceUpdateInterval: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    port: number;
    environment: string;
    jwtSecret: string;
    jwtExpiration: string;
    priceApiUrl: string;
    priceApiKey: string;
    minTradeAmount: number;
    maxTradeAmount: number;
    profitPercentage: number;
    priceUpdateInterval: string;
}>;
export default _default;
