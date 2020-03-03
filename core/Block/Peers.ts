
export type PeerConstructor = {
    ip: string,
    port: string,
};

export type PeerStorage = {peers : Array<PeerConstructor>};

export default class Peers {
    public peers: Array<PeerConstructor>;

    constructor(data: Array<PeerConstructor>) {
        this.peers = data;
    }
}
