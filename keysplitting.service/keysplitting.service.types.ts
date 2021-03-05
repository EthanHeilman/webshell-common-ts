export interface KeySplittingConfigSchema {
    initialIdToken: string,
    cerRand: string, 
    cerRandSig: string,
    privateKey: string,
    publicKey: string
}

export interface ConfigInterface {
    updateKeySplitting(data: KeySplittingConfigSchema): void
    loadKeySplitting(): KeySplittingConfigSchema
}

export interface ILogger {
    info(msg: string): void
    debug(msg: string): void
}