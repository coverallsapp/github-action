![logo](https://s3.amazonaws.com/assets.coveralls.io/coveralls_logotype-01.png)

# Coveralls GitHub Action

This GitHub Action posts your test suite's coverage data to [coveralls.io](https://coveralls.io/) for analysis, change tracking, and notifications. You don't need to add the repo to Coveralls first, it will be created when receiving the post.

When running on `pull_request` events, a comment will be added to the PR with details about how coverage will be affected if merged.

## Usage

This action's step needs to run after your test suite has outputted a coverage report file. Most major test runners can be configured to do so, very likely with the addition of a test coverage library, such as `simplecov` for `ruby`, `coverage.py` for `python`, or `istanbul` or `jest` for `javascript`, etc.

### Inputs:

| Name                         | Requirement | Description |
| ---------------------------- | ----------- | ----------- |
| `github-token`               | _required_ | Default if not specified: `${{ github.token }}`. Can also be specified this way: `github-token: ${{ secrets.GITHUB_TOKEN }}`; Coveralls uses this token to verify the appropriate repo at Coveralls and send any new status updates based on your coverage results. This variable is built into Github Actions, so __do not add it to your secrets store__. [More Info](https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token)|
| `file`                       | _optional_ | Default: all coverage files that could be found. Local path to the coverage report file produced by your test suite. An error will be thrown if no file was found. This is the file that will be sent to the Coveralls API. Leave empty if you want to combine many files reports. |
| `files`                      | _optional_ | Default: all coverage files that could be found. Space-separated list of coverage report files produced by your test suite. Example: `files: coverage/test1.lcov coverage/test2.lcov` |
| `format`                     | _optional_ | Force coverage report format. If not specified, coveralls will try to detect the format based on file extension and/or content. Possible values: `lcov`, `simplecov`, `cobertura`, `jacoco`, `gcov`, `golang`, `python`. See also [supported coverage report formats list](https://github.com/coverallsapp/coverage-reporter#supported-coverage-report-formats). |
| `flag-name`                  | _optional (unique required if parallel)_ | Job flag name, e.g. "Unit", "Functional", or "Integration". Will be shown in the Coveralls UI. |
| `build-number`               | _optional_ | Default: autodetected from CI. This should be the same for all jobs in a parallel build. Override this is useful if your CI tool assigns a different build number for each parallel build. |
| `parallel`                   | _optional_ | Set to true for parallel (or matrix) based steps, where multiple posts to Coveralls will be performed in the check. `flag-name` needs to be set and unique, e.g. `flag-name: run ${{ join(matrix.*, ' - ') }}` |
| `parallel-finished`          | _optional_ | Set to true in the last job, after the other parallel jobs steps have completed, this will send a webhook to Coveralls to set the build complete. |
| `carryforward`               | _optional_ | Comma-separated flags used to carry forward results from previous builds if some of the parallel jobs are missing. Used only with `parallel-finished`. |
| `coveralls-endpoint`         | _optional_ | Hostname and protocol: `https://<host>`; Specifies a [Coveralls Enterprise](https://enterprise.coveralls.io/) hostname. |
| `allow-empty`                | _optional_ | Default: `false`. Don't fail if coverage report is empty or contains no coverage data. |
| `base-path`                  | _optional_ | Path to the root folder of the project the coverage was collected in. Should be used in monorepos so that coveralls can process filenames from your coverage reports correctly (e.g. packages/my-subproject) |
| `git-branch`                 | _optional_ | Default: GITHUB_REF environment variable. Override the branch name. |
| `git-commit`                 | _optional_ | Default: GITHUB_SHA environment variable. Override the commit SHA. |
| `compare-ref`                | _optional_ | Branch name to compare coverage with. Specify if you want to always check coverage change for PRs against one branch. |
| `compare-sha`                | _optional_ | Commit SHA to compare coverage with. |
| `debug`                      | _optional_ | Default: `false`. Set to `true` to enable debug logging. |
| `measure`                    | _optional_ | Default: `false`. Set to `true` to enable time measurement logging. |
| `fail-on-error`              | _optional_ | Default: `true`. Set to `false` to avoid CI failure when upload fails due to any errors. |
| `coverage-reporter-version`  | _optional_ | Default: `latest`. Version of coverage-reporter to use. Make sure to prefix the version number with 'v'. For example: v0.6.9. Not available currently on macOS. |
| `coverage-reporter-platform` | _optional_ | Default: `auto-detect`. Platform of coverage-reporter to use on Linux runners. Supported values: `auto-detect`, `x86_64`, `aarch64`, or `arm64`. |

<!-- Leaving this here until we decide whether to bring back `coveralls-api-result` in v2 -->
<!-- Please submit any questions, suggestions, requests to: support@coveralls.io -->
<!-- ### Outputs: -->
<!-- * `coveralls-api-result`: JSON response from the Coveralls API with a status code and url for the Job on Coveralls. -->
<!-- // Leaving this here until we decide whether to bring back `coveralls-api-result` in v2 -->

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

    - uses: actions/checkout@v4

    - name: Install Node.js
      uses: actions/setup-node@v4
      with:
        node-version: lts/*

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
    - uses: actions/checkout@v4
    - name: Install Node.js
      uses: actions/setup-node@v4
      with:
        node-version: lts/*

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
7. The `pull_request` check runs, and the resulting coverage data triggers a `fail` status.
8. A detailed comment is posted.

## Troubleshooting:

### Coveralls comments aren't added to my pull request

Ensure that:

1. Your workflow invokes the Coveralls action that runs on pull requests, e.g.:

```yaml
on: ["push", "pull_request"]
```

2. You have invited the [@coveralls](https://github.com/coveralls) user to your repository with `Role: Write`
3. You have enabled the "LEAVE COMMENTS?" setting in the "Pull Request Alerts" area in your Repo Settings page inside the Coveralls app.

### Coveralls responds with "cannot find matching repository"

Ensure your workflow yaml line for the GitHub token matches *exactly*:

```yaml
github-token: ${{ secrets.GITHUB_TOKEN }}
```

---

## [MIT License](LICENSE.md)

## [Contributing](CONTRIBUTING.md)
