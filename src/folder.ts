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
    dumpFileContents(fileName:string, isCountOnly = false): number {
        const contents = this.getfileContents(fileName)
        // console.log(`it`, contents[0])
        if (contents[0] == 91) {
            const jcontents = JSON.parse(contents.toString())
            if (!isCountOnly) console.log(jcontents)
            return jcontents.length
        } else {
            console.log(contents.toString())
            return NaN
        }
    }
    cancel() {
        if (this.isPendingCommit()){
            fs.rmSync(this.getcommitFileName())
            console.log(`commit file has been deleted`)
        }
    }
    commit(content: any) {
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
    checkCommitsPending(isDetail = false) {
        const commits = this.getcommitFileName()
        if (fs.existsSync(commits)) {
            const count = this.dumpFileContents(commits, !isDetail)
            console.log(`Run 'thredz commit' to save ${count} changes to metanet`)
            if (!isDetail) console.log(`Run 'thredz status detail' see detailed changes`)
        } else {
            console.log(`No pending commits ${commits}`)
        }
    }
}