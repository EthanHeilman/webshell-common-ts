import { SHA3 } from 'sha3';
import * as ed from 'noble-ed25519';
const crypto = require('crypto');

import { ILogger } from '../logging/logging.types';
import { ConfigInterface, KeySplittingConfigSchema } from './keysplitting.service.types';
import { BZECert, DataMessageWrapper, SynMessageWrapper, KeySplittingMessage, SynMessagePayload, DataMessagePayload } from './keysplitting-types';

export class KeySplittingService {
    private config: ConfigInterface
    private data: KeySplittingConfigSchema
    private logger: ILogger;
    private publicKey: Uint8Array;
    private privateKey: Uint8Array;
    private expectedHPointer: Buffer;
    private currentHPointer: Buffer;
    private targetPublicKey: ed.Point;

    constructor(config: ConfigInterface, logger: ILogger) {
        this.config = config;
        this.logger = logger;
        this.data = this.config.loadKeySplitting();

        // Initially our expected HPointer is null
        this.expectedHPointer = null;
        this.currentHPointer = null;
    }

    public async init(): Promise<void> {
        // Init function so we can wait on async function calls
        // Load our keys if they are there
        await this.loadKeys();
    }

    public setInitialIdToken(latestIdToken: string): void {
        this.data.initialIdToken = latestIdToken;
        this.config.updateKeySplitting(this.data);
        this.logger.debug('Updated latestIdToken');
    }

    public getConfig(): KeySplittingConfigSchema {
        return this.data;
    }

    public async getBZECert(currentIdToken: string): Promise<BZECert> {
        if (this.data.initialIdToken == undefined || this.data.publicKey == undefined || this.data.cerRand == undefined || this.data.cerRandSig == undefined)
            throw new Error('Undefined values in BZECert! Ensure you are logged in (zli login --Google/Microsoft).');
        return {
            initialIdToken: this.data.initialIdToken,
            currentIdToken: currentIdToken,
            clientPublicKey: this.data.publicKey,
            rand: this.data.cerRand,
            signatureOnRand: this.data.cerRandSig
        };
    }

    public async getBZECertHash(currentIdToken: string): Promise<string> {
        let BZECert = await this.getBZECert(currentIdToken);
        return this.hashHelper(this.JSONstringifyOrder(BZECert)).toString('base64');
    }

    public async generateCerRand(): Promise<void> {
        // Helper function to generate and store our cerRand and cerRandSig
        var cerRand = crypto.randomBytes(32);
        this.data.cerRand = cerRand.toString('base64');

        var cerRandSig = await this.signHelper(cerRand);
        this.data.cerRandSig = cerRandSig;

        // Update our config
        this.config.updateKeySplitting(this.data);
        this.logger.debug('Generated cerRand and cerRandSig');
    }

    public createNonce(): string {
        // Helper function to create a Nonce
        let hashString = ''.concat(this.data.publicKey, this.data.cerRandSig, this.data.cerRand);
        let nonce = this.hashHelper(hashString).toString('base64');
        this.logger.debug(`Creating new nonce: ${nonce}`);
        return nonce;
    }

    public async generateKeysplittingLoginData(): Promise<void> {
        // Reset our keys and recreate them
        this.generateKeys();
        this.generateCerRand();
        this.logger.debug('Reset keysplitting service');
    }

    public setExpectedHPointer(message: any): void {
        // Helper function to set our expected HPointer
        this.expectedHPointer = this.hashHelper(this.JSONstringifyOrder(message));
    }

    public setCurrentHPointer(message: any): void {
        // Helper function to set our current HPointer
        this.currentHPointer = this.hashHelper(this.JSONstringifyOrder(message));
    }

    public validateHPointer(hPointer: string): boolean {
        if (this.expectedHPointer != null)
            if (this.expectedHPointer.toString('base64') == hPointer) {
                // Return True
                return true;
            } else {
                // Else they don't equal each other, return False
                return false;
            }
        throw Error('Expected HPointer is not set!');
    }

