import hyperswarm from 'hyperswarm'
import crypto from 'crypto'
import { Socket } from "net";

test('generates a script', () => {
  const swarm = hyperswarm()
  const topic = crypto.createHash('sha256')
  .update('thredz')
  .digest()
  swarm.join(topic, {
      lookup: true, // find & connect to peers
      announce: true // optional- announce self as a connection target
  })
  
  let swarmSocket:Socket
  swarm.on('connection', (socket:any, info:any) => {
      swarmSocket = socket
      // info is a PeerInfo
      console.log('new connection', info.status)
      socket.on('data', (data:any) => console.log('client got message:', data.toString()))
  })
  
});