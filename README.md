# Coveralls Github Action

This Github Action posts your test suite's LCOV coverage data to [coveralls.io](https://coveralls.io) for analysis, change tracking, and notifications.

When running on "pull_request" events, a comment will be added to the PR with details about how coverage will be affected if merged.

## Usage

This step needs to run after your test suite has outputted an LCOV file. Most major test runners can be configured to do so; if you're using Node, see more info [here](https://github.com/nickmerwin/node-coveralls).

The `github-token` input is required so Coveralls can verify the repo and create a new check based on the coverage results.

### Standard Example:

```yaml
- name: Coveralls
  uses: coveralls-app/github-action
  with:
    github-token: ${{ secrets.github_token }}
    path-to-lcov: ./coverage/lcov.info # optional (default value)
```

If `path-to-lcov` is omitted, "./coverage/lcov.info" will be used by default. An error will be thrown if the file is missing.

### Complete Parallel Job Example:

```yaml
  on: ["push","pull_request"]

  name: Test Coveralls

  jobs:

    build:
      name: Build
      runs-on: ubuntu-latest
      steps:

      - uses: actions/checkout@master

      - name: Use Node.js 10.x
        uses: actions/setup-node@master
        with:
          version: 10.x

      - name: npm install, make test-coverage
        run: |
          npm install
          make test-coverage

      - name: Coveralls Parallel
        uses: coveralls-app/github-action
        with:
          github-token: ${{ secrets.github_token }}
          parallel: true
          path-to-lcov: ./coverage/lcov.info # optional (default value)

      - name: Coveralls Finished
        uses: coveralls-app/github-action
        with:
          github-token: ${{ secrets.github_token }}
          parallel-finished: true
```

The "Coveralls Finished" step needs to run after all other steps have completed.

For [Coveralls Enterprise](https://enterprise.coveralls.io) usage, include the input `coveralls-endpoint: https://<host>`.

## License

[MIT License](LICENSE)
