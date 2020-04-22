![logo](https://s3.amazonaws.com/assets.coveralls.io/coveralls_logotype-01.png)

# Coveralls GitHub Action

This GitHub Action posts your test suite's LCOV coverage data to [coveralls.io](https://coveralls.io/) for analysis, change tracking, and notifications. You don't need to add the repo to Coveralls first, it will be created when receiving the post.

When running on `pull_request` events, a comment will be added to the PR with details about how coverage will be affected if merged.

## Usage

The action's step needs to run after your test suite has outputted an LCOV file. Most major test runners can be configured to do so; if you're using Node, see more info [here](https://github.com/nickmerwin/node-coveralls).

### Inputs:

| Name                  | Requirement | Description |
| --------------------- | ----------- | ----------- |
| `github-token`        | _required_ | Must be in form `github-token: ${{ secrets.GITHUB_TOKEN }}`; Coveralls uses this token to verify the posted coverage data on the repo and create a new check based on the results. It is built into Github Actions and does not need to be manually specified in your secrets store. [More Info](https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token)|
| `path-to-lcov`        | _optional_ | Default: "./coverage/lcov.info". Local path to the lcov output file produced by your test suite. An error will be thrown if the file can't be found. This is the file that will be sent to the Coveralls API. |
| `flag-name`           | _optional (unique required if parallel)_ | Job flag name, e.g. "Unit", "Functional", or "Integration". Will be shown in the Coveralls UI. |
| `parallel`            | _optional_ | Set to true for parallel (or matrix) based steps, where multiple posts to Coveralls will be performed in the check. `flag-name` needs to be set and unique, e.g. `flag-name: run-${{ matrix.test_number }}` |
| `parallel-finished`   | _optional_ | Set to true in the last job, after the other parallel jobs steps have completed, this will send a webhook to Coveralls to set the build complete. |
| `coveralls-endpoint`  | _optional_ | Hostname and protocol: `https://<host>`; Specifies a [Coveralls Enterprise](https://enterprise.coveralls.io/) hostname. |
| `base-path`           | _optional_ | Path to the root folder of the project the coverage was collected in. Should be used in monorepos so that coveralls can process the LCOV correctly (e.g. packages/my-project) |

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

    - uses: actions/checkout@v1

    - name: Use Node.js 10.x
      uses: actions/setup-node@v1
      with:
        node-version: 10.x

    - name: npm install, make test-coverage
      run: |
        npm install
        make test-coverage

    - name: Coveralls
      uses: coverallsapp/github-action@master
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
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
    - uses: actions/checkout@master
    - name: Use Node.js 10.x
      uses: actions/setup-node@master
      with:
        version: 10.x

    - name: npm install
      run: npm install

    - name: Test ${{ matrix.test_number }}
      run: make test-coverage-${{ matrix.test_number }}
    - name: Coveralls Parallel
      uses: coverallsapp/github-action@master
      with:
        github-token: ${{ secrets.github_token }}
        flag-name: run-${{ matrix.test_number }}
        parallel: true

  finish:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - name: Coveralls Finished
      uses: coverallsapp/github-action@master
      with:
        github-token: ${{ secrets.github_token }}
        parallel-finished: true
```

The "Coveralls Finished" step needs to run after all other steps have completed; it will let Coveralls know that all jobs in the build are done and aggregate coverage calculation can be calculated and notifications sent.

## Demo

![demo](https://s3.amazonaws.com/assets.coveralls.io/Coveralls%20Github%20Action%20Demo%20-%20trimmed%20-%204.8x720.gif)

### Steps shown:

1. A new function `f` without test coverage is added.
2. The changes are committed and pushed to a new branch "function/f"
3. The Action runs on GitHub CI.
4. The commit on GitHub shows a new check for Coveralls with details "First build on function-f at 92.0%", and links to the Job on Coveralls.
5. Line-by-line results indicate the new function is missing coverage.
6. Create a pull request with the new branch.
7. The `pull_request` check runs and the resulting coverage data triggers a `fail` status.
8. A detailed comment is posted.

## Troubleshooting:

### Coveralls comments aren't added to my pull request

Ensure your workflow that invokes the Coveralls action runs on pull requests, e.g.:

```yaml
on: ["push", "pull_request"]
```

### Coveralls responds with "cannot find matching repository"

Ensure your workflow yaml line for the GitHub token matches *exactly*:

```yaml
github-token: ${{ secrets.GITHUB_TOKEN }}
```

---

## [MIT License](LICENSE.md)

## [Contributing](CONTRIBUTING.md)
