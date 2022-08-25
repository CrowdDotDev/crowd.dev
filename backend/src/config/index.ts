/**
 * This method returns the server config.
 * By default, it returns the Environment Variables.
 */
export function getConfig(): any {
  return process.env
}
