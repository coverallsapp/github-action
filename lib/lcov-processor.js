"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustLcovBasePath = void 0;
const path_1 = __importDefault(require("path"));
/**
 * Adjusts the base path of all the paths in an LCOV file
 * The paths in the LCOV file will be joined with the provided base path
 * @param lcovFile a string containing an entire LCOV file
 * @param basePath the base path to join with the LCOV file paths
 */
exports.adjustLcovBasePath = (lcovFile, basePath) => lcovFile.replace(/^SF:(.+)$/gm, (_, match) => `SF:${path_1.default.join(basePath, match)}`);
