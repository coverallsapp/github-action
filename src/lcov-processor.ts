
import path from 'path';

/**
 * Adjusts the base path of all the paths in an LCOV file
 * The paths in the LCOV file will be joined with the provided base path
 * @param lcovFile a string containing an entire LCOV file
 * @param basePath the base path to join with the LCOV file paths
 */
export const adjustLcovBasePath = (lcovFile: string, basePath: string) =>
    lcovFile.replace(/^SF:(.+)$/gm, (_, match) => `SF:${path.join(basePath, match)}`)