const github = require("../__mocks__/@actions/github");
const main = require("../src/create");


const client = new github.GitHub("token");
const expectedNotes = `_this Pull Request was automatically generated_

The new version will be: **v2.0.0**

# New Icons

- ACM (#513)
- bar (#512)
- Foo (#501)
- Jest (#509)
- Pokémon (#514)
- WordPress (#510)

# Updated Icons

- 1Password (#503)
- Abstract (#509)
- AddThis (#508)
- Adobe (#504)
- Feedly (#502)
- Intel (#507)
- Mozilla (#505)
- Opera (#510)
- Postman (#506)

# Removed Icons

- foobar (#515)
`;


test('run action - no errors', async () => {
  expect.assertions(1);
  await expect(main()).resolves.not.toBeDefined();
});

test.each([
  ["patch", "1.0.1"],
  ["minor", "1.1.0"],
  ["major", "2.0.0"],
])('correct new version (%s)', async (token, expectedVersion) => {
  expect.assertions(1);

  const _client = github.GitHub(token);
  const [newIcons, updatedIcons, removedIcons] = await main.getChanges(_client);
  const newVersion = await main.getNextVersionNumber(client, {
    added: newIcons,
    modified: updatedIcons,
    removed: removedIcons,
  });

  expect(newVersion).toBe(expectedVersion);
});

test('correct release title', async () => {
  expect.assertions(1);

  const [newIcons, updatedIcons, removedIcons] = await main.getChanges(client);
  const releaseTitle = main.createReleaseTitle(newIcons, updatedIcons, removedIcons);

  expectedTitle = "Publish 6 new icons and 9 updated icons and 1 removed icon";
  expect(releaseTitle).toBe(expectedTitle);
});

test('correct release notes', async () => {
  expect.assertions(1);

  const [newIcons, updatedIcons, removedIcons] = await main.getChanges(client);
  const newVersion = await main.getNextVersionNumber(client, {
    added: newIcons,
    modified: updatedIcons,
    removed: removedIcons,
  });
  const releaseNotes = main.createReleaseNotes(newVersion, newIcons, updatedIcons, removedIcons);

  expect(releaseNotes).toBe(expectedNotes);
});
