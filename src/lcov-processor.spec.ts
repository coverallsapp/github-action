import dedent from "dedent";
import { expect } from "chai";
import "mocha";
import { adjustLcovBasePath } from "./lcov-processor";


describe("adjustLcovBasePath", () => {
  // Taken from a real LCOV file but has been truncated to make it shorter for
  // a test so it isn't technically valid.
  const sampleLcov = dedent`
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
      const result = adjustLcovBasePath(sampleLcov, "./some/base/path");
      expect(result).to.equal(dedent`
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
      const result = adjustLcovBasePath(sampleLcov, "some/base/path");
      expect(result).to.equal(dedent`
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
      const result = adjustLcovBasePath(sampleLcov, "/some/base/path");
      expect(result).to.equal(dedent`
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
