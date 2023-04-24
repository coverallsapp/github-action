![logo](https://s3.amazonaws.com/assets.coveralls.io/coveralls_logotype-01.png)

> The new version **`coverallsapp/github-action@v2`** is now available! :partying_face:
>
> It is a [pre-release](https://github.com/coverallsapp/github-action/releases/tag/v2) but will become the main supported version soon. It uses [coverage-reporter](https://github.com/coverallsapp/coverage-reporter) which supports all existing features + **more coverage formats support**. You can check the list of supported formats [here](https://github.com/coverallsapp/coverage-reporter#supported-coverage-report-formats).
>
> See [UPGRADE.md](https://github.com/coverallsapp/github-action/blob/release/v2/UPGRADE.md#v1---v2).

# Coveralls GitHub Action

This GitHub Action posts your test suite's LCOV coverage data to [coveralls.io](https://coveralls.io/) for analysis, change tracking, and notifications. You don't need to add the repo to Coveralls first, it will be created when receiving the post.

When running on `pull_request` events, a comment will be added to the PR with details about how coverage will be affected if merged.

## Usage

The action's step needs to run after your test suite has outputted an LCOV file. Most major test runners can be configured to do so; if you're using Node, see more info [here](https://github.com/nickmerwin/node-coveralls).

### Inputs:

| Name                  | Requirement | Description |
| --------------------- | ----------- | ----------- |
| `github-token`        | _optional_ | Default: `${{ github.token }}`. Can be also used this way: `github-token: ${{ secrets.GITHUB_TOKEN }}`; Coveralls uses this token to verify the posted coverage data on the repo and create a new check based on the results. It is built into Github Actions and does not need to be manually specified in your secrets store. [More Info](https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token)|
| `path-to-lcov`        | _optional_ | Default: "./coverage/lcov.info". Local path to the lcov output file produced by your test suite. An error will be thrown if the file can't be found. This is the file that will be sent to the Coveralls API. |
| `flag-name`           | _optional (unique required if parallel)_ | Job flag name, e.g. "Unit", "Functional", or "Integration". Will be shown in the Coveralls UI. |
| `parallel`            | _optional_ | Set to true for parallel (or matrix) based steps, where multiple posts to Coveralls will be performed in the check. `flag-name` needs to be set and unique, e.g. `flag-name: run ${{ join(matrix.*, ' - ') }}` |
| `parallel-finished`   | _optional_ | Set to true in the last job, after the other parallel jobs steps have completed, this will send a webhook to Coveralls to set the build complete. |
| `carryforward`        | _optional_ | Comma separated flags used to carryforward results from previous builds if some of the parallel jobs are missing. Used only with `parallel-finished`. |
| `coveralls-endpoint`  | _optional_ | Hostname and protocol: `https://<host>`; Specifies a [Coveralls Enterprise](https://enterprise.coveralls.io/) hostname. |
| `base-path`           | _optional_ | Path to the root folder of the project the coverage was collected in. Should be used in monorepos so that coveralls can process the LCOV correctly (e.g. packages/my-project) |
| `git-branch`          | _optional_ | Default: GITHUB_REF environment variable. Override the branch name. |
| `git-commit`          | _optional_ | Default: GITHUB_SHA environment variable. Override the commit SHA. |
| `debug`               | _optional_ | Default: `false`. Set to `true` to enable debug logging. |

### Outputs:

* `coveralls-api-result`: JSON response from the Coveralls API with a status code and url for the Job on Coveralls.

### Standard Example:

* This example assumes you're building a Node project using the command `make test-coverage`, demo here: [nickmerwin/node-coveralls](https://github.com/nickmerwin/node-coveralls)

```yaml
on: ["push", "pull_request"]

name: Test Coveralls

jobs:

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:

    - uses: actions/checkout@v3

    - name: Use Node.js 16.x
      uses: actions/setup-node@v3
      with:
        node-version: 16.x

    - name: npm install, make test-coverage
      run: |
        npm install
        make test-coverage

    - name: Coveralls
      uses: coverallsapp/github-action@v2
```

### Complete Parallel Job Example:

```yaml
on: ["push", "pull_request"]

name: Test Coveralls Parallel

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test_number:
          - 1
          - 2
    steps:
    - uses: actions/checkout@3
    - name: Use Node.js 16.x
      uses: actions/setup-node@3
      with:
        node-version: 16.x

    - name: npm install
      run: npm install

    - name: Test ${{ matrix.test_number }}
      run: make test-coverage-${{ matrix.test_number }}
    - name: Coveralls Parallel
      uses: coverallsapp/github-action@v2
      with:
        flag-name: run-${{ join(matrix.*, '-') }}
        parallel: true

  finish:
    needs: test
    if: ${{ always() }}
    runs-on: ubuntu-latest
    steps:
    - name: Coveralls Finished
      uses: coverallsapp/github-action@v2
      with:
        parallel-finished: true
        carryforward: "run-1,run-2"
```

The "Coveralls Finished" step needs to run after all other steps have completed; it will let Coveralls know that all jobs in the build are done and aggregate coverage calculation can be calculated and notifications sent.

## Demo

![demo](https://s3.amazonaws.com/assets.coveralls.io/Coveralls%20Github%20Action%20Demo%20-%20trimmed%20-%204.8x720.gif)

### Steps shown:

1. A new function `f` without test coverage is added.
2. The changes are committed and pushed to a new branch "function/f"
3. The workflow runs on GitHub Actions.
4. The commit on GitHub shows a new check for Coveralls with details "First build on function-f at 92.0%", and links to the Job on Coveralls.
5. Line-by-line results indicate the new function is missing coverage.
6. Create a pull request with the new branch.
7. The `pull_request` check runs and the resulting coverage data triggers a `fail` status.
8. A detailed comment is posted.

## Troubleshooting:

### Coveralls comments aren't added to my pull request

Ensure that:

1. Your workflow invokes the Coveralls action runs on pull requests, e.g.:

```yaml
on: ["push", "pull_request"]
```

2. You have invited the [@coveralls](https://github.com/coveralls) user to your repository as a collaborator
3. You have enabled the "LEAVE COMMENTS?" setting in the "Pull Request Alerts" area in your Repo Settings page inside the Coveralls app.

### Coveralls responds with "cannot find matching repository"

Ensure your workflow yaml line for the GitHub token matches *exactly*:

```yaml
github-token: ${{ secrets.GITHUB_TOKEN }}
```

---

## [MIT License](LICENSE.md)

## [Contributing](CONTRIBUTING.md)
