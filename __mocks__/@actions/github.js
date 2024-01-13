import { jest } from '@jest/globals';
import * as fs from 'fs';
import _ from 'lodash';

const packageJsonUrl = new URL(
  '../../test/fixtures/package.json',
  import.meta.url,
);
const simpleIconsUrl = new URL(
  '../../test/fixtures/simple-icons.json',
  import.meta.url,
);
const svgsUrl = new URL('../../test/fixtures/svgs.json', import.meta.url);

const packageJson = fs.readFileSync(packageJsonUrl);
const simpleIconsData = fs.readFileSync(simpleIconsUrl);
const svgs = JSON.parse(fs.readFileSync(svgsUrl));

const BASE64 = 'base64';
const UTF8 = 'utf-8';

const SI_DATA_FILE = '_data/simple-icons.json';

const STATUS_ADDED = 'added';
const STATUS_MODIFIED = 'modified';
const STATUS_REMOVED = 'removed';

function encode(data, encoding) {
  if (encoding === BASE64) {
    const dataBuffer = Buffer.from(data, UTF8);
    return dataBuffer.toString(BASE64);
  } else {
    throw Error(`Unknown encoding ${encoding}`);
  }
}

const PRs = [
  // https://developer.github.com/v3/pulls/#list-pull-requests
  {
    //  0: PR that was not merged
    title: '500',
    number: 500,
    merged_at: null,
    base: { ref: 'develop' },
  },
  {
    //  1: PR that adds a file
    title: '501',
    number: 501,
    merged_at: '2011-01-26T19:01:12Z',
    base: { ref: 'develop' },
  },
  {
    //  2: PR that modifies an SVG
    title: '502',
    number: 502,
    merged_at: '2011-01-26T19:01:12Z',
    base: { ref: 'develop' },
  },
  {
    //  3: PR that was merged before the previous release
    title: '498',
    number: 498,
    merged_at: '2011-01-01T19:01:12Z',
    base: { ref: 'develop' },
  },
  {
    //  4: PR that modifies one icon's color
    title: '503',
    number: 503,
    merged_at: '2011-01-26T19:01:12Z',
    base: { ref: 'develop' },
  },
  {
    //  5: PR that modifies one icon's source
    title: '504',
    number: 504,
    merged_at: '2011-01-26T19:01:12Z',
    base: { ref: 'develop' },
  },
  {
    //  6: PR that modifies one icon's color and source
    title: '505',
    number: 505,
    merged_at: '2011-01-26T19:01:12Z',
    base: { ref: 'develop' },
  },
  {
    //  7: PR that modifies an SVG and modifies that icon's color
    title: '506',
    number: 506,
    merged_at: '2011-01-26T19:01:12Z',
    base: { ref: 'develop' },
  },
  {
    //  8: PR that modifies an SVG and modifies that icon's source
    title: '507',
    number: 507,
    merged_at: '2011-01-26T19:01:12Z',
    base: { ref: 'develop' },
  },
  {
    //  9: PR that modifies an SVG and modifies that icon's color and source
    title: '508',
    number: 508,
    merged_at: '2011-01-26T19:01:12Z',
    base: { ref: 'develop' },
  },
  {
    // 10: PR that adds an SVG and modifies another icon's color and source
    title: '509',
    number: 509,
    merged_at: '2011-01-26T19:01:12Z',
    base: { ref: 'develop' },
  },
  {
    // 11: PR that adds an SVG and modifies another SVG
    title: '510',
    number: 510,
    merged_at: '2011-01-26T19:01:12Z',
    base: { ref: 'develop' },
  },
  {
    // 12: PR that changes the data file but no metadata
    title: '511',
    number: 511,
    merged_at: '2011-01-26T19:01:12Z',
    base: { ref: 'develop' },
  },
  {
    // 13: PR that adds a brand with a lowercased name
    title: '512',
    number: 512,
    merged_at: '2011-01-26T19:01:12Z',
    base: { ref: 'develop' },
  },
  {
    // 14: PR that adds ACM (which should be listed before the lowercased brand)
    title: '513',
    number: 513,
    merged_at: '2011-01-26T19:01:12Z',
    base: { ref: 'develop' },
  },
  {
    // 15: PR that adds a brand with an accented name
    title: '514',
    number: 514,
    merged_at: '2011-01-26T19:01:12Z',
    base: { ref: 'develop' },
  },
  {
    // 16: PR that removes an icon
    title: '515',
    number: 515,
    merged_at: '2011-01-26T19:01:12Z',
    base: { ref: 'develop' },
  },
  {
    // Skipped release
    title: '[skip] Skip this one',
    number: 516,
    merged_at: '2011-01-26T19:01:12Z',
    base: { ref: 'master' },
  },
  {
    // Previous release
    title: 'Release',
    number: 499,
    merged_at: '2011-01-02T19:01:12Z',
    base: { ref: 'master' },
  },
];