    public setTargetPublicKey(targetPublicKey: string): void {
        this.targetPublicKey = ed.Point.fromHex(Buffer.from(targetPublicKey, 'base64').toString('hex'));
    }

    public async validateSignature<T>(message: KeySplittingMessage<T>): Promise<boolean> {
        if (this.targetPublicKey == undefined) {
            throw new Error('Error validating message! Target Public Key is undefined!');
        }

        // Validate the signature
        let toValidate: Buffer = this.hashHelper(this.JSONstringifyOrder(message.payload));
        let signature: Buffer = Buffer.from(message.signature, 'base64');
        if (await ed.verify(signature, toValidate, this.targetPublicKey)) {
            return true;
        }
        return false;
    }

    private JSONstringifyOrder(obj: any): string {
        // Ref: https://stackoverflow.com/a/53593328/9186330
        let allKeys: string[] = [];
        JSON.stringify(obj, function (key, value) { allKeys.push(key); return value; });
        allKeys.sort();
        return JSON.stringify( obj, allKeys);
    }

    public async buildDataMessage<TDataPayload>(targetId: string, action: string, currentIdToken: string, payload: TDataPayload): Promise<DataMessageWrapper> {
        // Build our payload
        let dataMessage = {
            payload: {
                type: 'DATA',
                action: action,
                hPointer: this.currentHPointer.toString('base64'),
                targetId: targetId,
                BZECert: await this.getBZECertHash(currentIdToken),
                payload: this.JSONstringifyOrder(payload)
            },
            signature: ''
        };

        // Then calculate our signature
        let signature = await this.signMessagePayload<DataMessagePayload>(dataMessage);

        // Then build and return our wrapped object
        dataMessage.signature = signature;
        return {
            dataPayload : dataMessage
        };
    }

    public async buildSynMessage(targetId: string, action: string, currentIdToken: string): Promise<SynMessageWrapper> {
        // Build our payload
        let synMessage = {
            payload: {
                type: 'SYN',
                action: action,
                nonce: crypto.randomBytes(32).toString('base64'),
                targetId: targetId,
                BZECert: await this.getBZECert(currentIdToken)
            },
            signature: ''
        };

        // Then calculate our signature
        let signature = await this.signMessagePayload<SynMessagePayload>(synMessage);

        // Then build and return our wrapped object
        synMessage.signature = signature;
        return {
            synPayload : synMessage
        };
    }

    private async signMessagePayload<T>(messagePayload: KeySplittingMessage<T>): Promise<string> {
        return this.signHelper(this.JSONstringifyOrder(messagePayload.payload));
    }

    private hashHelper(toHash: string): Buffer {
        // Helper function to hash a string for us
        const hashClient = new SHA3(256);
        hashClient.update(toHash);
        return hashClient.digest();
    }

    private async signHelper(toSign: string): Promise<string> {
        // Helper function to sign a string for us
        let hashedSign = this.hashHelper(toSign);
        return Buffer.from(await ed.sign(hashedSign, this.privateKey)).toString('base64');
    }

    private async loadKeys(): Promise<void> {
        // Helper function to check if keys are undefined and load them in
        if (this.data.privateKey != undefined) {
            // We need to load in our keys
            this.privateKey = Buffer.from(this.data.privateKey, 'base64');
            this.publicKey = await ed.getPublicKey(this.privateKey);

            // Validate the public key
            if (Buffer.from(this.publicKey).toString('base64') != this.data.publicKey) {
                throw new Error('Error loading keys, please check your key configuration');
            }
            this.logger.debug('Loaded keysplitting keys');
        }
    }

    private async generateKeys(): Promise<void> {
        // Create our keys
        this.privateKey = ed.utils.randomPrivateKey();
        this.publicKey = await ed.getPublicKey(this.privateKey);

        // Update our config
        this.data.privateKey = Buffer.from(this.privateKey).toString('base64');
        this.data.publicKey = Buffer.from(this.publicKey).toString('base64');
        this.config.updateKeySplitting(this.data);
        this.logger.debug('Generated keysplitting keys');
    }
}