import settings from '../settings';
const sha256 = require('sha256');

export function rand(min: number, max: number) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function formatAmount(value: number): number {
    return Math.floor(value);
}

export function sha256x2(value: string): string {
    return sha256.x2(value);
}

export function stringToWeight(string: string) {
    let sum = 0;
    for (let i = 0; i <= string.length - 1; i++) {
        if (parseInt(string[i]) >= 0) {
            sum -= parseInt(string[i]);
        } else {
            sum += string.charCodeAt(i);
        }
    }
    return sum;
}

export function calcualteMultiplier(prevBlockWeight: number, scriptWeight: number): number {
    if (prevBlockWeight === scriptWeight) {
        return 4;
    } else if (scriptWeight * 0.75 <= prevBlockWeight && prevBlockWeight <= scriptWeight * 1.25) {
        return 3;
    } else if (scriptWeight * 0.5 <= prevBlockWeight && prevBlockWeight <= scriptWeight * 1.5) {
        return 2;
    }
    return 1;
}

export function json(string: string) {
    if (string.substr(0, 1) === '{' || string.substr(0, 1) === '[') {
        return JSON.parse(string);
    }
    return {};
}

export function numbersEqual(a: number, b: number) {
    return a.toFixed(settings.COIN_DECIMALS) === b.toFixed(settings.COIN_DECIMALS);
}

export function paddBlockHeight(height: number): string {
    return String(height).padStart(10, '0');
}

export function getTimestampString(): string {
    return (new Date()).toISOString();
}

export function getSecondsBetweenDates(start: string, end: string): number {
    return ((new Date(start)).getTime() - (new Date(end)).getTime()) / 1000;
}

export function isNumber(variable: any): boolean {
    return !isNaN(variable);
}
export function nanoTime() {
    const hrTime = process.hrtime();
    return hrTime[0] * 1000000000 + hrTime[1];
}

export function numberToHex(number: number): number {
    return '0x' + (number).toString(16);
}

export function unixTime(): number {
    return new Date().getTime() / 1000;
}

export function getStringBytes(string: string): number {
    return (new TextEncoder().encode(string)).length;
}
