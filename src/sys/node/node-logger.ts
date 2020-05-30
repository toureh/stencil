import { createTerminalLogger, ColorType, TerminalLoggerSys } from '../shared/terminal-logger';
import ansiColor from 'ansi-colors';
import fs from 'graceful-fs';
import path from 'path';

export const createNodeLogger = (prcs: NodeJS.Process) => {
  const minColumns = 60;
  const maxColumns = 120;

  const color = (msg: string, colorType: ColorType) => (ansiColor as any)[colorType](msg);

  const emoji = (e: string) => (prcs.platform !== 'win32' ? e : '');

  const cwd = () => prcs.cwd();

  const getColumns = () => {
    const terminalWidth = (prcs.stdout && (prcs.stdout as any).columns) || 80;
    return Math.max(Math.min(maxColumns, terminalWidth), minColumns);
  };

  const memoryUsage = () => prcs.memoryUsage().rss;

  const relativePath = (from: string, to: string) => path.relative(from, to);

  const writeLogs = (logFilePath: string, log: string, append: boolean) => {
    if (append) {
      try {
        fs.accessSync(logFilePath);
      } catch (e) {
        append = false;
      }
    }

    if (append) {
      fs.appendFileSync(logFilePath, log);
    } else {
      fs.writeFileSync(logFilePath, log);
    }
  };

  const loggerSys: TerminalLoggerSys = {
    color,
    emoji,
    cwd,
    getColumns,
    memoryUsage,
    relativePath,
    writeLogs,
  };

  return createTerminalLogger(loggerSys);
};
