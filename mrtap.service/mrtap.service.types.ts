export interface MrtapConfigSchema {
    initialIdToken: string,
    cerRand: string,
    cerRandSig: string,
    privateKey: string,
    publicKey: string,
    orgIssuerId: string,
    orgProvider: string
}

export function getDefaultMrtapConfig(): MrtapConfigSchema {
    return {
        initialIdToken: undefined,
        cerRand: undefined,
        cerRandSig: undefined,
        privateKey: undefined,
        publicKey: undefined,
        orgIssuerId: undefined,
        orgProvider: undefined
    };
}

export interface MrtapConfigInterface {
    getMrtap(): MrtapConfigSchema
    setMrtap(data: MrtapConfigSchema): void
    clearMrtap(): void
}
