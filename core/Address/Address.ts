import { sha256x2 } from "../tools";

const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

export function addressSign(string: string, privateKey: string): string {
    return ec.sign(string, privateKey, 'hex').toDER('hex');;
}

export function addressVerify(original: string, signed: string, publicKey: string): boolean {
    return ec.verify(original, signed, publicKey, 'hex');
}

/**
 * EC.prototype.keyFromPrivate
 * EC.prototype.keyFromPublic
 */
export default class Address {
    protected public: string;
    protected private?: string;
    protected hashed: string = '';

    constructor(publicKey: string, privateKey?: string) {
        this.public = publicKey;
        this.private = privateKey;
    }

    getPublic = (): string => {
        return this.public;
    }

    getHashed = (): string => {
        if (!this.hashed) {
            this.hashed = sha256x2(this.public);
        }
        return this.hashed;
    }

    sign = (string: string): string => {
        return addressSign(string, this.private || '');
    }

    verify = (original: string, signed: string): boolean => {
        return addressVerify(original, signed, this.public);
    }
}
