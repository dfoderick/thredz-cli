// a metanet node
export class MetaNode {
    parent: MetaNode | null = null
    name: string = ''
    content: Buffer | null = null
    keyPath: string = ''
    transactionId: string = ''
    children: MetaNode[] = []
}