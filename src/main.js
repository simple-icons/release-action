import { env } from 'node:process';

const EVENT_PULL_REQUEST_REVIEW = 'pull_request_review';
const EVENT_SCHEDULE = 'schedule';
const EVENT_DEBUG = 'debug';

const isDebug = Boolean(env.SI_REPOSITORY_TOKEN);

async function main(
  core,
  github,
  { makeReleaseNotes, makeRelease, mergeOnApprove },
) {
  const token =
    env.SI_REPOSITORY_TOKEN || core.getInput('repo-token', { required: true });
  const client = new github.getOctokit(token);

  const event = isDebug ? EVENT_DEBUG : github.context.eventName;
  switch (event) {
    case 'workflow_dispatch':
    case 'pull_request': // for testing
    case EVENT_SCHEDULE:
      core.info('Scheduled run; creating release PR');
      await makeRelease(core, client, github.context);
      break;
    case EVENT_PULL_REQUEST_REVIEW:
      core.info('PR review detected; checking if release PR should be merged');
      await mergeOnApprove(core, client, github.context);
      break;
    case EVENT_DEBUG:
      core.info((await makeReleaseNotes(core, client, github.context)).notes);
      break;
    default:
      core.error(`Event '${event}' not supported by the release action`);
  }
}

export default main;
