const github = require("../__mocks__/@actions/github");
const main = require("../src/main");

jest.mock("../src/create", () => ({ makeRelease: jest.fn() }));
jest.mock("../src/merge", () => jest.fn());

const createMock = require("../src/create");
const mergeMock = require("../src/merge");


beforeAll(() => {
  createMock.makeRelease.mockClear();
  mergeMock.mockClear();
});

test('event "schedule"', async () => {
  expect.assertions(1);

  github.context.eventName = "schedule";
  await main();
  expect(createMock.makeRelease).toHaveBeenCalledTimes(1);
});

test('event "pull_request_review"', async () => {
  expect.assertions(1);

  github.context.eventName = "pull_request_review";
  await main();
  expect(mergeMock).toHaveBeenCalledTimes(1);
});
