#!/usr/bin/env bash

download() {
  [[ "$COVERALLS_DEBUG" == "true" ]] && set -x
  if [[ "$RUNNER_OS" == "macOS" ]]
  then
    brew tap coverallsapp/coveralls
    brew install coveralls
  elif [[ "$RUNNER_OS" == "Windos" ]]
  then
    # TODO: Add a step for windows
  else
    curl -L https://coveralls.io/coveralls-linux.tar.gz | tar xz -C /usr/local/bin
  fi
  [[ "$COVERALLS_DEBUG" == "true" ]] && set +x
}

call() {
  if [[ -n $COVERALLS__DONE ]]; then
    coveralls --done
  else
    local args=""
    [[ -n $COVERALLS__FILE ]] && args="$args --file $COVERALLS__FILE"
    [[ -n $COVERALLS__BASE_PATH ]] && args="$args --base-path $COVERALLS__BASE_PATH"
    [[ "$COVERALLS_DEBUG" == "true" ]] && args="$args --debug"

    coveralls $args
  fi
}

if [[ -n $1 ]]
then
  $1
else
  download
  call
fi
