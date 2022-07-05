import * as thredz from 'thredz-lib'
import {Folder} from "../src/folder"
import {Uploader} from "../src/uploader"
import { Wallet } from '../src/wallet'
import * as fs from 'fs-extra'

// file contents should fit into one content transaction
test('write big json', async () => {
  const jwallet = fs.readJSONSync('./.thredz')
  jwallet.name = 'test'
  const wallet = Wallet.load(/*undefined, */JSON.stringify(jwallet))
  const folder = new Folder()
  folder.user = wallet.user
  const uploader = new Uploader(wallet, folder)
  //const result = await uploader.prepare('./media/bunny_full_low.mp4')
  const result = await uploader.prepare('./media/blank.mp4')
  console.log(`UPLOAD RESULT`, result.success)
  expect(result.result.commits).toBeGreaterThan(1)
}, 30000);

