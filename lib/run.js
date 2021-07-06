"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const core = __importStar(require("@actions/core"));
const fs_1 = __importDefault(require("fs"));
const request_1 = __importDefault(require("request"));
const lcov_processor_1 = require("./lcov-processor");
const coveralls = require('coveralls');
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const githubToken = core.getInput('github-token');
            if (!githubToken || githubToken == '') {
                throw new Error("'github-token' input missing, please include it in your workflow settings 'with' section as 'github-token: ${{ secrets.github_token }}'");
            }
            process.env.COVERALLS_REPO_TOKEN = githubToken;
            process.env.COVERALLS_SERVICE_NAME = 'github';
            process.env.COVERALLS_GIT_COMMIT = process.env.GITHUB_SHA.toString();
            process.env.COVERALLS_GIT_BRANCH = process.env.GITHUB_REF.toString();
            process.env.COVERALLS_FLAG_NAME = process.env.COVERALLS_FLAG_NAME || core.getInput('flag-name');
            const event = fs_1.default.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8');
            if (process.env.COVERALLS_DEBUG) {
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
            const runId = process.env.GITHUB_RUN_ID;
            process.env.COVERALLS_SERVICE_JOB_ID = runId;
            if (core.getInput('parallel-finished') != '') {
                const payload = {
                    "repo_token": githubToken,
                    "repo_name": process.env.GITHUB_REPOSITORY,
                    "payload": { "build_num": runId, "status": "done" }
                };
                request_1.default.post({
                    url: `${process.env.COVERALLS_ENDPOINT || 'https://coveralls.io'}/webhook`,
                    body: payload,
                    json: true
                }, (error, _response, data) => {
                    if (error) {
                        throw new Error(error);
                    }
                    try {
                        if (data.done) {
                            core.setOutput('coveralls-api-result', JSON.stringify(data));
                        }
                        else {
                            throw new Error(JSON.stringify(data));
                        }
                    }
                    catch (err) {
                        throw new Error('Parallel webhook error:' + err + ', ' + JSON.stringify(data));
                    }
                });
                return 0;
            }
            process.env.COVERALLS_PARALLEL = process.env.COVERALLS_PARALLEL || core.getInput('parallel');
            const pathToLcov = core.getInput('path-to-lcov');
            if (pathToLcov == '') {
                throw new Error("No Lcov path specified.");
            }
            console.log(`Using lcov file: ${pathToLcov}`);
            let file;
            try {
                file = fs_1.default.readFileSync(pathToLcov, 'utf8');
            }
            catch (err) {
                throw new Error("Lcov file not found.");
            }
            const basePath = core.getInput('base-path');
            const adjustedFile = basePath ? lcov_processor_1.adjustLcovBasePath(file, basePath) : file;
            coveralls.handleInput(adjustedFile, (err, body) => {
                if (err) {
                    core.setFailed(err);
                }
                else {
                    core.setOutput('coveralls-api-result', body);
                }
            });
        }
        catch (error) {
            core.setFailed(error.message);
        }
        return 0;
    });
}
exports.run = run;
