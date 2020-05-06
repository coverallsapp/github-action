import * as core from '@actions/core';

import fs from 'fs';
import path from 'path';
import request, { Response } from 'request';
import { adjustLcovBasePath } from './lcov-processor';

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

    if (process.env.COVERALLS_DEBUG) {
      console.log("Event Name: " + process.env.GITHUB_EVENT_NAME);
      console.log(event);
    }

    if (process.env.GITHUB_EVENT_NAME == 'pull_request') {
      process.env.CI_PULL_REQUEST = JSON.parse(event).number;
    }

    const endpoint = core.getInput('coveralls-endpoint');
    if (endpoint != '') {
      process.env.COVERALLS_ENDPOINT = endpoint;
    }

    const runId = process.env.GITHUB_RUN_ID;
    process.env.COVERALLS_SERVICE_JOB_ID = runId;

    if(core.getInput('parallel-finished') != '') {
      const payload = {
        "repo_token": githubToken,
        "repo_name": process.env.GITHUB_REPOSITORY,
        "payload": { "build_num": runId, "status": "done" }
      };

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

    const defaultPath = './coverage/lcov.info';
    const defaultType = 'lcov';

    const pathToFile = core.getInput('path-to-file');
    const pathToLcov = core.getInput('path-to-lcov');

    const formatInput = core.getInput('coverage-format');
    const filetype = formatInput !== defaultType ? formatInput : defaultType;

    if (filetype !== defaultType && filetype !== 'raw') {
      throw new Error(`Unsupported file format: ${filetype}`);
    }

    // for compatibility with the name path-to-lcov - go through these steps
    // 1. use 'path-to-file' if its not the default path
    // 2. use 'path-to-lcov' if its not the default
    // 3. use 'path-to-file' (which will be the default at this point in time - but i made it more explicit)
    const pathToUse = pathToFile !== defaultPath ? pathToFile : ((pathToLcov !== defaultPath) ? pathToLcov : pathToFile);
    if (pathToUse == '') {
        throw new Error("No file path specified.");
    }

    console.log(`Using ${filetype} file: ${pathToUse}`);

    let file;

    try {
      file = fs.readFileSync(pathToUse, 'utf8');
    } catch (err) {
      throw new Error(`${filetype} file not found.`);
    }

    const basePath = core.getInput('base-path');
    const adjustedFile = basePath ? adjustLcovBasePath(file, basePath) : file;

    if (filetype === 'raw') {
      coveralls.getOptions((err: string, options: any) => {
        if (err) {
          core.setFailed(err);
        }
    
        const postJson = JSON.parse(adjustedFile);
    
        if (options.flag_name) {
          postJson.flag_name = options.flag_name;
        }
        
        if (options.git) {
          postJson.git = options.git;
        }
    
        if (options.run_at) {
          postJson.run_at = options.run_at;
        }
    
        if (options.service_name) {
          postJson.service_name = options.service_name;
        }
        
        if (options.service_number) {
          postJson.service_number = options.service_number;
        }
        
        if (options.service_job_id) {
          postJson.service_job_id = options.service_job_id;
        }
    
        if (options.service_pull_request) {
          postJson.service_pull_request = options.service_pull_request;
        }
    
        if (options.repo_token) {
          postJson.repo_token = options.repo_token;
        }
    
        if (options.parallel) {
          postJson.parallel = options.parallel;
        }
        if (options.flag_name) {
          postJson.flag_name = options.flag_name;
        }

        coveralls.sendToCoveralls(postJson, (err: string, response: any, body: string) => {
          if (response.statusCode >= 400) {
            core.setFailed(`Bad response: ${response.statusCode} ${body}`);
          }
  
          if(err){
            core.setFailed(err);
          } else {
            core.setOutput('coveralls-api-result', body);
          }
        });
      });
    } else {
      coveralls.handleInput(adjustedFile, (err: string, body: string) => {
        if(err){
          core.setFailed(err);
        } else {
          core.setOutput('coveralls-api-result', body);
        }
      });
    }
  } catch (error) {
    core.setFailed(error.message);
  }

  return 0;
}
