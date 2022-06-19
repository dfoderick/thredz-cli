import { MetaNode, ContainerNode } from "../src/models/meta";
import {Folder} from "../src/folder"
import {Uploader} from "../src/uploader"
import {Wallet} from "../src/wallet"

test('generates a root script', () => {
    const wallet = Wallet.fromRandom()
    const folder = new Folder()
    folder.user="dave"
    const uploader = new Uploader(wallet, folder)
    const node: MetaNode = new ContainerNode(folder.getuserFolder())
    const script = uploader.metaScript(node)
    console.log(script)
    expect(script).toBeDefined()
    expect(script[2].toString()).toBe('NULL')
    expect(script[3].toString()).toBe('thredz')
  });

  test('generates a subfolder script', () => {
    const wallet = Wallet.fromRandom()
    const folder = new Folder()
    folder.user="parent"
    const uploader = new Uploader(wallet, folder)
    const parent: MetaNode = folder.mkdir()
    parent.transactionId = "PARENTTRANSACTIONID" //TODO: should get txid from folder
    const child: MetaNode = folder.mkdir('subfolder')
    child.parent = parent
    const script = uploader.metaScript(child)
    console.log(script)
    expect(script).toBeDefined()
    expect(script[2].toString()).toBe('PARENTTRANSACTIONID')
    expect(script[3].toString()).toBe('thredz')
    expect(script[5].toString()).toBe('subfolder')
  });

  //TODO: a subfolder

  //TODO: a media script