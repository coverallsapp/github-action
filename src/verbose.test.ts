import { run } from './run';

import * as core from '@actions/core'
const coveralls = require('coveralls');
const fs = require('fs');

import 'mocha';
import { expect } from 'chai';

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

describe('Run', () => {

  let getInputStub: any,
      coverallsHandleInputStub: any;

  afterEach(() => {
    sandbox.restore();
  });

  const setup = () => {
    getInputStub = sandbox.stub(core, 'getInput');
    getInputStub.withArgs('github-token').returns('v1.asdf');

    const flagName = 'flag';
    getInputStub.withArgs('flag-name').returns(flagName);

    const lcovPath = './coverage/lcov.info'
    getInputStub.withArgs('path-to-lcov').returns(lcovPath);

    getInputStub.withArgs('parallel').returns(1)
    getInputStub.withArgs('parallel-finished').returns('');

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
    coverallsHandleInputStub = sandbox.stub(coveralls, 'handleInput').returns(true);
    sinon.stub(console, 'log');
    coverallsHandleInputStub.callThrough();
    sinon.stub(coveralls, 'convertLcovToCoveralls');
  }

  it(`should set verbose logging when with verbose true`, async function () {
    setup();

    await run();

    expect((console.log as any).getCall(2).args[0]).to.contain('[debug]');
  });
});
