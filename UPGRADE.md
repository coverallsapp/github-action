# v1 -> v2

## Notable changes

- **v2** uses [universal coverage reporter](https://github.com/coverallsapp/coverage-reporter) instead of [node-coveralls](https://github.com/nickmerwin/node-coveralls) like in **v1**.

## Upgrading

- Option `path-to-lcov` is now deprecated, use `file` instead.

- You can skip `file` option and coveralls will try to find all supported coverage files and combine their data.

- If coveralls fails to determine your coverage report format, use explicit `format` option to specify it. See [supported values](https://github.com/coverallsapp/coverage-reporter#supported-coverage-report-formats).

- If you see a message `Nothing to report` it might be a path resolution issue. Check filenames in the coverage report and use `base-path` option to adjust paths to the source files.
