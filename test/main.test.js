const run = require('../src/main');

test('run action', async () => {
  await run();
  expect(1 + 2).toBe(3);
});
