export const Logger = {
  debug: (message: string, ...args: any[]) => {
    console.log(`\x1b[36mDebug:\x1b[0m ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    console.log(`\x1b[32mInfo:\x1b[0m ${message}`, ...args);
  },
  warning: (message: string, ...args: any[]) => {
    console.warn(`\x1b[33mWarning:\x1b[0m ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`\x1b[31mError:\x1b[0m ${message}`, ...args);
  }
};
