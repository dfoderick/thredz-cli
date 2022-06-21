import { ThredzContainer, ThredzContent } from "../src/models/meta";

test('container node', () => {
    const node = new ThredzContainer('test')
    expect(node).toBeDefined()
  });

test('content node', () => {
  const node = new ThredzContent('test')
  expect(node).toBeDefined()
  expect(node.content).toBeDefined()
  });
