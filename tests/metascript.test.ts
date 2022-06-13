import { MetaNode } from "../src/meta";
import {Folder} from "../src/folder"
import {Uploader} from "../src/uploader"
import {Wallet} from "../src/wallet"

test('generates a script', () => {
    const wallet = Wallet.fromRandom()
    const folder = new Folder()
    folder.user="dave"
    const uploader = new Uploader(wallet, folder)
    const node: MetaNode = new MetaNode(folder.getuserFolder())
    const script = uploader.metaScript(null, node)
    // console.log(node)

  });