
export type PeerConstructor = {
    ip: string,
    port: string,
};

export type PeerStorage = { peers: Array<PeerConstructor> };

export default class Peers {
    public peers: Array<PeerConstructor>;

    constructor(data: Array<PeerConstructor>) {
        this.peers = data;
    }

    getOne = (): PeerConstructor => {
        return this.peers[0];
    }

    get = (number: number = 1): Array<PeerConstructor> => {
        return this.peers.slice(0, number);
    }

    getAll = () : Array<PeerConstructor> => {
        return this.peers.map(peer => peer);
    }
}
