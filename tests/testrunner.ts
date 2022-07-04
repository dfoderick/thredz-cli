// run with ` npx ts-node tests/testrunner.ts`

import * as thredz from "thredz-lib";
console.log(`thz`, thredz)
const {MetaNode, ThredzContainer} = thredz.thredz
console.log(`thz`, MetaNode, ThredzContainer)

import {Folder} from "../src/folder"
import {Uploader} from "../src/uploader"
import {Wallet} from "../src/wallet"
import * as fs from 'fs-extra'

; ( async () => {
    const jwallet = fs.readJSONSync('./.thredz')
    jwallet.user = 'test'
    const wallet = Wallet.load(JSON.stringify(jwallet))
    const folder = new Folder()
    folder.user = wallet.user
    folder.cd(folder.user)
    folder.cancel()
    const uploader = new Uploader(wallet, folder)
    const result = await uploader.prepare('./media/bunny_full_low.mp4')
    console.log(`UPLOAD RESULT`, result.success, result.result.commits)
    result.result.node.logDetails()
})()
