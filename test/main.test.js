import { jest } from '@jest/globals';

import * as core from '../__mocks__/@actions/core.js';
import * as github from '../__mocks__/@actions/github.js';

import main from '../src/main.js';

const makeRelease = jest.fn();
const makeReleaseNotes = jest.fn();
const mergeOnApprove = jest.fn();

beforeEach(() => {
  makeRelease.mockClear();
  makeReleaseNotes.mockClear();
  mergeOnApprove.mockClear();
  core.info.mockClear();
});

test('event "schedule"', async () => {
  expect.assertions(1);

  github.context.eventName = 'schedule';
  await main(core, github, { makeRelease });
  expect(makeRelease).toHaveBeenCalledTimes(1);
});

test('event "pull_request_review"', async () => {
  expect.assertions(1);

  github.context.eventName = 'pull_request_review';
  await main(core, github, { mergeOnApprove });
  expect(mergeOnApprove).toHaveBeenCalledTimes(1);
});

test('event "debug"', async () => {
  expect.assertions(1);

  github.context.eventName = 'debug';
  makeReleaseNotes.mockResolvedValue({
    title: 'Release 1.2.3',
    notes: 'Release notes',
  });

  await main(core, github, { makeReleaseNotes });
  expect(core.info).toHaveBeenCalledWith('Release 1.2.3\n\nRelease notes');
});
