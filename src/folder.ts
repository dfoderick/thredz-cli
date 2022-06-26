import * as fs from "fs"
import * as fsextra from "fs-extra"
import * as path from 'path'
import { MetaNode, ThredzContainer } from "./models/meta";
import { chunkSubstr } from "./utils";

const commitsFileName = '.commits'
const txFileNamePrefix = '.thredz.tx.'

export class Folder {
    user: string = ''
    userRoot = `./users/`
    backupRoot = `./backup/`
    // the curent user path
    currentPath = this.userRoot
    //TODO: rename currentParentNode
    currentNode: MetaNode|null = null
    get cwd() { return process.cwd() }
    getuserFolder() { 
        // console.log(`user folder`,`${this.userRoot}${this.user}`)
        return `${this.userRoot}${this.user}` 
    }
    //todo: recursively find commits
    getcommitFileName() { return `${this.getuserFolder()}/${commitsFileName}` }
    getTransactionFileName(txid:string) { return `${this.currentPath}/${txFileNamePrefix}${txid}` }

    constructor() {
        if (!fs.existsSync(this.userRoot)) fs.mkdirSync(this.userRoot)
    }

    // creates a folder under /users and a root metanet transaction
    // returns false if transaction needs to be made
    createUser(user: string) {
        this.user = user
        this.currentPath = this.getuserFolder()
        if (fs.existsSync(this.currentPath)) {
            console.log(`user ${user} already exists at ${this.currentPath}`)
        } else {
            fs.mkdirSync(this.currentPath)
            console.log(`made ${this.currentPath}`)
        }
        //get transactions in user folder
        const transactions = this.getTransactionsInFolder(this.currentPath, txFileNamePrefix)
        if (!transactions || transactions.length === 0) {
            //TODO: look for root transaction
            return false
        }
        return false //true
    }

    // create a folder and associated metanode
    mkdir(folderName?:string): ThredzContainer {
        const folder = path.join(this.currentPath,folderName||'')
        //const folder = `${}${folderName ? '/'+folderName:''}`
        if (!fs.existsSync(folder)) console.log(`making`, folder)
        if (!fs.existsSync(folder)) fs.mkdirSync(folder)
        this.currentPath = folder
        //find or create node
        const node = new ThredzContainer(folderName||this.user)
        //TODO: write the node
        return node
    }

    ls(fileName?: string, filterFileName?:string) {
        const newPath = path.join(this.currentPath, fileName||'')
        const folderfiles = fs.readdirSync(newPath)
        const subfolders: string[] = []
        folderfiles.forEach(f => {
            const stats = fs.statSync(path.resolve(newPath, f))
            if (stats.isDirectory()) {
                console.log(`/`, f)
                subfolders.push(f)
            } else {
                if (!filterFileName || f.startsWith(filterFileName) )console.log(fileName? `/${fileName}/`:'', f)
            }
        })
        return subfolders
    }

    cd(folderName: string) {
        //this should be the only place where currentPath is set
        this.currentPath = path.join(this.currentPath, folderName)
        this.currentNode = this.findCurrentNode()
        console.log(`current node`,this.currentNode?.transactionId)
    }

    findCurrentNode(): MetaNode|null {
        const txns = this.getTransactionsInFolder(this.currentPath, txFileNamePrefix)
        const ourFolder = path.basename(this.currentPath)
        const ourNode = txns?.find(t => {return t.name === ourFolder})
        return ourNode
    }

    tree(filterFileName?:string) {
        // recursive ls
        const subfolders = this.ls()
        subfolders.forEach(f => {
            this.ls(f, filterFileName)
        })
    }

    backup() {
        fsextra.copySync(this.userRoot, this.backupRoot)
    }

    validate() {
        // validate that .thredz.tx match the directory structure
        console.log(`TODO:`)
    }

    getTransactionsInFolder(folderName: string, startsWith?: string) {
        if (!fs.existsSync(folderName)) {
            try {
                fs.mkdirSync(folderName)
            } catch (err) {
                console.log(`error`, err)
            }
            return null
        }
        const folderfiles = fs.readdirSync(folderName)
        let files = folderfiles.filter( function( elm ) {return !startsWith || elm.startsWith(startsWith)});
        const transactions:any[] = []
        files.forEach(f => {
            const stats = fs.statSync(path.resolve(folderName, f))
            if (!stats.isDirectory()) {
                const contents = this.getfileContents(folderName+'/'+f)
                //TODO: validate that contents are json
                transactions.push(JSON.parse(contents.toString()))
            }
        })
        return transactions
    }

    getfileContents(fileName:string) {
        const actual = path.join(process.cwd(), fileName)
        if (!fs.existsSync(actual)) //return null
            throw new Error(`${actual} does not exist`)
        console.log(`gonna open`, actual)
        const stats = fs.statSync(actual)
        console.log(`stats`, stats)
        const contents = fs.readFileSync(actual)
        return contents
    }

