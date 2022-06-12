// import OpenSPV from 'openspv'
// console.log(OpenSPV.PrivKey)
import { Wallet } from "./src/wallet.js";
import { Uploader } from './src/uploader.js';
import { Folder } from './src/folder.js';
import hyperswarm from 'hyperswarm';
//const hyperswarm = require('hyperswarm')
import crypto from 'crypto';
import Vorpal from "@moleculer/vorpal";
import { wrapTryCatch } from "./src/utils.js";
export const vorpal = new Vorpal();
const arg1 = process.argv[1];
const arg2 = process.argv[2];
let arg3;
let wallet = new Wallet();
wallet = wallet.load();
const folder = new Folder();
folder.user = wallet.user;
const uploader = new Uploader(wallet, folder);
console.log(`Current Directory ${folder.cwd}`);
console.log(`Current User ${wallet.user}[${wallet.AddressMeta}] at ${folder.getuserFolder()}`);
const nameForDomain = `User Folder`;
//swarm
const topic = crypto.createHash('sha256')
    .update('thredz')
    .digest();
const swarm = hyperswarm();
swarm.join(topic, {
    lookup: true,
    announce: true // optional- announce self as a connection target
});
let swarmSocket;
swarm.on('connection', (socket, info) => {
    swarmSocket = socket;
    // info is a PeerInfo
    console.log('new connection', info.status);
    socket.on('data', (data) => console.log('client got message:', data.toString()));
    // you can now use the socket as a stream, eg:
    // process.stdin.pipe(socket).pipe(process.stdout)
});
vorpal
    .command('send <message>', 'send a message')
    .action(wrapTryCatch(async ({ message }) => {
    swarmSocket === null || swarmSocket === void 0 ? void 0 : swarmSocket.write(message);
}));
vorpal
    .command('init', 'Initializes thredz')
    .action(async () => {
    if (wallet === null || wallet === void 0 ? void 0 : wallet.keyMeta)
        vorpal.log(`thredz ready`);
    else
        vorpal.log(`There was a problem initializing thredz key ${wallet.keyMeta}`);
    if (wallet === null || wallet === void 0 ? void 0 : wallet.user)
        console.log(`thredz user ${wallet === null || wallet === void 0 ? void 0 : wallet.user}`);
    else
        vorpal.log(`run 'thredz user <username>' to setup user`);
});
vorpal
    .command('wallet', 'Shows wallet and funding instructions')
    .action(async () => {
    vorpal.log(`Fund wallet address`, wallet.AddressFunding.toString());
    // wallet.Address is the HD address
    // use a derivation key for the funding address
    vorpal.log(`[old fund wallet address`, wallet.AddressLegacy, ']');
    const balance = await wallet.getBalance(wallet.AddressLegacy);
    vorpal.log(`Wallet balance`, balance);
});
vorpal
    .command('user <name>', 'creates a user folder')
    .action(wrapTryCatch(async ({ name }) => {
    folder.createUser(name);
    wallet.user = name;
    wallet.writeWallet();
    folder.checkCommitsPending();
}));
vorpal
    .command('spend <address>', 'sends payment to address')
    .action(wrapTryCatch(async ({ address }) => {
    //const currentbalance = await wallet.getBalance()
    //console.log(`Wallet balance`, currentbalance)
    await uploader.testSpend(address);
}));
vorpal
    .command('commit', 'writes pending commits to metanet')
    .action(async () => {
    if (folder.isPendingCommit()) {
        const result = await uploader.commit();
        console.log(`published ${result === null || result === void 0 ? void 0 : result.length} commits`);
        folder.checkCommitsPending();
    }
    else
        console.log(`No pending commits`);
});
vorpal
    .command('cancel', 'Deletes pending commits')
    .action(async () => {
    if (folder.isPendingCommit()) {
        folder.cancel();
        folder.checkCommitsPending();
    }
    else
        console.log(`No pending commits`);
});
vorpal
    .command('status', 'shows pending commits')
    .option("-d, --details", "detail output")
    .action(wrapTryCatch(async ({ options }) => {
    //console.log(`details`, options.details)
    folder.checkCommitsPending(options.details ? true : false);
}));
vorpal
    .command('upload <filename>', 'upload a file to metanet')
    .action(wrapTryCatch(async ({ filename }) => {
    const result = await uploader.prepare(filename);
    console.log(`UPLOAD RESULT`, result.success);
    if (result.success)
        folder.checkCommitsPending();
}));
vorpal
    .command('mkdir <name>', 'create a directory/folder')
    .action(wrapTryCatch(async ({ name }) => {
    console.log(`TODO create directory ${name}`);
}));
vorpal
    .delimiter(`thredz$\\\\${wallet.user}\\`)
    .show();