const prFiles = {
  500: [
    {
      filename: 'icons/foo.svg',
      status: STATUS_ADDED,
      patch: '+' + svgs['foo.svg'],
    },
  ],
  501: [
    {
      filename: 'icons/foo.svg',
      status: STATUS_ADDED,
      patch: '+' + svgs['foo.svg'],
    },
    {
      filename: SI_DATA_FILE,
      status: STATUS_MODIFIED,
      patch: `"hex": "FF0000",
             "source": "https://www.adobe.com/"
         },
+        {
+            "title": "Foo",
+            "hex": "000000",
+            "source": "https://www.example.com/"
+        },
         {
             "title": "Simple Icons",
             "hex": "555555",`,
    },
  ],
  502: [
    {
      filename: 'icons/feedly.svg',
      status: STATUS_MODIFIED,
      patch: '+' + svgs['feedly.svg'] + '\n-' + svgs['feedly.svg'] + 'foo',
    },
  ],
  498: [
    {
      filename: 'icons/500px.svg',
      status: STATUS_ADDED,
      patch: '+' + svgs['500px.svg'],
    },
  ],
  503: [
    {
      filename: SI_DATA_FILE,
      status: STATUS_MODIFIED,
      patch: `"hex": "FF0000",
             "source": "https://www.adobe.com/"
         },
         {
             "title": "1Password",
-            "hex": "0094F5",
+            "hex": "363636",
             "source": "https://1password.com/press/"
         },
         {
             "title": "Simple Icons",
             "hex": "555555",`,
    },
  ],
  504: [
    {
      filename: SI_DATA_FILE,
      status: STATUS_MODIFIED,
      patch: `"hex": "FF0000",
             "source": "https://www.adobe.com/"
         },
         {
             "title": "Adobe",
             "hex": "FF0000",
-            "source": "https://www.adobe.com/"
+            "source": "https://www.test.com/"
         },
         {
             "title": "Simple Icons",
             "hex": "555555",`,
    },
  ],
  505: [
    {
      filename: SI_DATA_FILE,
      status: STATUS_MODIFIED,
      patch: `"hex": "FF0000",
             "source": "https://www.adobe.com/"
         },
         {
             "title": "Mozilla",
-            "hex": "111000",
-            "source": "https://mozilla.com/our-logo"
+            "hex": "000000",
+            "source": "https://mozilla.ninja/our-logo"
         },
         {
             "title": "Simple Icons",
             "hex": "555555",`,
    },
  ],
  506: [
    {
      filename: 'icons/postman.svg',
      status: STATUS_MODIFIED,
      patch: '+' + svgs['postman.svg'] + '\n-' + svgs['postman.svg'] + 'bar',
    },
    {
      filename: SI_DATA_FILE,
      status: STATUS_MODIFIED,
      patch: `"hex": "FF0000",
             "source": "https://www.adobe.com/"
         },
         {
             "title": "Postman",
-            "hex": "006C37",
+            "hex": "FF6C37",
             "source": "https://www.getpostman.com/resources/media-assets/"
         },
         {
             "title": "Simple Icons",
             "hex": "555555",`,
    },
  ],
  507: [
    {
      filename: 'icons/intel.svg',
      status: STATUS_MODIFIED,
      patch: '+' + svgs['intel.svg'] + '\n-' + svgs['intel.svg'] + 'bar',
    },
    {
      filename: SI_DATA_FILE,
      status: STATUS_MODIFIED,
      patch: `"hex": "FF0000",
             "source": "https://www.adobe.com/"
         },
         {
             "title": "Intel",
             "hex": "0071C5",
-            "source": "https://www.intel.com/"
+            "source": "https://www.intel.com"
         },
         {
             "title": "Simple Icons",
             "hex": "555555",`,
    },
  ],
  508: [
    {
      filename: 'icons/addthis.svg',
      status: STATUS_MODIFIED,
      patch: '+' + svgs['addthis.svg'] + '\n-' + svgs['addthis.svg'] + 'bar',
    },
    {
      filename: SI_DATA_FILE,
      status: STATUS_MODIFIED,
      patch: `"hex": "FF0000",
             "source": "https://www.adobe.com/"
         },
         {
             "title": "AddThis",
-            "hex": "FF6559",
-            "source": "https://www.intel.com/"
+            "hex": "FF6550",
+            "source": "https://www.intel.com"
         },
         {
             "title": "Simple Icons",
             "hex": "555555",`,
    },
  ],
  509: [
    {
      filename: 'icons/jest.svg',
      status: STATUS_ADDED,
      patch: '+' + svgs['jest.svg'],
    },
    {
      filename: SI_DATA_FILE,
      status: STATUS_MODIFIED,
      patch: `"hex": "FF0000",
             "source": "https://www.adobe.com/"
         },
         {
             "title": "Abstract",
-            "hex": "AAAAAA",
-            "source": "https://www.ABSTRACT.com/about/"
+            "hex": "191A1B",
+            "source": "https://www.abstract.com/about/"
         },
         {
             "title": "Hello world",
             "hex": "FF6550",
             "source": "https://www.intel.com"
+        },
+        {
+            "title": "Jest",
+            "hex": "C21325",
+            "source": "https://jestjs.io/"
         },
         {
             "title": "Simple Icons",
             "hex": "555555",`,
    },
  ],
  510: [
    {
      filename: 'icons/opera.svg',
      status: STATUS_MODIFIED,
      patch: '+' + svgs['opera.svg'] + '\n-' + svgs['opera.svg'] + 'foobar',
    },
    {
      filename: 'icons/wordpress.svg',
      status: STATUS_ADDED,
      patch: '+' + svgs['wordpress.svg'],
    },
    {
      filename: SI_DATA_FILE,
      status: STATUS_MODIFIED,
      patch: `"hex": "FF0000",
             "source": "https://www.adobe.com/"
+        },
+        {
+            "title": "WordPress",
+            "hex": "21759B",
+            "source": "https://wordpress.org/about/logos"
         },
         {
             "title": "Simple Icons",
             "hex": "555555",`,
    },
  ],
  511: [
    {
      filename: SI_DATA_FILE,
      status: STATUS_MODIFIED,
      patch: `"title": "Razer",
              "hex": "00FF00",
              "source": "https://en.wikipedia.org/wiki/File:Razer_snake_logo.svg"
+           },...
-           },
            {
              "title": "React",
              "hex": "61DAFB",`,
    },
  ],
  512: [
    {
      filename: 'icons/bar.svg',
      status: STATUS_ADDED,
      patch: '+' + svgs['bar.svg'],
    },
    {
      filename: SI_DATA_FILE,
      status: STATUS_MODIFIED,
      patch: `"hex": "FF0000",
             "source": "https://www.adobe.com/"
         },
+        {
+            "title": "bar",
+            "hex": "FFFFFF",
+            "source": "https://www.example.org/"
+        },
         {
             "title": "Simple Icons",
             "hex": "555555",`,
    },
  ],
  513: [
    {
      filename: 'icons/acm.svg',
      status: STATUS_ADDED,
      patch: '+' + svgs['acm.svg'],
    },
    {
      filename: SI_DATA_FILE,
      status: STATUS_MODIFIED,
      patch: `"hex": "A9225C",
             "source": "https://company-39138.frontify.com/d/7EKFm12NQSa8/accusoft-corporation-style-guide#/style-guide/logo"
         },
+        {
+            "title": "ACM",
+            "hex": "0085CA",
+            "source": "http://identitystandards.acm.org/"
+        },
         {
             "title": "ActiGraph",
             "hex": "0B2C4A",`,
    },
  ],
  514: [
    {
      filename: 'icons/pokemon.svg',
      status: STATUS_ADDED,
      patch: '+' + svgs['pokemon.svg'],
    },
    {
      filename: SI_DATA_FILE,
      status: STATUS_MODIFIED,
      patch: `"hex": "F43E37",
             "source": "https://blog.pocketcasts.com/press/"
         },
+        {
+           "title": "Pokémon",
+           "hex": "FFCB05",
+           "source": "https://commons.wikimedia.org/wiki/File:International_Pok%C3%A9mon_logo.svg"
+        },
         {
             "title": "Poly",
             "hex": "EB3C00",`,
    },
  ],
  515: [
    {
      filename: 'icons/foobar.svg',
      status: STATUS_REMOVED,
      patch: '-' + svgs['foobar.svg'],
    },
    {
      filename: SI_DATA_FILE,
      status: STATUS_MODIFIED,
      patch: `"hex": "F43E37",
             "source": "https://blog.pocketcasts.com/press/"
         },
-        {
-           "title": "Foobar",
-           "hex": "FFCB05",
-           "source": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
-        },
         {
             "title": "Poly",
             "hex": "EB3C00",`,
    },
  ],
};

