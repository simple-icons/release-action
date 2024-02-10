import * as core from '../__mocks__/@actions/core.js';
import * as github from '../__mocks__/@actions/github.js';

import { makeRelease } from '../src/create.js';

const client = new github.getOctokit('token');
const expectedNotes = `_this Pull Request was automatically generated_

The new version will be: **v2.0.0**

# New Icons

- ACM (#513) (@mondeja)
- bar (#512) (@LitoMore)
- Foo (#501) (@LitoMore)
- Jest (#509) (@service-paradis)
- Pokémon (#514) (@PeterShaggyNoble)
- WordPress (#510) (@fbernhart)

# Updated Icons

- 1Password (#503) (@LitoMore)
- Abstract (#509) (@LitoMore)
- AddThis (#508) (@LitoMore)
- Adobe (#504) (@LitoMore)
- Feedly (#502) (@LitoMore)
- Intel (#507) (@LitoMore)
- Mozilla (#505) (@LitoMore)
- Opera (#510) (@LitoMore)
- Postman (#506) (@LitoMore)

# Removed Icons

- Foobar (#515) (@LitoMore)
`;

beforeEach(() => {
  client.rest.pulls.create.mockClear();
});

test('run action - no errors', async () => {
  expect.assertions(1);
  await expect(
    makeRelease(core, client, github.context),
  ).resolves.not.toBeDefined();
});

test.each([
  ['patch', '1.0.1'],
  ['minor', '1.1.0'],
  ['major', '2.0.0'],
])('correct new version (%s)', async (token, expectedVersion) => {
  expect.assertions(2);

  const _client = github.getOctokit(token);
  await makeRelease(core, _client, github.context);

  expect(core.setOutput).toHaveBeenCalledWith('new-version', expectedVersion);
  expect(_client.rest.pulls.create).toHaveBeenCalledWith(
    expect.objectContaining({
      owner: expect.any(String),
      repo: expect.any(String),
      title: expect.any(String),
      body: expect.stringContaining(
        `The new version will be: **v${expectedVersion}**`,
      ),
      head: expect.any(String),
      base: expect.any(String),
    }),
  );
});

test.each([
  ['patch', 'Publish 1 updated icon'],
  ['add-and-update', 'Publish 2 new icons and 1 updated icon'],
  ['add-and-remove', 'Publish 2 new icons and 1 removed icon'],
  [
    'add-remove-and-update',
    'Publish 2 new icons and 1 updated icon and 1 removed icon',
  ],
])('correct release title (%s)', async (token, expectedTitle) => {
  expect.assertions(1);

  const _client = github.getOctokit(token);
  await makeRelease(core, _client, github.context);

  expect(_client.rest.pulls.create).toHaveBeenCalledWith(
    expect.objectContaining({
      owner: expect.any(String),
      repo: expect.any(String),
      title: expectedTitle,
      body: expect.any(String),
      head: expect.any(String),
      base: expect.any(String),
    }),
  );
});

test('correct release notes', async () => {
  expect.assertions(1);

  await makeRelease(core, client, github.context);

  expect(client.rest.pulls.create).toHaveBeenCalledWith(
    expect.objectContaining({
      owner: expect.any(String),
      repo: expect.any(String),
      title: expect.any(String),
      body: expectedNotes,
      head: expect.any(String),
      base: expect.any(String),
    }),
  );
});

test('correct Pull Request settings', async () => {
  expect.assertions(1);

  await makeRelease(core, client, github.context);

  expect(client.rest.pulls.create).toHaveBeenCalledWith(
    expect.objectContaining({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      title: expect.any(String),
      body: expect.any(String),
      head: 'develop',
      base: 'master',
    }),
  );
});
