# thredz-cli
The thredz philosophy is simple. You allocate a section of your hard drive to represent your documents and folder structure. You work with your documents, edit them and create links between them. Then you commit your changes to publish them to metanet. You are responsible for all changes you publish using thredz.

The thredz client tool is simple if you know how to use a command line. The current state of the tooling is primitive but will be improved with important visualizers for a more friendly user interface. Until then you are working on bare metal with no safety net. Have fun!

# Do it
Clone and Install
```
git clone https://github.com/dfoderick/thredz-cli
cd thredz-cli
npm install
```

Run with 
```
tsc && npx ts-node src/thredz init
tsc && npx ts-node src/thredz fund
tsc && npx ts-node src/thredz user <your user name here>
```
```
tsc && npx ts-node src/thredz help
```

# Dev notes
When importing use .js
```
import { Wallet } from "./wallet.js";
```

# thredz overview
https://github.com/dfoderick/thredz

