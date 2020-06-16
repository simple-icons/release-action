const github = require("../__mocks__/@actions/github");
const mergeOnApprove = require("../src/merge");

const client = new github.GitHub("token");

const APPROVED = "approved";
const CHANGES_REQUESTED = "changes_requested";
const COMMENTED = "commented";

const prTitle = "Publish 3 new icons an 2 updated icons";
const prBody = `_this Pull Request was automatically generated_

The new version will be: **v1.4.0**

# New Icons

- ACM (#513)
- bar (#512)
- Foo (#501)

# Updated Icons

- 1Password (#503)
- Abstract (#509)
`;

beforeEach(() => client.pulls.merge.mockClear());

test.each([
  "OWNER",
  "MEMBER",
])(`merge when ${APPROVED} as %s`, async (authorAssociation) => {
  expect.assertions(1);

  github.context.payload = {
    pull_request: {
      base: { ref: "master" },
      number: 36,
      body: prBody,
      title: prTitle,
    },
    review: {
      state: APPROVED,
      author_association: authorAssociation,
    }
  };

  await mergeOnApprove(client);
  expect(client.pulls.merge).toHaveBeenCalled();
});

test.each([
  [CHANGES_REQUESTED, "OWNER"],
  [COMMENTED, "OWNER"],
  [CHANGES_REQUESTED, "MEMBER"],
  [COMMENTED, "MEMBER"],
])("do not merge when %s as %s", async (reviewState, authorAssociation) => {
  expect.assertions(1);

  github.context.payload = {
    pull_request: {
      base: { ref: "master" },
      number: 36,
      body: prBody,
      title: prTitle,
    },
    review: {
      state: reviewState,
      author_association: authorAssociation,
    }
  };

  await mergeOnApprove(client);
  expect(client.pulls.merge).not.toHaveBeenCalled();
});

test.each([
  [APPROVED, "CONTRIBUTOR"],
  [CHANGES_REQUESTED, "CONTRIBUTOR"],
  [COMMENTED, "CONTRIBUTOR"],
  [APPROVED, "FIRST_TIME_CONTRIBUTOR"],
  [CHANGES_REQUESTED, "FIRST_TIME_CONTRIBUTOR"],
  [COMMENTED, "FIRST_TIME_CONTRIBUTOR"],
  [APPROVED, "FIRST_TIMER"],
  [CHANGES_REQUESTED, "FIRST_TIMER"],
  [COMMENTED, "FIRST_TIMER"],
  [APPROVED, "NONE"],
  [CHANGES_REQUESTED, "NONE"],
  [COMMENTED, "NONE"],
])('do not merge when %s as %s', async (reviewState, authorAssociation) => {
  expect.assertions(1);

  github.context.payload = {
    pull_request: {
      base: { ref: "master" },
      number: 36,
      body: prBody,
      title: prTitle,
    },
    review: {
      state: reviewState,
      author_association: authorAssociation,
    }
  };

  await mergeOnApprove(client);
  expect(client.pulls.merge).not.toHaveBeenCalled();
});

test('do not merge if base is not master', async () => {
  expect.assertions(1);

  github.context.payload = {
    pull_request: {
      base: { ref: "develop" },
      number: 36,
      body: prBody,
      title: prTitle,
    },
    review: {
      state: APPROVED,
      author_association: "OWNER",
    }
  };

  await mergeOnApprove(client);
  expect(client.pulls.merge).not.toHaveBeenCalled();
});
