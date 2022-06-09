import * as fs from "fs";

export class Folder {
    user: string = ''
    userRoot = `./users/`
    get cwd() { return process.cwd() }
    getuserFolder() { return `${this.userRoot}${this.user}` }
    getcommitFileName() { return `${this.getuserFolder()}/.commits` }
    createUser(user: string) {
        this.user = user
        const userFolder = this.getuserFolder()
        if (fs.existsSync(userFolder)) {
            console.log(`user ${user} already exists at ${userFolder}`)
        } else {
            fs.mkdirSync(userFolder)
            console.log(`made ${userFolder}`)
        }
    }
    getfileContents(fileName:string) {
        const contents = fs.readFileSync(fileName)
        return contents
    }
    dumpFileContents(fileName:string) {
        const contents = this.getfileContents(fileName)
        // console.log(`it`, contents[0])
        if (contents[0] == 91) {
            const jcontents = JSON.parse(contents.toString())
            console.log(jcontents)
        } else {
            console.log(contents.toString())
        }
    }
    cancel() {
        if (this.isPendingCommit()){
            fs.rmSync(this.getcommitFileName())
            console.log(`commit file has been deleted`)
        }
    }
    commit(content: Buffer) {
        let jcurrent = []
        if (this.isPendingCommit()){
            const current = this.getfileContents(this.getcommitFileName())
            jcurrent = JSON.parse(current.toString())    
        }
        // commit file will be an array of json objects
        jcurrent.push({hex: content.toString()})
        //fs.appendFileSync(this.getcommitFileName(), content.toString())
        fs.writeFileSync(this.getcommitFileName(), JSON.stringify(jcurrent))
    }
    isPendingCommit() {
        const commits = this.getcommitFileName()
        return fs.existsSync(commits)
    }
    checkCommitsPending() {
        const commits = this.getcommitFileName()
        if (fs.existsSync(commits)) {
            this.dumpFileContents(commits)
            console.log(`Run 'thredz commit' to save changes to metanet`)
        } else {
            console.log(`No pending commits ${commits}`)
        }
    }
}