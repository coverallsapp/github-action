# v1 -> v2

Notable changes:

- **v2** uses [universal coverage reporter](https://github.com/coverallsapp/coverage-reporter) instead of [node-coveralls](https://github.com/nickmerwin/node-coveralls) like in **v1**.

- Option `path-to-lcov` is now deprecated, use `file` instead.

- You can skip `file` option and coveralls will try to find all supported coverage files and combine their data.