const files = {
  'package.json': {
    content: encode(packageJson, BASE64),
    encoding: BASE64,
  },
  'package-lock.json': {
    content: encode(packageJson, BASE64),
    encoding: BASE64,
  },
  '_data/simple-icons.json': {
    content: encode(simpleIconsData, BASE64),
    encoding: BASE64,
  },
  'icons/500px.svg': {
    content: encode(svgs['500px.svg'], BASE64),
    encoding: BASE64,
  },
  'icons/addthis.svg': {
    content: encode(svgs['addthis.svg'], BASE64),
    encoding: BASE64,
  },
  'icons/acm.svg': {
    content: encode(svgs['acm.svg'], BASE64),
    encoding: BASE64,
  },
  'icons/bar.svg': {
    content: encode(svgs['bar.svg'], BASE64),
    encoding: BASE64,
  },
  'icons/feedly.svg': {
    content: encode(svgs['feedly.svg'], BASE64),
    encoding: BASE64,
  },
  'icons/foo.svg': {
    content: encode(svgs['foo.svg'], BASE64),
    encoding: BASE64,
  },
  'icons/foobar.svg': {
    content: encode(svgs['foobar.svg'], BASE64),
    encoding: BASE64,
  },
  'icons/intel.svg': {
    content: encode(svgs['intel.svg'], BASE64),
    encoding: BASE64,
  },
  'icons/jest.svg': {
    content: encode(svgs['jest.svg'], BASE64),
    encoding: BASE64,
  },
  'icons/opera.svg': {
    content: encode(svgs['opera.svg'], BASE64),
    encoding: BASE64,
  },
  'icons/pokemon.svg': {
    content: encode(svgs['pokemon.svg'], BASE64),
    encoding: BASE64,
  },
  'icons/postman.svg': {
    content: encode(svgs['postman.svg'], BASE64),
    encoding: BASE64,
  },
  'icons/wordpress.svg': {
    content: encode(svgs['wordpress.svg'], BASE64),
    encoding: BASE64,
  },
};

