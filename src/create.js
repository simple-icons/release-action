import alphaSort from 'alpha-sort';
import semverInc from 'semver/functions/inc.js';

const IGNORE_PRS = [6296, 6298];

const BASE64 = 'base64';
const UTF8 = 'utf-8';

const SI_DATA_FILE = '_data/simple-icons.json';
const PACKAGE_FILE = 'package.json';

const STATUS_ADDED = 'added';
const STATUS_MODIFIED = 'modified';
const STATUS_REMOVED = 'removed';

const CHANGE_TYPE_ADD = 'new';
const CHANGE_TYPE_UPDATE = 'update';
const CHANGE_TYPE_REMOVED = 'removed';
const CHANGE_TYPE_IRRELEVANT = 'irrelevant';

const RELEASE_PATCH = 'patch';
const RELEASE_MINOR = 'minor';
const RELEASE_MAJOR = 'major';

const BRANCH_DEVELOP = 'develop';
const BRANCH_MASTER = 'master';
const REF_DEVELOP = 'develop';
const REF_MASTER = 'master';

const RELEASE_LABEL = 'release';

const SVG_TITLE_EXPR = /<title>(.*)<\/title>/;

const OUTPUT_DID_CREATE_PR_NAME = 'did-create-pr';
const OUTPUT_NEW_VERSION_NAME = 'new-version';

const _ghFileCache = {};

// Helper functions
function decode(data, encoding) {
  if (encoding === BASE64) {
    const dataBuffer = Buffer.from(data, BASE64);
    return dataBuffer.toString(UTF8);
  } else {
    throw Error(`Unknown encoding ${encoding}`);
  }
}

function existingFiles(fileInfo) {
  return (
    fileInfo.status === STATUS_ADDED || fileInfo.status === STATUS_MODIFIED
  );
}

function removedFiles(fileInfo) {
  return fileInfo.status === STATUS_REMOVED;
}

function iconFiles(fileInfo) {
  return isIconFile(fileInfo.filename);
}

function isMerged(pr) {
  return pr.merged_at !== null;
}

function isIconFile(path) {
  return path.startsWith('icons') && path.endsWith('.svg');
}

function isReleasePr(pr) {
  return pr.base.ref === BRANCH_MASTER;
}

function isSimpleIconsDataFile(path) {
  return path === SI_DATA_FILE;
}

function prNumbersToString(prNumbers) {
  return prNumbers.map((prNumber) => `#${prNumber}`).join(', ');
}

function stringifyJson(object) {
  return JSON.stringify(object, null, 2);
}

/**
 * Detect icons updated giving a data file unified diff.
 */
async function detectUpdatesInDataFileUnifiedDiff(diff, client, context) {
  const siDataFile = await getPrFile(client, context, SI_DATA_FILE, REF_MASTER);
  const siDataFileLines = siDataFile.split('\n');
  const diffLines = diff.split('\n');

  const updatedIcons = [];
  let diffPartFromLine,
    linesAfterDoubleArroba = 0;

  // for each line of the unified diff, get '@@' meta to detect update
  // start lines and, when an update is found, iterate backwards to find
  // the title of the updated icon
  for (const diffLine of diffLines) {
    if (diffLine.startsWith('@@')) {
      diffPartFromLine = Math.abs(
        parseInt(diffLine.split(' ')[1].split(',')[0]),
      );
      linesAfterDoubleArroba = 0;
    } else if (
      (diffLine.startsWith('+') || diffLine.startsWith('-')) &&
      diffLine.includes('            ')
    ) {
      // update found, iterate backwards from the line of the update
      let nCurrentLine = diffPartFromLine + linesAfterDoubleArroba - 1;

      // here > 2 prevents to reach the beginning of the file
      while (nCurrentLine > 2) {
        const siDataLine = siDataFileLines[nCurrentLine];
        if (siDataLine.includes('"title": "')) {
          const title = siDataLine.split('"').slice(3, -1).join('"');
          if (!updatedIcons.includes(title)) {
            updatedIcons.push(title);
          }
          break;
        } else if (siDataLine.includes('        }')) {
          break;
        } else {
          nCurrentLine--;
        }
      }
    } else {
      linesAfterDoubleArroba++;
    }
  }

  return updatedIcons;
}

// GitHub API
async function addLabels(client, context, issueNumber, labels) {
  await client.rest.issues.addLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    labels: labels,
  });
}

async function createPullRequest(client, context, title, body, head, base) {
  const { data } = await client.rest.pulls.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    title: title,
    body: body,
    head: head,
    base: base,
  });

  return data.number;
}

