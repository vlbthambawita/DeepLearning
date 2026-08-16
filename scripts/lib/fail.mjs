/**
 * These scripts are run by people at a terminal and by CI logs nobody scrolls,
 * so a wrong flag should print one clear line rather than a Node stack trace.
 */
export function installErrorHandler() {
  const report = (err) => {
    console.error(`\n✖ ${err?.message ?? err}`)
    process.exit(1)
  }
  process.on('uncaughtException', report)
  process.on('unhandledRejection', report)
}
