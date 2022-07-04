//import * as utils from 'thredz-lib/src/utils'
import * as thredz from 'thredz-lib'

test('chunk buffer', () => {
  const buf = Buffer.from('this is a test')
  expect(buf.length).toBe(14)
  const chunks = thredz.utils.chunkBuffer(buf,4)
  expect(chunks.length).toBe(4)
  expect(chunks[0].length).toBe(4)
  expect(chunks[1].length).toBe(4)
  expect(chunks[2].length).toBe(4)
  expect(chunks[3].length).toBe(2)
});

test('chunk string', () => {
  const str = 'this is a test'
  expect(str.length).toBe(14)
  const chunks = thredz.utils.chunkSubstr(str,4)
  expect(chunks.length).toBe(4)
  expect(chunks[0].length).toBe(4)
  expect(chunks[1].length).toBe(4)
  expect(chunks[2].length).toBe(4)
  expect(chunks[3].length).toBe(2)
});
