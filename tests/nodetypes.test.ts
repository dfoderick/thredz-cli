import { ContainerNode, ContentNode, MetaNode } from "../src/models/meta";
import {Folder} from "../src/folder"
import {Uploader} from "../src/uploader"
import {Wallet} from "../src/wallet"

test('container node', () => {
    const node = new ContainerNode('test')
    expect(node).toBeDefined()
  });

test('content node', () => {
  const node = new ContentNode('test')
  expect(node).toBeDefined()
  expect(node.content).toBeDefined()
  });
