import { SHA3 } from 'sha3';
import * as ed from 'noble-ed25519';
import * as CryptoJS from 'crypto-js';

import { ILogger } from '../logging/logging.types';
import { MrtapConfigInterface, getDefaultMrtapConfig, MrtapConfigSchema } from './mrtap.service.types';
import { BZECert, DataMessageWrapper, SynMessageWrapper, MrtapMessage, SynMessagePayload, DataMessagePayload } from './mrtap-types';
import { OrgBZCertValidationInfo } from '../http/v2/organization/types/organization-bzcert-validation-info.types';
import Utils from '../utility/utils';

export class MrtapService {
    private config: MrtapConfigInterface;
    private data: MrtapConfigSchema;
    private logger: ILogger;

    private publicKey: Uint8Array;
    private privateKey: Uint8Array;

    constructor(config: MrtapConfigInterface, logger: ILogger) {
        this.config = config;
        this.logger = logger;
    }

    public async init(): Promise<void> {
        // Init function so we can wait on async function calls

        this.data = await this.config.getMrtap();

        // Load our keys if they are there
        await this.loadKeys();
    }

    public mrtapVersion(): string {
        return '1.1';
    }

    public async setInitialIdToken(latestIdToken: string): Promise<void> {
        this.data.initialIdToken = latestIdToken;

        await this.config.setMrtap(this.data);

        this.logger.debug('Updated latestIdToken');
    }

    public async setOrgBZCertValidationInfo(validationInfo: OrgBZCertValidationInfo): Promise<void> {
        this.data.orgIssuerId = validationInfo.orgIdpIssuerId;
        this.data.orgProvider = validationInfo.orgIdpProvider;

        // Update MrTAP config file
        await this.config.setMrtap(this.data);
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
        this.logger.debug('Generated cerRand and cerRandSig');
    }

    public createNonce(): string {
        // Helper function to create a Nonce
        const hashString = ''.concat(this.data.publicKey, this.data.cerRandSig, this.data.cerRand);
        const nonce = this.hashHelper(Buffer.from(hashString, 'utf8')).toString('base64');
        this.logger.debug(`Creating new nonce: ${nonce}`);
        return nonce;
    }

    public async generateMrtapLoginData(): Promise<void> {
        // reset config data
        this.data = getDefaultMrtapConfig();

        // Reset our keys and recreate them
        await this.generateKeys();
        await this.generateCerRand();

        // Update MrTAP config file
        await this.config.setMrtap(this.data);

        this.logger.debug('Reset MrTAP service');
    }

    public getHPointer(message: any): string {
        return this.hashHelper(Utils.JSONstringifyOrder(message)).toString('base64');
    }

    public async validateSignature<T>(message: MrtapMessage<T>, targetPublicKey: ed.Point): Promise<boolean> {
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

    public removeMrtapData(): void {
        this.config.clearMrtap();
    }

    private encodeDataPayload(payload: any) {
        if (typeof payload === 'string') {
            return payload;
        } else if (typeof payload === 'object') {
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
            dataPayload: dataMessage
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
            synPayload: synMessage
        };
    }

    private async signMessagePayload<T>(messagePayload: MrtapMessage<T>): Promise<string> {
        return this.signHelper(Utils.JSONstringifyOrder(messagePayload.payload));
    }

    private hashHelper(toHash: Buffer): Buffer {
        // Helper function to hash a string for us
        const hashClient = new SHA3(256);
        hashClient.update(toHash);
        return hashClient.digest();
    }

    public async signHelper(toSign: Buffer): Promise<string> {
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
            this.logger.debug('Loaded MrTAP keys');
        }
    }

    private async generateKeys(): Promise<void> {
        // Create our keys
        this.privateKey = ed.utils.randomPrivateKey();
        this.publicKey = await ed.getPublicKey(this.privateKey);

        // Update our config
        this.data.privateKey = Buffer.from(this.privateKey).toString('base64');
        this.data.publicKey = Buffer.from(this.publicKey).toString('base64');
        this.logger.debug('Generated MrTAP keys');
    }

    // Helper function for generating random bytes returned as a Buffer
    public randomBytes(size: number): Buffer {
        return Buffer.from(CryptoJS.lib.WordArray.random(size).toString(CryptoJS.enc.Base64), 'base64');
    }
}
