const EVENT_PULL_REQUEST_REVIEW = 'pull_request_review';
const EVENT_SCHEDULE = 'schedule';

async function main(core, github, { makeRelease, mergeOnApprove }) {
  const token = core.getInput('repo-token', { required: true });
  const client = new github.getOctokit(token);

  const event = github.context.eventName;
  switch (event) {
    case 'pull_request': // for testing
    case 'workflow_dispatch': // for testing
    case EVENT_SCHEDULE:
      core.info('Scheduled run; creating release PR');
      await makeRelease(core, client, github.context);
      break;
    case EVENT_PULL_REQUEST_REVIEW:
      core.info('PR review detected; checking if release PR should be merged');
      await mergeOnApprove(core, client, github.context);
      break;
    default:
      core.error(`Event '${event}' not supported by the release action`);
  }
}

export default main;
