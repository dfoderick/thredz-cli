import { MetaNode, ThredzContainer } from "../src/models/meta";
import {Folder} from "../src/folder"
import {Uploader} from "../src/uploader"
import {Wallet} from "../src/wallet"

test('generates a root script', () => {
    const wallet = Wallet.fromRandom()
    const folder = new Folder()
    folder.user="dave"
    const uploader = new Uploader(wallet, folder)
    const node: MetaNode = new ThredzContainer(folder.getuserFolder())
    node.derivedKey = wallet.keyMeta
    expect(node.derivedKey).toBeDefined()
    node.generateScript()
    expect(node.script).toBeDefined()
    expect(node.script[2].toString()).toBe('NULL')
    expect(node.script[3].toString()).toBe('thredz')
  });

  test('generates a subfolder script', () => {
    const wallet = Wallet.fromRandom()
    const folder = new Folder()
    folder.user="parent"
    //const uploader = new Uploader(wallet, folder)
    const parent: MetaNode = folder.mkdir()
    parent.derivedKey = wallet.keyMeta
    expect(parent.derivedKey).toBeDefined()
    parent.transactionId = "PARENTTRANSACTIONID" //TODO: should get txid from folder
    const child: MetaNode = folder.mkdir('subfolder')
    child.parent = parent
    expect(child.parent.transactionId).toBe("PARENTTRANSACTIONID")
    child.generateScript()
    expect(child.script).toBeDefined()
    expect(child.parent.transactionId).toBe("PARENTTRANSACTIONID")
    expect(child.script[2].toString()).toBe('PARENTTRANSACTIONID')
    expect(child.script[3].toString()).toBe('thredz')
    expect(child.script[5].toString()).toBe('subfolder')
  });

  //TODO: a subfolder

  //TODO: a media script