const R = "\x1b[0m";
const C = { info: "\x1b[36m", ok: "\x1b[32m", warn: "\x1b[33m", err: "\x1b[31m", dim: "\x1b[2m", bold: "\x1b[1m" };

function ts() {
  return new Date().toISOString().replace("T", " ").slice(0, 23);
}

export const log = {
  info:  (msg: string, ...a: unknown[]) =>
    console.log(`${C.dim}${ts()}${R} ${C.info}INFO ${R} ${msg}`, ...a),
  ok:    (msg: string, ...a: unknown[]) =>
    console.log(`${C.dim}${ts()}${R} ${C.ok} OK   ${R} ${msg}`, ...a),
  warn:  (msg: string, ...a: unknown[]) =>
    console.warn(`${C.dim}${ts()}${R} ${C.warn}WARN ${R} ${msg}`, ...a),
  error: (msg: string, ...a: unknown[]) =>
    console.error(`${C.dim}${ts()}${R} ${C.err}ERROR${R} ${msg}`, ...a),
};
