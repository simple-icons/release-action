# Contributing to this GitHub Action

Simple Icons welcomes contributions and corrections. Before contributing, please make sure you have read the guidelines below. If you decide to contribute anything, please do the following:

1. Fork this repository
1. Create a new branch from the latest `master` (read more [here](https://guides.github.com/introduction/flow/))
1. Start hacking on the new branch
1. Commit and push to the new branch
1. Make a pull request

Also consider the following, this Action is tailor-made for [Simple Icons](https://github.com/simple-icons/simple-icons) and changes should always be made with that in mind. If you wish to implement significant changes you are perhaps better off forking this repository.

## Guidelines

Please note that modifications should follow these coding guidelines:

- Indent is 2 spaces
- Use `async`/`await` over Promises and callbacks

## Building

We use [@zeit/ncc](https://github.com/vercel/ncc#readme) to create a single `.js` file that contains all the source code needed to run the Action. This means that this file works without the `node_modules/` folder present.

Therefore, you should make sure the `npm run build` command does not fail due to your changes. Run `npm run build` before making a commit and include the changes in the `./lib` folder in your commit.

## Local Preview

Use this command below to preview the release note:

```shell
SI_SI_REPOSITORY_TOKEN='your-repo-token' npm run preview
```
