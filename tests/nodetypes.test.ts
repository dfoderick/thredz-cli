import { ContainerNode, ContentNode, MetaNode } from "../src/models/meta";

test('container node', () => {
    const node = new ContainerNode('test')
    expect(node).toBeDefined()
  });

test('content node', () => {
  const node = new ContentNode('test')
  expect(node).toBeDefined()
  expect(node.content).toBeDefined()
  });
