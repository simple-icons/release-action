import { jest } from '@jest/globals';

import * as core from '../__mocks__/@actions/core.js';
import * as github from '../__mocks__/@actions/github.js';

import main from '../src/main.js';

const makeRelease = jest.fn();
const mergeOnApprove = jest.fn();

beforeAll(() => {
  makeRelease.mockClear();
  mergeOnApprove.mockClear();
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
