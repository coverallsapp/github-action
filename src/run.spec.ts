import { run } from './run';

import * as core from '@actions/core'
const coveralls = require('coveralls');
const fs = require('fs');
const request = require('request');

import { expect } from 'chai';
import 'mocha';

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
  }

  it('should set github output after a successful handleInput', async () => {
    const data = 'success';
    setup();

    getInputStub.withArgs('parallel-finished').returns('');

    const setOutputStub = sandbox.stub(core, 'setOutput');
    coverallsHandleInputStub.callsFake(function(filePath: any, cb: any) {
      cb(null, data);
    });

    const result = await run();
    expect(result).to.equal(0);
    sinon.assert.calledOnce(setOutputStub);
    sinon.assert.calledWith(setOutputStub, 'coveralls-api-result', data);
  });

  it('should set github output if parallel finished webhook returned successfuly', async () => {
    setup();

    const data = {
      done: true
    };
    getInputStub.withArgs('parallel-finished').returns(1);
    getInputStub.withArgs('coveralls-endpoint').returns('https://coveralls.io');

    const setOutputStub = sandbox.stub(core, 'setOutput');
    sandbox.stub(request, 'post').callsFake(function(postCfg: any, cb: any) {
      cb(null, {}, data);
    });

    const result = await run();
    expect(result).to.equal(0);
    sinon.assert.calledOnce(setOutputStub);
    sinon.assert.calledWith(setOutputStub, 'coveralls-api-result', JSON.stringify(data));
  });

  it(`should throw an error if parallel finished webhook returned an error`, async function () {
    setup();

    const data = {
      done: true
    };
    getInputStub.withArgs('parallel-finished').returns(1);
    getInputStub.withArgs('coveralls-endpoint').returns('https://coveralls.io');

    sandbox.stub(request, 'post').callsFake(function(postCfg: any, cb: any) {
      cb('error', {}, data);
    });

    const result = await run();
    expect(result).to.not.equal(0);
  });

  it(`should setFailed if no token is given`, async function () {
    setup();
    getInputStub.withArgs('github-token').returns('');
    const setFailedStub = sinon.stub(core, 'setFailed');
    const errorMessage = `'github-token' input missing, please include it in your workflow settings 'with' section as 'github-token: \${{ secrets.github_token }}'`;

    const result = await run();

    sinon.assert.calledOnce(setFailedStub);
    sinon.assert.calledWith(setFailedStub, errorMessage);
  });

  it(`should set verbose logging when with verbose true`, async function () {
    setup();
    getInputStub.withArgs('verbose').returns(true);
    getInputStub.withArgs('parallel-finished').returns('');
    await run();
    expect(coveralls.logger().level).to.equal('debug');
  });
});
