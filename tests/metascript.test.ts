import * as thredz from "thredz-lib";
console.log(`thz`, thredz)
//const {MetaNode, ThredzContainer} = thredz.thredz
import {Folder} from "../src/folder"
import {Uploader} from "../src/uploader"
import { Wallet } from '../src/wallet'

test('generates a root script', async () => {
    const wallet = Wallet.fromRandom()
    const folder = new Folder()
    folder.user="dave"
    const uploader = new Uploader(wallet, folder)
    const node = new thredz.thredz.ThredzContainer(folder.getuserFolder())
    node.derivedKey = wallet.keyMeta
    expect(node.derivedKey).toBeDefined()
    await node.generateScript()
    expect(node.script).toBeDefined()
    expect(node.script[2].toString()).toBe('NULL')
    expect(node.script[3].toString()).toBe('thredz')
  });

  test('generates a subfolder script', async () => {
    const wallet = Wallet.fromRandom()
    const folder = new Folder()
    folder.user="parent"
    //const uploader = new Uploader(wallet, folder)
    const parent = folder.mkdir()
    parent.derivedKey = wallet.keyMeta
    expect(parent.derivedKey).toBeDefined()
    parent.transactionId = "PARENTTRANSACTIONID" //TODO: should get txid from folder
    const child = folder.mkdir('subfolder')
    child.parent = parent
    expect(child.parent.transactionId).toBe("PARENTTRANSACTIONID")
    await child.generateScript()
    expect(child.script).toBeDefined()
    expect(child.parent.transactionId).toBe("PARENTTRANSACTIONID")
    expect(child.script[2].toString()).toBe('PARENTTRANSACTIONID')
    expect(child.script[3].toString()).toBe('thredz')
    expect(child.script[6].toString()).toBe('subfolder')
  });

  //TODO: a subfolder

  //TODO: a media script