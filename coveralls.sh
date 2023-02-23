#!/usr/bin/env bash

download() {
  set -x
  # TODO: Determine the download way by RUNNER_OS
  curl -L https://coveralls.io/coveralls-linux.tar.gz | tar xz
  set +x
}

call() {
  if [[ -n $COVERALLS__DONE ]]; then
    ./coveralls --done
  else
    local args=""
    [[ -n $COVERALLS__FILE ]] && args="$args --file $COVERALLS__FILE"
    [[ -n $COVERALLS__BASE_PATH ]] && args="$args --base-path $COVERALLS__BASE_PATH"

    ./coveralls $args
  fi
}

if [[ -n $1 ]]
then
  $1
else
  download
  call
fi
