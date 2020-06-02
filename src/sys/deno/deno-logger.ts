import { createTerminalLogger, ColorType, TerminalLoggerSys } from '../shared/terminal-logger';

export const createDenoLogger = (Deno: any) => {
  let useColors = true;
  const minColumns = 60;
  const maxColumns = 120;

  const color = (msg: string, _colorType: ColorType) => msg;

  const cwd = () => Deno.cwd();

  const emoji = (e: string) => (Deno.build.os !== 'windows' ? e : '');

  const enableColors = (enableClr: boolean) => {
    Deno.noColor = !enableClr;
    useColors = enableClr;
  };

  const getColumns = () => {
    const terminalWidth = (Deno.stdout && (Deno.stdout as any).columns) || 80;
    return Math.max(Math.min(maxColumns, terminalWidth), minColumns);
  };

  const memoryUsage = () => -1;

  const relativePath = (_from: string, to: string) => to;

  const writeLogs = (logFilePath: string, log: string, append: boolean) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(log);
    Deno.writeFileSync(logFilePath, data, { append });
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
