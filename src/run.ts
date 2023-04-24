import * as core from '@actions/core';

import fs from 'fs';
import path from 'path';
import request, { Response } from 'request';
import { adjustLcovBasePath } from './lcov-processor';

process.env.NODE_COVERALLS_DEBUG = (
  process.env.COVERALLS_DEBUG == 'true' ||
    process.env.COVERALLS_DEBUG == '1' ||
    core.getInput('debug') == 'true'
) ? '1' : '';

const coveralls = require('coveralls');

interface WebhookResult {
    canceled: boolean;
    done: boolean;
    errored: boolean;
}

export async function run() {
  try {
    const githubToken = core.getInput('github-token');

    if (!githubToken || githubToken == '') {
      throw new Error("'github-token' input missing, please include it in your workflow settings 'with' section as 'github-token: ${{ secrets.github_token }}'");
    }

    process.env.COVERALLS_REPO_TOKEN = githubToken;

    process.env.COVERALLS_SERVICE_NAME = 'github';
    process.env.COVERALLS_GIT_COMMIT = process.env.GITHUB_SHA!.toString();
    process.env.COVERALLS_GIT_BRANCH = process.env.GITHUB_REF!.toString();
    process.env.COVERALLS_FLAG_NAME = process.env.COVERALLS_FLAG_NAME || core.getInput('flag-name');

    const event = fs.readFileSync(process.env.GITHUB_EVENT_PATH!, 'utf8');

    if (process.env.NODE_COVERALLS_DEBUG) {
      console.log("Event Name: " + process.env.GITHUB_EVENT_NAME);
      console.log(event);
    }

    const gitCommit = core.getInput('git-commit');
    const gitBranch = core.getInput('git-branch');

    if (gitCommit && gitCommit != '') {
      process.env.COVERALLS_GIT_COMMIT = gitCommit;
    }

    if (gitBranch && gitBranch != '') {
      process.env.COVERALLS_GIT_BRANCH = gitBranch;
    }

    if (process.env.GITHUB_EVENT_NAME == 'pull_request' || process.env.GITHUB_EVENT_NAME == 'pull_request_target') {
      process.env.CI_PULL_REQUEST = JSON.parse(event).number;
    }

    const endpoint = core.getInput('coveralls-endpoint');
    if (endpoint != '') {
      process.env.COVERALLS_ENDPOINT = endpoint;
    }

    const runId = process.env.COVERALLS_SERVICE_JOB_ID ? process.env.COVERALLS_SERVICE_JOB_ID : process.env.GITHUB_RUN_ID;
    process.env.COVERALLS_SERVICE_JOB_ID = runId;

    const carryforward = core.getInput('carryforward');
    if (carryforward != '') {
      process.env.COVERALLS_CARRYFORWARD_FLAGS = carryforward;
    }

    if(core.getInput('parallel-finished') != '') {
      const payload = {
        "repo_token": githubToken,
        "carryforward": process.env.COVERALLS_CARRYFORWARD_FLAGS,
        "repo_name": process.env.GITHUB_REPOSITORY,
        "payload": { "build_num": runId, "status": "done" }
      };
      console.log('Sending to coveralls', payload);
      request.post({
        url: `${process.env.COVERALLS_ENDPOINT || 'https://coveralls.io'}/webhook`,
        body: payload,
        json: true
      }, (error: string, _response: Response, data: WebhookResult) => {
          if (error) {
            throw new Error(error);
          }
          try {
            if (data.done) {
              core.setOutput('coveralls-api-result', JSON.stringify(data));
            } else {
              throw new Error(JSON.stringify(data));
            }
          } catch(err) {
            throw new Error('Parallel webhook error:' + err + ', ' + JSON.stringify(data));
          }
        }
      )
      return 0;
    }

    process.env.COVERALLS_PARALLEL = process.env.COVERALLS_PARALLEL || core.getInput('parallel');

    const pathToLcov = core.getInput('path-to-lcov');

    if (pathToLcov == '') {
      throw new Error("No Lcov path specified.");
    }

    console.log(`Using lcov file: ${pathToLcov}`);

    const file = fs.readFileSync(pathToLcov, 'utf8');
    const basePath = core.getInput('base-path');
    const adjustedFile = basePath ? adjustLcovBasePath(file, basePath) : file;

    coveralls.handleInput(adjustedFile, (err: string, body: string) => {
      if(err){
        core.setFailed(err);
      } else {
        core.setOutput('coveralls-api-result', body);
      }
    });

  } catch (error) {
    core.setFailed(error.message);
  }

  return 0;
}
