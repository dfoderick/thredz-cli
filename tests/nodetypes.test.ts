import { ThredzContainer, ThredzContent } from "../src/models/meta";

test('container node', () => {
    const node = new ThredzContainer('test')
    expect(node).toBeDefined()
  });

  test('container from json', () => {
    const node = ThredzContainer.fromJson({name:'test',transactionId:'whatever'})
    expect(node).toBeInstanceOf(ThredzContainer)
    expect(node.transactionId).toBe('whatever')
  })

test('content node', () => {
  const node = new ThredzContent('test')
  expect(node).toBeDefined()
  expect(node.content).toBeDefined()
  });
