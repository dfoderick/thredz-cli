import hyperswarm from 'hyperswarm'
//const hyperswarm = require('hyperswarm')
import crypto from 'crypto'
import { Socket } from 'net'
import { logGreen } from './utils'
import EventEmitter from 'events'

export class p2p {
    private emitter = new EventEmitter()
    public topic: Buffer
    public socket?: Socket
    constructor() {
        this.topic = crypto.createHash('sha256')
        .update('thredz')
        .digest()
        const swarm = hyperswarm()
        swarm.join(this.topic, {
            lookup: true, // find & connect to peers
            announce: true // optional- announce self as a connection target
        })

        swarm.on('connection', (socket:any, info:any) => {
            this.socket = socket
            // info is a PeerInfo
            console.log('new connection', info.status)
            socket.on('data', (data:any) => {
                this.emitter.emit('data', data)
                // logGreen('got message:', data.toString())
            })
            // you can now use the socket as a stream, eg:
            // process.stdin.pipe(socket).pipe(process.stdout)
        })

    }

    on(eventName:string, listener:any) {
        this.emitter.addListener(eventName, listener)
    }
}