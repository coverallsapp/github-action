"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dedent_1 = __importDefault(require("dedent"));
const chai_1 = require("chai");
require("mocha");
const lcov_processor_1 = require("./lcov-processor");
describe("adjustLcovBasePath", () => {
    // Taken from a real LCOV file but has been truncated to make it shorter for
    // a test so it isn't technically valid.
    const sampleLcov = dedent_1.default `
        TN:
        SF:/src/codecs.ts
        FN:14,(anonymous_0)
        FN:15,(anonymous_1)
        BRH:2
        end_of_record
        TN:
        SF:/src/default-handlers.ts
        FN:12,(anonymous_0)
        BRF:0
        BRH:0
        end_of_record
        TN:
        SF:/src/index.ts
        FN:52,(anonymous_15)
        BRF:14
        BRH:14
        end_of_record
    `;
    describe("when using a relative base path with leading dot", () => {
        it("should transform base paths correctly", () => {
            const result = lcov_processor_1.adjustLcovBasePath(sampleLcov, "./some/base/path");
            chai_1.expect(result).to.equal(dedent_1.default `
        TN:
        SF:some/base/path/src/codecs.ts
        FN:14,(anonymous_0)
        FN:15,(anonymous_1)
        BRH:2
        end_of_record
        TN:
        SF:some/base/path/src/default-handlers.ts
        FN:12,(anonymous_0)
        BRF:0
        BRH:0
        end_of_record
        TN:
        SF:some/base/path/src/index.ts
        FN:52,(anonymous_15)
        BRF:14
        BRH:14
        end_of_record
    `);
        });
    });
    describe("when using a relative base path without leading dot", () => {
        it("should transform base paths correctly", () => {
            const result = lcov_processor_1.adjustLcovBasePath(sampleLcov, "some/base/path");
            chai_1.expect(result).to.equal(dedent_1.default `
        TN:
        SF:some/base/path/src/codecs.ts
        FN:14,(anonymous_0)
        FN:15,(anonymous_1)
        BRH:2
        end_of_record
        TN:
        SF:some/base/path/src/default-handlers.ts
        FN:12,(anonymous_0)
        BRF:0
        BRH:0
        end_of_record
        TN:
        SF:some/base/path/src/index.ts
        FN:52,(anonymous_15)
        BRF:14
        BRH:14
        end_of_record
    `);
        });
    });
    describe("when using an absolute base path with leading dot", () => {
        it("should transform base paths correctly", () => {
            const result = lcov_processor_1.adjustLcovBasePath(sampleLcov, "/some/base/path");
            chai_1.expect(result).to.equal(dedent_1.default `
        TN:
        SF:/some/base/path/src/codecs.ts
        FN:14,(anonymous_0)
        FN:15,(anonymous_1)
        BRH:2
        end_of_record
        TN:
        SF:/some/base/path/src/default-handlers.ts
        FN:12,(anonymous_0)
        BRF:0
        BRH:0
        end_of_record
        TN:
        SF:/some/base/path/src/index.ts
        FN:52,(anonymous_15)
        BRF:14
        BRH:14
        end_of_record
    `);
        });
    });
});
