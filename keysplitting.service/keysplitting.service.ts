import { SHA3 } from 'sha3';
import * as ed from 'noble-ed25519';
import * as CryptoJS from 'crypto-js';

import { ILogger } from '../logging/logging.types';
import { ConfigInterface, KeySplittingConfigSchema } from './keysplitting.service.types';
import { BZECert, DataMessageWrapper, SynMessageWrapper, KeySplittingMessage, SynMessagePayload, DataMessagePayload } from './keysplitting-types';
import Utils from 'webshell-common-ts/utility/utils';

export class KeySplittingService {
    private config: ConfigInterface
    private data: KeySplittingConfigSchema
    private logger: ILogger;

    private publicKey: Uint8Array;
    private privateKey: Uint8Array;

    constructor(config: ConfigInterface, logger: ILogger) {
        this.config = config;
        this.logger = logger;
        this.data = this.config.loadKeySplitting();
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
        const BZECert = await this.getBZECert(currentIdToken);
        return this.hashHelper(Utils.JSONstringifyOrder(BZECert)).toString('base64');
    }

    public async generateCerRand(): Promise<void> {
        // Helper function to generate and store our cerRand and cerRandSig
        const cerRand = this.randomBytes(32);
        this.data.cerRand = cerRand.toString('base64');
        const cerRandSig = await this.signHelper(cerRand);
        this.data.cerRandSig = cerRandSig;

        // Update our config
        this.config.updateKeySplitting(this.data);
        this.logger.debug('Generated cerRand and cerRandSig');
    }

    public createNonce(): string {
        // Helper function to create a Nonce
        const hashString = ''.concat(this.data.publicKey, this.data.cerRandSig, this.data.cerRand);
        const nonce = this.hashHelper(Buffer.from(hashString, 'utf8')).toString('base64');
        this.logger.debug(`Creating new nonce: ${nonce}`);
        return nonce;
    }

    public async generateKeysplittingLoginData(): Promise<void> {
        // Reset our keys and recreate them
        await this.generateKeys();
        await this.generateCerRand();
        this.logger.debug('Reset keysplitting service');
    }

    public getHPointer(message: any): string {
        return this.hashHelper(Utils.JSONstringifyOrder(message)).toString('base64');
    }

    public async validateSignature<T>(message: KeySplittingMessage<T>, targetPublicKey: ed.Point): Promise<boolean> {
        if (targetPublicKey == undefined) {
            throw new Error('Error validating message! Target Public Key is undefined!');
        }

        // Validate the signature
        const toValidate: Buffer = this.hashHelper(Utils.JSONstringifyOrder(message.payload));
        const signature: Buffer = Buffer.from(message.signature, 'base64');
        if (await ed.verify(signature, toValidate, targetPublicKey)) {
            return true;
        }
        return false;
    }

    public removeKeysplittingData(): void {
        this.config.removeKeySplitting();
    }

    private encodeDataPayload(payload: any) {
        if(typeof payload === 'string') {
            return payload;
        } else if(typeof payload === 'object') {
            return Utils.JSONstringifyOrder(payload).toString('utf8');
        } else {
            throw new Error(`Unhandled payload type ${typeof payload}`);
        }
    }

    public async buildDataMessage<TDataPayload>(targetId: string, action: string, currentIdToken: string, payload: TDataPayload, hPointer: string): Promise<DataMessageWrapper> {
        // Build our payload
        const dataMessage = {
            payload: {
                type: 'DATA',
                action: action,
                hPointer: hPointer,
                targetId: targetId,
                BZECert: await this.getBZECertHash(currentIdToken),
                payload: this.encodeDataPayload(payload)
            },
            signature: ''
        };

        // Then calculate our signature
        const signature = await this.signMessagePayload<DataMessagePayload>(dataMessage);

        // Then build and return our wrapped object
        dataMessage.signature = signature;
        return {
            dataPayload : dataMessage
        };
    }

    public async buildSynMessage(targetId: string, action: string, currentIdToken: string): Promise<SynMessageWrapper> {
        // Build our payload
        const synMessage = {
            payload: {
                type: 'SYN',
                action: action,
                nonce: this.randomBytes(32).toString('base64'),
                targetId: targetId,
                BZECert: await this.getBZECert(currentIdToken)
            },
            signature: ''
        };

        // Then calculate our signature
        const signature = await this.signMessagePayload<SynMessagePayload>(synMessage);

        // Then build and return our wrapped object
        synMessage.signature = signature;
        return {
            synPayload : synMessage
        };
    }

    private async signMessagePayload<T>(messagePayload: KeySplittingMessage<T>): Promise<string> {
        return this.signHelper(Utils.JSONstringifyOrder(messagePayload.payload));
    }

    private hashHelper(toHash: Buffer): Buffer {
        // Helper function to hash a string for us
        const hashClient = new SHA3(256);
        hashClient.update(toHash);
        return hashClient.digest();
    }

    private async signHelper(toSign: Buffer): Promise<string> {
        // Helper function to sign a string for us
        const hashedSign = this.hashHelper(toSign);
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

    // Helper function for generating random bytes returned as a Buffer
    private randomBytes(size: number): Buffer {
        return Buffer.from(CryptoJS.lib.WordArray.random(size).toString(CryptoJS.enc.Base64), 'base64');
    }
}
