# thredz-cli
The thredz philosophy is simple. You allocate a section of your hard drive to represent your documents and folder structure. You work with your documents, edit them and create links between them. Then you commit your changes to publish them to metanet. You are responsible for all changes you publish using thredz.

The thredz client tool is simple if you know how to use a command line. The current state of the tooling is primitive but will be improved with important visualizers for a more friendly user interface. Until then you are working on bare metal with no safety net. Have fun!

# Do it
Thredz has been tested using node version 18. Older versions above 12 might also work.
```
nvm use 18
```
Clone and Install
```
git clone https://github.com/dfoderick/thredz-cli
cd thredz-cli
yarn install
yarn prepare
```

Run with 
```
npx ts-node --esm thredz
```
this will show you your thredz prompt
```
thredz$\\
```
Run `help` to show a list of commands you can do.  
Give yourself a name with the user command
```
thredz$\\ user dave
```
the prompt will change to your user. you are now logged in
```
thredz$\\dave\
```

`help`
```
thredz$\\dave\ help

  Commands:

    help [command...]  Provides help for a given command.
    exit               Exits application.
    init               Initializes thredz
    wallet             Shows wallet and funding instructions
    user <name>        creates a user folder
    spend <address>    sends payment to address
    commit             writes pending commits to metanet
    cancel             Deletes pending commits
    status [options]   shows pending commits
    upload <filename>  upload a file to metanet
    mkdir <name>       create a directory/folder
```

# example session
Here is an example thredz session that will create some nodes and store them on a blockchain. The `status` command allows you to preview the transaction and fees before attempting to write it to the blockchain using the `commit` command. A pending commit can be `cancel` to undo the pending commit.
```
user dave       // create a user directory
status          // see 1 commit pending
commit          // store the root user folder on blockchain
mkdir media     // create a media subfolder
status          // see 1 commit pending
commit          // store the subfolder
upload ../media/bun33s.mp4  // encrypt the media transaction
status
commit          // store the media to chain
node text hello.txt 'Hello Thredz'   // create a text file in the current directory
ls              // see files in current folder
status
commit
tree            // see all files in current folder and subfolder
```


# Dev notes
When importing use .js
```
import { Wallet } from "./wallet.js";
```

# thredz overview
https://github.com/dfoderick/thredz


# Troubleshooting
If you have errors, first make sure you can run the tests.
```
yarn test
```
```
Error: Cannot find module 'bsv'
```
Solution: reinstall moneystream-wallet. bsv library has to be built.
```
yarn add moneystream-wallet
```

# other
```
  "type": "module",
```