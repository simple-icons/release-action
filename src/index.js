import * as core from '@actions/core';
import * as github from '@actions/github';

import { makeReleaseNotes, makeRelease } from './create.js';
import main from './main.js';
import mergeOnApprove from './merge.js';

main(core, github, { makeReleaseNotes, makeRelease, mergeOnApprove });
