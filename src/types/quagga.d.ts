declare module 'quagga' {
    interface QuaggaConfig {
        inputStream: {
            name: string;
            type: string;
            target: HTMLElement;
            constraints: {
                width: number;
                height: number;
                facingMode: string;
            };
        };
        decoder: {
            readers: string[];
        };
    }

    interface QuaggaResult {
        codeResult: {
            code: string;
            format: string;
        };
    }

    interface Quagga {
        init(config: QuaggaConfig, callback: (err?: any) => void): void;
        start(): void;
        stop(): void;
        onDetected(callback: (result: QuaggaResult) => void): void;
        onProcessed(callback: (result: any) => void): void;
    }

    const Quagga: Quagga;
    export default Quagga;
}
