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
    trace(msg: string): void
    debug(msg: string): void
    info(msg: string): void
    warn(msg: string): void
    error(msg: string): void
}