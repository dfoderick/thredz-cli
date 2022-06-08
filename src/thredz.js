import { Wallet } from "./wallet.js";
import { Uploader } from './uploader.js';
import { Folder } from './folder.js';
(async () => {
    const arg1 = process.argv[1];
    const arg2 = process.argv[2];
    let arg3;
    let wallet = new Wallet();
    wallet = wallet.load();
    const folder = new Folder();
    folder.user = wallet.user;
    const uploader = new Uploader(wallet, folder);
    console.log(`Current Directory ${folder.cwd}`);
    console.log(`Current User ${wallet.user} at ${folder.getuserFolder()}`);
    const nameForDomain = `User Folder`;
    switch (arg2) {
        case 'init':
            if (wallet === null || wallet === void 0 ? void 0 : wallet.key)
                console.log(`thredz ready`);
            else
                console.log(`There was a problem initializing thredz key ${wallet.key}`);
            if (wallet === null || wallet === void 0 ? void 0 : wallet.user)
                console.log(`thredz user ${wallet === null || wallet === void 0 ? void 0 : wallet.user}`);
            else
                console.log(`run 'thredz user <username>' to setup user`);
            break;
        case 'fund':
            console.log(`Fund wallet address`, wallet.Address);
            const balance = await wallet.getBalance();
            console.log(`Wallet balance`, balance);
            break;
        case 'user':
            arg3 = process.argv[3];
            folder.createUser(arg3);
            wallet.user = arg3;
            wallet.writeWallet();
            folder.checkCommitsPending();
            break;
        case 'mkdir':
            arg3 = process.argv[3];
            console.log(`TODO create directory ${arg3}`);
            break;
        case 'upload':
            arg3 = process.argv[3];
            const result = uploader.prepare(arg3);
            console.log(`UPLOAD RESULT`, result);
            folder.checkCommitsPending();
            break;
        case 'status':
            folder.checkCommitsPending();
            break;
        case 'commit':
            if (folder.isPendingCommit()) {
                console.log(`TODO commit changes`);
            }
            else
                console.log(`No pending commits`);
            break;
        case 'help':
            console.log(`
        thredz init (initialize system)
        thredz user <user> (create user)
        TODO thredz mkdir <dir> (create folder)
        TODO thredz upload (upload a file)
        thredz status (show pending edits)
        TODO thredz commit (save changes to metanet)
        thredz help (show help)`);
            break;
        case undefined:
            console.log(`missing argument`, arg1);
        default:
            console.log(`UNKNOWN COMMAND`, arg2);
    }
})();