const defaultClient = {
  rest: {
    issues: {
      addLabels: jest.fn(() => {}).mockName('github.issues.addLabels'),
    },
    pulls: {
      create: jest
        .fn()
        .mockName('github.pulls.create')
        .mockImplementation(() => ({ data: { number: 42 } })),
      list: jest
        .fn()
        .mockName('github.pulls.list')
        .mockImplementation((args) => {
          const page = args.page - 1,
            perPage = args.per_page;
          return { data: PRs.slice(page * perPage, (page + 1) * perPage) };
        }),
      listFiles: jest
        .fn()
        .mockName('github.pulls.listFiles')
        .mockImplementation((args) => {
          const prNumber = args.pull_number;
          return { data: prFiles[prNumber] };
        }),
      merge: jest.fn().mockName('github.pulls.merge'),
    },
    repos: {
      getContent: jest
        .fn()
        .mockName('github.repos.getContent')
        .mockImplementation((args) => {
          const path = args.path;
          return { data: files[path] };
        }),
    },
  },
};

const patchReleaseClient = _.cloneDeep(defaultClient);
patchReleaseClient.rest.pulls.list = jest
  .fn()
  .mockImplementation(() => ({ data: [PRs[4]] }));

const minorReleaseClient = _.cloneDeep(defaultClient);
minorReleaseClient.rest.pulls.list = jest
  .fn()
  .mockImplementation(() => ({ data: [PRs[1]] }));

const majorReleaseClient = _.cloneDeep(defaultClient);
majorReleaseClient.rest.pulls.list = jest
  .fn()
  .mockImplementation(() => ({ data: [PRs[16]] }));

const addAndUpdateReleaseClient = _.cloneDeep(defaultClient);
addAndUpdateReleaseClient.rest.pulls.list = jest
  .fn()
  .mockImplementation(() => ({
    data: [PRs[1], PRs[2], PRs[14]],
  }));

const addAndRemoveReleaseClient = _.cloneDeep(defaultClient);
addAndRemoveReleaseClient.rest.pulls.list = jest
  .fn()
  .mockImplementation(() => ({
    data: [PRs[1], PRs[14], PRs[16]],
  }));

const addRemoveAndUpdateReleaseClient = _.cloneDeep(defaultClient);
addRemoveAndUpdateReleaseClient.rest.pulls.list = jest
  .fn()
  .mockImplementation(() => ({
    data: [PRs[1], PRs[2], PRs[14], PRs[16]],
  }));

export const context = {
  eventName: 'schedule',
  repo: {
    owner: 'simple-icons',
    repo: 'simple-icons',
  },
};

export function getOctokit(token) {
  switch (token) {
    case 'patch':
      return patchReleaseClient;
    case 'minor':
      return minorReleaseClient;
    case 'major':
      return majorReleaseClient;
    case 'add-and-update':
      return addAndUpdateReleaseClient;
    case 'add-and-remove':
      return addAndRemoveReleaseClient;
    case 'add-remove-and-update':
      return addRemoveAndUpdateReleaseClient;
    default:
      return defaultClient;
  }
}