async function getPrFile(client, context, path, ref) {
  if (_ghFileCache[path + ref] === undefined) {
    const fileContents = await client.rest.repos.getContent({
      owner: context.repo.owner,
      repo: context.repo.repo,
      path: path,
      ref: ref,
    });

    const fileDetails = fileContents.data[0] || fileContents.data;
    _ghFileCache[path + ref] = decode(
      fileDetails.content,
      fileDetails.encoding,
    );
  }

  return _ghFileCache[path + ref];
}

async function* getPrFiles(core, client, context, prNumber) {
  const { data: files } = await client.rest.pulls.listFiles({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });
  core.debug(`[create:getPrFiles] files: ${stringifyJson(files)}`);

  for (let fileInfo of files.filter(iconFiles).filter(existingFiles)) {
    try {
      yield {
        content: await getPrFile(
          client,
          context,
          fileInfo.filename,
          REF_DEVELOP,
        ),
        patch: fileInfo.patch,
        path: fileInfo.filename,
        status: fileInfo.status,
      };
    } catch (err) {
      core.warning(
        `${fileInfo.status} file not found on ${REF_DEVELOP} ('${fileInfo.filename}'): ${err}`,
      );
    }
  }

  for (let fileInfo of files.filter(iconFiles).filter(removedFiles)) {
    try {
      yield {
        content: await getPrFile(
          client,
          context,
          fileInfo.filename,
          REF_MASTER,
        ),
        patch: fileInfo.patch,
        path: fileInfo.filename,
        status: fileInfo.status,
      };
    } catch (err) {
      core.warning(
        `removed file not found on ${REF_MASTER} ('${fileInfo.filename}'): ${err}`,
      );
    }
  }

  const dataFile = files.find((file) => isSimpleIconsDataFile(file.filename));
  if (dataFile !== undefined) {
    yield {
      content: await getPrFile(client, context, dataFile.filename, REF_DEVELOP),
      patch: dataFile.patch,
      path: dataFile.filename,
      status: dataFile.status,
    };
  }
}

async function getFilesSinceLastRelease(core, client, context) {
  const perPage = 10;

  const files = [];
  let page = 1;
  while (true) {
    const { data: prs } = await client.rest.pulls.list({
      owner: context.repo.owner,
      repo: context.repo.repo,
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
      per_page: perPage,
      page: page,
    });
    core.debug(`[create:getFilesSinceLastRelease] prs: ${stringifyJson(prs)}`);

    core.info(`on page ${page} there are ${prs.length} PRs`);
    for (let pr of prs) {
      core.info(`processing PR #${pr.number}`);
      if (isMerged(pr) === false) {
        // If the PR is not merged the changes won't be included in this release
        continue;
      }

      if (IGNORE_PRS.includes(pr.number)) {
        // Ignore some PRs that we're not interested in
        continue;
      }

      if (isReleasePr(pr)) {
        // Previous release, earlier changes definitely already released
        core.info(`found previous release, PR #${pr.number}`);
        return files.filter(
          (file) => new Date(file.merged_at) >= new Date(pr.merged_at),
        );
      }

      for await (let file of getPrFiles(core, client, context, pr.number)) {
        core.info(`found '${file.path}' in PR #${pr.number}`);
        file.prNumber = pr.number;
        file.merged_at = pr.merged_at;
        files.push(file);
      }
    }

    if (prs.length < perPage) {
      // No Pull Requests left, break endless loop
      return files;
    }

    page += 1;
  }
}

// Logic determining changes
function getChangesFromFile(core, file, id) {
  if (isIconFile(file.path) && file.status === STATUS_ADDED) {
    core.info(`Detected an icon was added ('${file.path}')`);

    const svgTitleMatch = file.content.match(SVG_TITLE_EXPR);
    return [
      {
        id: id,
        changeType: CHANGE_TYPE_ADD,
        name: svgTitleMatch[1],
        path: file.path,
        prNumbers: [file.prNumber],
      },
    ];
  } else if (isIconFile(file.path) && file.status === STATUS_MODIFIED) {
    core.info(`Detected an icon was modified ('${file.path}')`);

    // before and after
    const svgTitleMatch = file.content.match(SVG_TITLE_EXPR);
    return [
      {
        id: id,
        changeType: CHANGE_TYPE_UPDATE,
        name: svgTitleMatch[1],
        path: file.path,
        prNumbers: [file.prNumber],
      },
    ];
  } else if (isIconFile(file.path) && file.status === STATUS_REMOVED) {
    core.info(`Detected an icon was removed ('${file.path}')`);

    const svgTitleMatch = file.content.match(SVG_TITLE_EXPR) || 'FALLBACK';
    return [
      {
        id: id,
        changeType: CHANGE_TYPE_REMOVED,
        name: svgTitleMatch[1],
        path: file.path,
        prNumbers: [file.prNumber],
      },
    ];
  } else if (isSimpleIconsDataFile(file.path)) {
    core.info(`Detected a change to the data file`);
    const changes = [];

    const updatedIconsTitles = detectUpdatesInDataFileUnifiedDiff(
      file.patch,
      client,
      context,
    );
    core.debug(
      `[create:getChangesFromFile - isSimpleIconsDataFile] updatedIconsTitles: ${stringifyJson(
        updatedIconsTitles,
      )}`,
    );

    for (const title of updatedIconsTitles) {
      changes.push({
        id: id + title,
        changeType: CHANGE_TYPE_UPDATE,
        name: title,
        prNumbers: [file.prNumber],
      });
    }

    // Removals in the source are ignored for simplicity *and* because removals
    // will always be captured by the file being removed. For more see:
    //   https://github.com/simple-icons/release-action/issues/25

    return changes;
  } else {
    core.debug(`Ignoring '${file.path}'`);
    return [{ id: id, changeType: CHANGE_TYPE_IRRELEVANT }];
  }
}

