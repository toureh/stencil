import { createTerminalLogger, ColorType, TerminalLoggerSys } from '../shared/terminal-logger';
import type { Deno } from '../../../types/lib.deno';

export const createDenoLogger = (d: any) => {
  // let useColors = true;
  const deno: typeof Deno = d;
  const minColumns = 60;
  const maxColumns = 120;

  const color = (msg: string, _colorType: ColorType) => msg;

  const cwd = () => deno.cwd();

  const emoji = (e: string) => (deno.build.os !== 'windows' ? e : '');

  const enableColors = (_enableClr: boolean) => {
    // useColors = enableClr;
  };

  const getColumns = () => {
    const terminalWidth = (deno.stdout && (deno.stdout as any).columns) || 80;
    return Math.max(Math.min(maxColumns, terminalWidth), minColumns);
  };

  const memoryUsage = () => -1;

  const relativePath = (_from: string, to: string) => to;

  const writeLogs = (logFilePath: string, log: string, append: boolean) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(log);
    deno.writeFileSync(logFilePath, data, { append });
  };

  const loggerSys: TerminalLoggerSys = {
    color,
    cwd,
    emoji,
    enableColors,
    getColumns,
    memoryUsage,
    relativePath,
    writeLogs,
  };

  return createTerminalLogger(loggerSys);
};
