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

export interface ConfigInterface {
    updateMrtap(data: MrtapConfigSchema): void
    loadMrtap(): MrtapConfigSchema
    removeMrtap(): void
}
