import {Folder} from "../src/folder"
import {Uploader} from "../src/uploader"
import {Wallet} from "../src/wallet"
import * as fs from 'fs-extra'

// test('read file', () => {
//   // absolute file contents works
//   const contents = fs.readFileSync('/home/fullcycle/source/thredz/thredz-cli/users/test/.commits')
//   console.log(`commit contents`, contents)
//   expect(contents).toBeDefined()
// })

test('write bcat', async () => {
  const jwallet = fs.readJSONSync('./.thredz')
  jwallet.user = 'test'
  const wallet = Wallet.load(JSON.stringify(jwallet))
  const folder = new Folder()
  folder.user = wallet.user
  expect(folder.user).toBe('test')
  folder.cd(folder.user)
  folder.cancel()
  const uploader = new Uploader(wallet, folder)
  const result = await uploader.prepare('./media/bunny_full_low.mp4')
  console.log(`UPLOAD RESULT`, result.success, result.result.commits)
  expect(result.result.commits).toBeGreaterThan(3)
  //load commit and get result
  // I have no idea why cannot getCommits here? Why???
  // const folder2 = new Folder()
  // folder2.user = wallet.user
  // const commits = folder2.getCommits()
  // console.log(`TEST COMMITS`, commits)
  // expect(commits?.length).toBeGreaterThan(33)
  console.log(`COMMITS PENDING`,folder.checkCommitsPending())
}, 60000);

