const REF_MASTER = 'master';

const APPROVED = 'approved';
const VALID_ASSOCIATIONS = [
  // based on https://developer.github.com/v4/enum/commentauthorassociation/
  'OWNER', // "Author is the owner of the repository."
  'MEMBER', // "Author is a member of the organization that owns the repository."
];

const RELEASE_MERGE_METHOD = 'merge';

async function doMerge(core, client, context, pr) {
  core.info(`Merging #${pr.number}`);

  const newVersion = pr.body.split('**')[1];
  const commitTitle =
    pr.title.replace('Publish', 'Release') + ` (${newVersion})`;
  const commitMessage = '#' + pr.body.split('#').slice(1).join('#');

  await client.pulls.merge({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: pr.number,
    commit_title: commitTitle,
    commit_message: commitMessage,
    merge_method: RELEASE_MERGE_METHOD,
  });
}

async function mergeOnApprove(core, client, context) {
  const payload = context.payload;

  const pr = payload.pull_request;
  if (pr.base.ref !== REF_MASTER) {
    core.info(`PR base '${pr.base.ref}' does not constitute a release`);
    return;
  }

  const review = payload.review;
  if (review.state !== APPROVED) {
    core.info(
      `Review '${review.state}' won't trigger a release. '${APPROVED}' is required`
    );
    return;
  }

  const association = review.author_association;
  if (!VALID_ASSOCIATIONS.includes(association)) {
    core.info(
      `Reviewer does not have credentials to release (was '${association}')`
    );
    return;
  }

  await doMerge(core, client, context, pr);
}

export default mergeOnApprove;
