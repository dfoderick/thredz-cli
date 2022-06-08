import * as fs from "fs";

export class Folder {
    userRoot = `./users/`
    get cwd() { return process.cwd() }
    getuserFolder(user:string) { return `${this.userRoot}${user}` }
    createUser(user: string) {
        const userFolder = this.getuserFolder(user)
        if (fs.existsSync(userFolder)) {
            console.log(`user ${user} already exists at ${userFolder}`)
        } else {
            fs.mkdirSync(userFolder)
            console.log(`made ${userFolder}`)
        }
    }
    checkCommitsPending() {
        console.log(`TODO: check pending commits`)
    }
}