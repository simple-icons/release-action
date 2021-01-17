const core = require('@actions/core');
const github = require('@actions/github');

const makeRelease = require('./create.js');
const mergeOnApprove = require('./merge.js');

const EVENT_PULL_REQUEST_REVIEW = 'pull_request_review';
const EVENT_SCHEDULE = 'schedule';

async function main() {
  const token = core.getInput('repo-token', { required: true });
  const client = new github.getOctokit(token);

  const event = github.context.eventName;
  switch (event) {
    case 'pull_request': // for testing
    case EVENT_SCHEDULE:
      core.info('Scheduled run; creating release PR');
      await makeRelease(client);
      break;
    case EVENT_PULL_REQUEST_REVIEW:
      core.info('PR review detected; checking if release PR should be merged');
      await mergeOnApprove(client);
      break;
    default:
      core.error(`Event '${event}' not supported by the release action`);
  }
}

module.exports = main;