function filterDuplicates(newIcons, updatedIcons, removedIcons) {
  // An added icon was update before the release
  let removeFromUpdated = [];
  for (let newIcon of newIcons) {
    for (let updatedIcon of updatedIcons) {
      if (updatedIcon.name === newIcon.name) {
        newIcon.prNumbers.push(...updatedIcon.prNumbers);
        removeFromUpdated.push(updatedIcon);
      }
    }
  }
  updatedIcons = updatedIcons.filter(
    (a) => !removeFromUpdated.some((b) => a.id === b.id),
  );

  // An added icon was removed before the release
  let removeFromAdded = [];
  let removeFromRemoved = [];
  for (let newIcon of newIcons) {
    for (let removedIcon of removedIcons) {
      if (removedIcon.name === newIcon.name) {
        removeFromAdded.push(newIcon);
        removeFromRemoved.push(removedIcon);
      }
    }
  }
  newIcons = newIcons.filter(
    (a) => !removeFromAdded.some((b) => a.id === b.id),
  );
  removedIcons = removedIcons.filter(
    (a) => !removeFromRemoved.some((b) => a.id === b.id),
  );

  // An updated icon was removed before the release
  removeFromUpdated = [];
  for (let updatedIcon of updatedIcons) {
    for (let removedIcon of removedIcons) {
      if (removedIcon.name === updatedIcon.name) {
        removeFromUpdated.push(updatedIcon);
      }
    }
  }
  updatedIcons = updatedIcons.filter(
    (a) => !removeFromUpdated.some((b) => a.id === b.id),
  );

  // An updated icon was updated multiple times
  removeFromUpdated = [];
  for (let i = 0; i < updatedIcons.length; i++) {
    for (let j = i; j < updatedIcons.length; j++) {
      const updatedIcon = updatedIcons[i],
        otherIcon = updatedIcons[j];
      if (otherIcon.id === updatedIcon.id) {
        continue;
      }

      if (otherIcon.name === updatedIcon.name) {
        const otherPrNumbers = otherIcon.prNumbers.filter(
          (prNumber) => !updatedIcon.prNumbers.includes(prNumber),
        );
        updatedIcon.prNumbers.push(...otherPrNumbers);
        removeFromUpdated.push(otherIcon);
      }
    }
  }
  updatedIcons = updatedIcons.filter(
    (a) => !removeFromUpdated.some((b) => a.id === b.id),
  );

  return [newIcons, updatedIcons, removedIcons];
}

// Release logic
async function getNextVersionNumber(client, context, changes) {
  let releaseType = RELEASE_PATCH;
  if (changes.added.length > 0) {
    releaseType = RELEASE_MINOR;
  }
  if (changes.removed.length > 0) {
    releaseType = RELEASE_MAJOR;
  }

  const packageJsonFile = await getPrFile(
    client,
    context,
    PACKAGE_FILE,
    REF_MASTER,
  );
  const packageJson = JSON.parse(packageJsonFile);

  const newVersion = semverInc(packageJson.version, releaseType);
  return newVersion;
}

function createReleaseTitle(newIcons, updatedIcons, removedIcons) {
  let releaseTitle = 'Publish';

  if (newIcons.length === 1) {
    releaseTitle += ' 1 new icon';
  } else if (newIcons.length > 1) {
    releaseTitle += ` ${newIcons.length} new icons`;
  }

  if (updatedIcons.length > 0 && newIcons.length > 0) {
    releaseTitle += ' and';
  }

  if (updatedIcons.length === 1) {
    releaseTitle += ' 1 updated icon';
  } else if (updatedIcons.length > 1) {
    releaseTitle += ` ${updatedIcons.length} updated icons`;
  }

  if (removedIcons.length > 0 && newIcons.length + updatedIcons.length > 0) {
    releaseTitle += ' and';
  }

  if (removedIcons.length === 1) {
    releaseTitle += ' 1 removed icon';
  } else if (removedIcons.length > 1) {
    releaseTitle += ` ${removedIcons.length} removed icons`;
  }

  return releaseTitle;
}

