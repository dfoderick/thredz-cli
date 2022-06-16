import * as fs from "fs-extra";
import * as path from 'path'
import { MetaNode } from "./models/meta";

const commitsFileName = '.commits'
const txFileNamePrefix = '.thredz.tx.'

export class Folder {
    user: string = ''
    userRoot = `./users/`
    // the curent user path
    currentPath = this.userRoot
    currentNode?: MetaNode
    get cwd() { return process.cwd() }
    getuserFolder() { return `${this.userRoot}${this.user}` }
    //todo: recursively find commits
    getcommitFileName() { return `${this.currentPath}/${commitsFileName}` }
    getTransactionFileName(txid:string) { return `${this.currentPath}/${txFileNamePrefix}${txid}` }
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
    mkdir(folderName?:string): MetaNode {
        const folder = path.join(this.currentPath,folderName||'')
        //const folder = `${}${folderName ? '/'+folderName:''}`
        if (!fs.existsSync(folder)) console.log(`making`, folder)
        if (!fs.existsSync(folder)) fs.mkdirSync(folder)
        //find or create node
        const node = new MetaNode(folderName||this.user)
        return node
    }

    ls(fileName?: string) {
        const newPath = path.join(this.currentPath, fileName||'')
        const folderfiles = fs.readdirSync(newPath)
        const subfolders: string[] = []
        folderfiles.forEach(f => {
            const stats = fs.statSync(path.resolve(newPath, f))
            //console.log(`stats`, stats)
            if (stats.isDirectory()) {
                console.log(`/`, f)
                subfolders.push(f)
            } else {
                console.log(fileName? `/${fileName}/`:'', f)
            }
        })
        return subfolders
    }

    cd(folderName: string) {
        //this should be the only place where currentPath is set
        this.currentPath = path.join(this.currentPath, folderName)
        this.currentNode = this.findCurrentNode()
        console.log(`CD current`,this.currentPath)
    }

    findCurrentNode(): MetaNode|undefined {
        //console.log(`TODO: FIND CURRENT NODE`)
        const txns = this.getTransactionsInFolder(this.currentPath)
        //console.log(`txns`, txns)
        return undefined
    }

    tree() {
        // recursive ls
        const subfolders = this.ls()
        subfolders.forEach(f => {
            this.ls(f)
        })
    }

    validate() {
        // validate that .thredz.tx match the directory structure
        console.log(`TODO:`)
    }

    getTransactionsInFolder(folderName: string, startsWith?: string) {
        const folderfiles = fs.readdirSync(folderName)
        let files = folderfiles.filter( function( elm ) {return !startsWith || elm.startsWith(startsWith)});
        const transactions:any[] = []
        files.forEach(f => {
            const stats = fs.statSync(path.resolve(folderName, f))
            if (!stats.isDirectory()) {
                const contents = this.getfileContents(folderName+'/'+f)
                transactions.push(JSON.parse(contents.toString()))
            }
        })
        return transactions
    }

    getfileContents(fileName:string) {
        const contents = fs.readFileSync(fileName)
        //console.log(`got`,fileName)
        return contents
    }

    // gets commits as json object
    getCommits() {
        const contents = this.getfileContents(this.getcommitFileName())
        if (contents[0] == 91) {
            const jcontents = JSON.parse(contents.toString())
            return jcontents
        } else {
            return null
        }
    }
    // this should be the only way of storing commits
    saveCommits(jcommits:any) {
        // store any commits broadcasted and filter those out
        // mark comes saved using .saved property
        jcommits.forEach((commit:any) => {
            this.storeTransaction(commit)
        })
        // save the rest
        const jnotsaved = jcommits.filter((c:any) => !c.saved)
        fs.writeFileSync(this.getcommitFileName(), JSON.stringify(jnotsaved))
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
    stageWork(node: MetaNode) {
        let jcurrent = []
        if (this.isPendingCommit()){
            const current = this.getfileContents(this.getcommitFileName())
            jcurrent = JSON.parse(current.toString())    
        }
        // commit file will be an array of json MetaNode objects
        jcurrent.push(node)
        this.saveCommits(jcurrent)
    }
    isPendingCommit() {
        const commits = this.getcommitFileName()
        return fs.existsSync(commits)
    }
    checkCommitsPending(isDetail = false) {
        const commits = this.getcommitFileName()
        if (fs.existsSync(commits)) {
            const count = this.dumpFileContents(commits, !isDetail)
            console.log(`Run 'commit' to save ${count} changes to metanet`)
            if (!isDetail) console.log(`Run 'status -d' to see detailed changes`)
        } else {
            console.log(`No pending commits ${commits}`)
        }
    }
}