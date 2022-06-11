# thredz-cli
The thredz philosophy is simple. You allocate a section of your hard drive to represent your documents and folder structure. You work with your documents, edit them and create links between them. Then you commit your changes to publish them to metanet. You are responsible for all changes you publish using thredz.

The thredz client tool is simple if you know how to use a command line. The current state of the tooling is primitive but will be improved with important visualizers for a more friendly user interface. Until then you are working on bare metal with no safety net. Have fun!

# Do it
Use node version 16 or above
```
nvm use 16
```
Clone and Install
```
git clone https://github.com/dfoderick/thredz-cli
cd thredz-cli
npm install
```

Run with 
```
npx ts-node thredz
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

# Dev notes
When importing use .js
```
import { Wallet } from "./wallet.js";
```

# thredz overview
https://github.com/dfoderick/thredz