    // gets commits as json object
    getCommits(): any[] | null {
        const contents = this.getfileContents(this.getcommitFileName())
        if (contents[0] == 91) {
            const jcontents = JSON.parse(contents.toString())
            return jcontents
        } else {
            console.error(`unexpected contents`, this.getcommitFileName(), contents[0])
            return null
        }
    }

    // this should be the only way of storing commits
    // returns number of commits pending
    saveCommits(jcommits:any[]|null):number|null {
        if (!jcommits) return null
        // store any commits broadcasted and filter those out
        // mark comes saved using .saved property
        jcommits.forEach((commit:any) => {
            this.storeTransaction(commit)
        })
        // save the rest
        const jnotsaved = jcommits.filter((c:any) => !c.saved)
        //fs.writeJSONSync(this.getcommitFileName(), jnotsaved)
        //fs.writeFileSync(this.getcommitFileName(), JSON.stringify(jnotsaved))
        const writableStream = fs.createWriteStream(this.getcommitFileName())
        writableStream.write(`[\n`)
        // 'Invalid string length' when size too large for v8
        console.log(`commits stringify length`, jnotsaved.length)
        jnotsaved.forEach(e => {
            const snotsaved = JSON.stringify(e, undefined, 2)
            // might not need to chunk the string if each bpart is 10MB?
            chunkSubstr(snotsaved,100000).forEach(c => {
                writableStream.write(c)
            })
            writableStream.write(`,\n`)
        })
        writableStream.write(`]\n`)
        writableStream.end()
        // is close required?
        writableStream.close()
        console.log(`wrote`, this.getcommitFileName(), jnotsaved.length)
        return jnotsaved.length
    }

    //true if transaction was broadcast correctly
    isValidBroadcast(broadcast: any) {
        // taal just returns a txid
        return broadcast.length === 64
        //and only hex numbers
    }

    // store the commit under the transactionid
    storeTransaction(commit:any) {
        if (commit.broadcast && this.isValidBroadcast(commit.broadcast)) {
            //validate broadcast txn and store in file
            // example broadcat: 123d27dc4a5024e87178e0d6e7dee476c114d928a627a27be5ce9840ccf18a72
            fs.writeFileSync(this.getTransactionFileName(commit.broadcast), JSON.stringify(commit))
            commit.saved = commit.broadcast
        }
    }

    dumpFileContents(fileName:string, isCountOnly = false): number {
        const contents = this.getfileContents(fileName)
        if (contents[0] == 91) {
            const jcontents = JSON.parse(contents.toString())
            if (!isCountOnly) this.visualizeCommits(jcontents)
            return jcontents.length
        } else {
            console.log(contents.toString())
            return NaN
        }
    }
    visualizeCommits(jcontents:any[]) {
        console.log(jcontents.map(commit => {
            return {...commit,overPaid:commit.fee - commit.feeExpected}
        }))
    }
    cancel() {
        if (this.isPendingCommit()){
            fs.rmSync(this.getcommitFileName())
            console.log(`commit file has been deleted`)
        }
    }
    //stage a step of a unit of work
    stageWork(node: MetaNode): number|null {
        let jcurrent = []
        if (this.isPendingCommit()){
            const current = this.getfileContents(this.getcommitFileName())
            try {
                jcurrent = JSON.parse(current.toString())
            } catch (err) {
                //rename current to backup
                fsextra.moveSync(this.getcommitFileName(), this.getcommitFileName()+'.backup')
            }
        }
        // commit file will be an array of json MetaNode objects
        const more = node.getUnsavedAndChildren()
        //console.log(`more`, more)
        jcurrent = jcurrent.concat(more)
        return this.saveCommits(jcurrent)
    }
    isPendingCommit() {
        const commits = this.getcommitFileName()
        return fs.existsSync(commits)
    }
    checkCommitsPending(isDetail = false): number {
        const commits = this.getcommitFileName()
        if (fs.existsSync(commits)) {
            const count = this.dumpFileContents(commits, !isDetail)
            if (isNaN(count)) {
                this.cancel()
            }
            console.log(`Run 'commit' to save ${count} changes to metanet`)
            if (!isDetail) console.log(`Run 'status -d' to see detailed changes`)
            return count
        } else {
            console.log(`No pending commits ${commits}`)
            return 0
        }
    }
    //traverse folder structure
    traverse(fileName?: string, filterFileName?:string, visit?: any) {
        const newPath = path.join(this.currentPath, fileName||'')
        const folderfiles = fs.readdirSync(newPath)
        let filesResult: string[] = []
        folderfiles.forEach(f => {
            const fullfile = path.resolve(newPath, f)
            const stats = fs.statSync(fullfile)
            if (stats.isDirectory()) {
                filesResult = [...filesResult,...this.traverse(f, filterFileName, visit)]
            } else {
                if (!filterFileName || f.startsWith(filterFileName)) {
                    filesResult.push(fullfile)
                    if (visit) {
                        visit(f)
                    }
                }
                //console.log(fileName? `/${fileName}/`:'', f)
            }
        })
        return filesResult
    }
}
