import * as core from '../__mocks__/@actions/core.js';
import * as github from '../__mocks__/@actions/github.js';

import { makeRelease } from '../src/create.js';

const client = new github.getOctokit('token');
const expectedNotes = `_this Pull Request was automatically generated_

The new version will be: **v2.0.0**

# New Icons

- #513 ACM (@LitoMore)
- #512 bar (@LitoMore)
- #501 Foo (@LitoMore)
- #509 Jest (@LitoMore)
- #514 Pokémon (@LitoMore)
- #510 WordPress (@LitoMore)

# Updated Icons

- #503 1Password (@LitoMore)
- #509 Abstract (@LitoMore)
- #508 AddThis (@LitoMore)
- #504 Adobe (@LitoMore)
- #502 Feedly (@LitoMore)
- #507 Intel (@LitoMore)
- #505 Mozilla (@LitoMore)
- #510 Opera (@LitoMore)
- #506 Postman (@LitoMore)

# Removed Icons

- #515 Foobar (@LitoMore)
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
