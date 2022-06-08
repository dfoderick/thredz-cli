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
        console.log(contents.toString())
    }
    commit(content: Buffer) {
        fs.appendFileSync(this.getcommitFileName(), content.toString())
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