function createReleaseNotes(newVersion, newIcons, updatedIcons, removedIcons) {
  const sortAlphabetically = (a, b) =>
    alphaSort({ caseInsensitive: true })(a.name, b.name);

  let releaseHeader = '_this Pull Request was automatically generated_\n\n';
  releaseHeader += `The new version will be: **v${newVersion}**\n`;

  let releaseNotes = '';
  if (newIcons.length > 0) {
    releaseNotes += '\n# New Icons\n\n';
    for (let newIcon of newIcons.sort(sortAlphabetically)) {
      const prs = prNumbersToString(newIcon.prNumbers);
      releaseNotes += `- ${newIcon.name} (${prs})\n`;
    }
  }

  if (updatedIcons.length > 0) {
    releaseNotes += '\n# Updated Icons\n\n';
    for (let updatedIcon of updatedIcons.sort(sortAlphabetically)) {
      const prs = prNumbersToString(updatedIcon.prNumbers);
      releaseNotes += `- ${updatedIcon.name} (${prs})\n`;
    }
  }

  if (removedIcons.length > 0) {
    releaseNotes += '\n# Removed Icons\n\n';
    for (let removedIcon of removedIcons.sort(sortAlphabetically)) {
      const prs = prNumbersToString(removedIcon.prNumbers);
      releaseNotes += `- ${removedIcon.name} (${prs})\n`;
    }
  }

  return releaseHeader + releaseNotes;
}

async function createReleasePr(core, client, context, title, body) {
  core.info('\n Creating PR for release:');
  core.info('PR title:');
  core.info(`   ${title}`);
  core.debug('\nPR body:');
  core.debug(body);

  const prNumber = await createPullRequest(
    client,
    context,
    title,
    body,
    BRANCH_DEVELOP,
    BRANCH_MASTER,
  );
  core.info(`\nNew release PR is: ${prNumber}`);

  core.info(`Adding label '${RELEASE_LABEL}' to PR ${prNumber}`);
  await addLabels(client, context, prNumber, [RELEASE_LABEL]);
  core.info(`Added the '${RELEASE_LABEL}' label to PR ${prNumber}`);
}

async function getChanges(core, client, context) {
  const newIcons = [];
  const updatedIcons = [];
  const removedIcons = [];
  let i = 0;

  const files = await getFilesSinceLastRelease(core, client, context);
  for (let file of files) {
    i = i + 1;

    const items = getChangesFromFile(core, file, i);
    core.debug(`[create:getChanges] items: ${stringifyJson(items)}`);

    for (let item of items) {
      if (item.changeType === CHANGE_TYPE_ADD) {
        newIcons.push(item);
      } else if (item.changeType === CHANGE_TYPE_UPDATE) {
        updatedIcons.push(item);
      } else if (item.changeType === CHANGE_TYPE_REMOVED) {
        removedIcons.push(item);
      }
    }
  }

  core.debug(`[create:getChanges] newIcons: ${stringifyJson(newIcons)}`);
  core.debug(
    `[create:getChanges] updatedIcons: ${stringifyJson(updatedIcons)}`,
  );
  core.debug(
    `[create:getChanges] removedIcons: ${stringifyJson(removedIcons)}`,
  );
  return filterDuplicates(newIcons, updatedIcons, removedIcons);
}

async function makeRelease(core, client, context) {
  const [newIcons, updatedIcons, removedIcons] = await getChanges(
    core,
    client,
    context,
  );
  if (
    newIcons.length === 0 &&
    updatedIcons.length === 0 &&
    removedIcons.length === 0
  ) {
    core.info('No notable changes detected');
    core.setOutput(OUTPUT_DID_CREATE_PR_NAME, 'false');
    return;
  }
  core.setOutput(OUTPUT_DID_CREATE_PR_NAME, 'true');

  const newVersion = await getNextVersionNumber(client, context, {
    added: newIcons,
    modified: updatedIcons,
    removed: removedIcons,
  });
  const releaseTitle = createReleaseTitle(newIcons, updatedIcons, removedIcons);
  const releaseNotes = createReleaseNotes(
    newVersion,
    newIcons,
    updatedIcons,
    removedIcons,
  );

  await createReleasePr(core, client, context, releaseTitle, releaseNotes);
  core.setOutput(OUTPUT_NEW_VERSION_NAME, newVersion);
}

export default makeRelease;
