import { SHA3 } from 'sha3';
import * as secp from "noble-secp256k1";
const crypto = require('crypto');
const atob = require('atob');

import { ConfigInterface, KeySplittingConfigSchema } from "./keysplitting.service.types";
import { BZECert } from './keysplitting-types';


export class KeySplittingBase {
    public config: ConfigInterface
    public data: KeySplittingConfigSchema
    private publicKey: Uint8Array;
    private privateKey: Uint8Array;

    constructor(config: ConfigInterface) {
        this.config = config;
        this.data = this.config.loadKeySplitting();
    }

    public async init() {
        // Generate our keys and load them in
        this.generateKeys();

        // Generate our cerRan and cerRanSig 
        await this.generateCerRand();
    }

    public updateId(idToken: string) {
        this.data.initialIdToken = idToken;
        this.config.updateKeySplitting(this.data);
    }

    public updateLatestId(latestIdToken: string) {
        this.data.initialIdToken = latestIdToken;
        this.config.updateKeySplitting(this.data);
    }

    public getConfig() {
        return this.data;
    }

    public createNonce() {
        // Helper function to create a Nonce 
        const hashClient = new SHA3(512);
        const hashString = "".concat(this.data.publicKey, this.data.cerRandSig, this.data.cerRand.toString());

        // Update and return
        hashClient.update(hashString);
        return hashClient.digest('hex');
    }

    public async getBZECert(currentIdToken: string): Promise<BZECert> {
        return {
            InitialIdToken: this.data.initialIdToken,
            CurrentIdToken: currentIdToken,
            ClientPublicKey: this.data.publicKey,
            Rand: this.data.cerRand,
            SignatureOnRand: this.data.cerRandSig
        }
    }

    public async getBZECertHash(currentIdToken: string): Promise<string> {
        let BZECert = this.getBZECert(currentIdToken);
        const hashClient = new SHA3(512);
        hashClient.update(BZECert.toString());
        return hashClient.digest('hex');
    }
    
    public async generateCerRand() {
        // Helper function to generate and store our cerRand and cerRandSig
        var cerRand = crypto.randomBytes(32)
        this.data.cerRand = cerRand.toString('hex');;

        var cerRandSig = await secp.sign(cerRand, this.privateKey);
        this.data.cerRandSig = Buffer.from(cerRandSig).toString('base64');

        // Update our config
        this.config.updateKeySplitting(this.data);
    }

    private base64ToArrayBuffer(base64: string) {
        var binary_string = atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return new Uint8Array(bytes.buffer);
    }

    public generateKeys() {
        // Helper function to check if keys are undefined and, generate new ones
        if (this.data.privateKey == undefined) {
            // We need to create and store new keys for the user
            // Create our keys
            this.privateKey = secp.utils.randomPrivateKey();
            this.publicKey = secp.getPublicKey(this.privateKey);

            // Store our keys
            this.data.privateKey = Buffer.from(this.privateKey).toString('base64');
            this.data.publicKey = Buffer.from(this.publicKey).toString('base64');
            this.config.updateKeySplitting(this.data);
        } else {
            // We need to load in our keys
            this.privateKey = this.base64ToArrayBuffer(this.data.privateKey);
            this.publicKey = secp.getPublicKey(this.privateKey);

            // Validate the public key
            if (Buffer.from(this.publicKey).toString('base64') != this.data.publicKey) {
                throw new Error('Error loading keys, please check your key configuration');
            }
        }
    }
}