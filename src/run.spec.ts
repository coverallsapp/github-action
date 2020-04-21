import { run } from './run';

import * as core from '@actions/core'
const coveralls = require('coveralls');
const fs = require('fs');
const request = require('request');

import { expect } from 'chai';
import 'mocha';

const sinon = require('sinon');
const sandbox = sinon.createSandbox();
let getInput: any;

describe('Run', () => {

  afterEach(() => {
    sandbox.restore();
  });

  const setup = () => {
    getInput = sandbox.stub(core, 'getInput');
    getInput.withArgs('github-token').returns('v1.asdf');

    const flagName = 'flag';
    getInput.withArgs('flag-name').returns(flagName);

    process.env.GITHUB_RUN_ID = "1234567"
    process.env.GITHUB_SHA = "asdfasdf"
    process.env.GITHUB_REF = "master"
    process.env.GITHUB_EVENT_NAME = "pull_request"

    const eventPath = "event.json"
    process.env.GITHUB_EVENT_PATH = eventPath

    // set PR number:
    const readFileSync = sandbox.stub(fs,'readFileSync')
    readFileSync.withArgs(eventPath, 'utf8').returns(
      JSON.stringify({ number: 1 })
    )

    // stub Coveralls parsing lcov file:
    sandbox.stub(coveralls, 'handleInput').returns(true);

    const lcovPath = './coverage/lcov.info'
    getInput.withArgs('path-to-lcov').returns(lcovPath);

    getInput.withArgs('parallel').returns(1)
  }

  it('should run parallel', () => {
    setup();

    getInput.withArgs('parallel-finished').returns('');

    run().then(
      (result) => {
        expect(result).to.equal(0);
        // TODO: expect core.setOutput('coveralls-api-result', body)
      }
    );
  });

  it('should run parallel finished', () => {
    setup();

    getInput.withArgs('parallel-finished').returns(1);
    getInput.withArgs('coveralls-endpoint').returns('https://coveralls.io');

    sandbox.stub(request, 'post');

    run().then(
      (result) => {
        expect(result).to.equal(0);
      }
    );
  });

});
