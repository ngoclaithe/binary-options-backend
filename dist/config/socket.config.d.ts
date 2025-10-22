declare const _default: (() => {
    port: number;
    cors: {
        origin: string;
        credentials: boolean;
    };
    transports: string[];
    pingTimeout: number;
    pingInterval: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    port: number;
    cors: {
        origin: string;
        credentials: boolean;
    };
    transports: string[];
    pingTimeout: number;
    pingInterval: number;
}>;
export default _default;
