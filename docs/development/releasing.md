Releasing is a 3-step process.

# 1. Create a release branch

1. Bump a version to the new `-post` version and land a `chore: cut vX.Y.Z-post version` commit
  - `./utils/update_version.js vX.Y.Z-post`
1. On your local machine, create a new branch `release-X.Y` based off the "cutting" commit and land a `chore: mark vX.Y.Z` in the local branch:
  - `git checkout master`
  - `git checkout -b release-X.Y`
  - `./utils/update_version.js vX.Y`
  - `npm run doc`
  - `git commit -am 'chore: mark vX.Y.Z'`
1. Push branch to the upstream
  - `git push upstream release-X.Y`

Once release branch is pushed, it's last commit will be picked up by our CI/CD:
- make sure commit passes all the bots. If there are any failures, carefully inspect failures to see if these are flakes.
- the [`publish_canary`](../../.github/workflows/publish_canary.yml) workflow will publish a `@next` version for the commit - this will be our **release candidate**. Go manually to it's page on NPM   to see what it looks like. Try installing locally.

# 2. Prepare release notes

1. Use ["draft new release tag"](https://github.com/microsoft/playwright/releases/new).
1. Version starts with "v", e.g. "vX.Y.Z".
1. Fill "Browser versions".
    - `./utils/print_versions.js`
1. Fill "Highlights" if any.
    - Be creative.
1. Make sure you fetched tags from the upstream to get latest releases.
    - `git fetch --tags upstream`
1. Fill "New APIs" if any.
    - `git diff $(git describe --tags $(git rev-list --tags --max-count=1)):docs/api.md docs/api.md`
1. Fill "Breaking API Changes" if any.
    - `git diff $(git describe --tags $(git rev-list --tags --max-count=1)):docs/api.md docs/api.md`
1. Fill "Bug fixes".
    - `./utils/list_closed_issues.sh $(git describe --tags $(git rev-list --tags --max-count=1))`
1. Fill "Raw notes".
    - `git log --pretty="%h - %s" $(git describe --tags $(git rev-list --tags --max-count=1))..HEAD`

1. When making links to the API, copy actual links from [GitHub](https://github.com/microsoft/playwright/blob/master/docs/api.md), and not from `api.md` source - these might be incorrect.
    - Before publishing, replace `blob/master/docs` with `blob/vX.Y.Z/docs` in all the links.
1. Use "Save Draft", not "Publish".

# 3. Publish Release

1. Hit "publish release"

Once release is published, the [`publish_release`](../../.github/workflows/publish_release.yml) will kick in and publish package version on NPM.

