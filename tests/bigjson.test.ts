import {Folder} from "../src/folder"
import {Uploader} from "../src/uploader"
import {Wallet} from "../src/wallet"

test('write big json', async () => {
  const wallet = Wallet.load(`
    {
      "keymeta":"xprv9s21ZrQH143K4aghKiKmqbBtbn1pgdgy4ZdKrwv4zGd4W41HzotWduzEyqN6HD7HjQpbjG9DjQzGprdxQCQmSwvmJQRUqCmEurPorvVVB3k","keyfunding":"xprv9s21ZrQH143K2GwnA1GB9CHuEST5bdc9dLMoj9PYNQAN6Apoid96xn4g64yryjUQ439GwAdCbvtvtRBEcwoGwYDr5NphGGFdiWraTcSHqfh",
      "user":"test"
    }`)
    const folder = new Folder()
    folder.user = wallet.user
    const uploader = new Uploader(wallet, folder)
  //const result = await uploader.prepare('./media/bunny_full_low.mp4')
  const result = await uploader.prepare('./media/blank.mp4')
  console.log(`UPLOAD RESULT`, result.success)
}, 30000);

