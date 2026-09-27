export function commandPath(cmd: string, params: Record<string, string | undefined> = {}): string {
  const q = new URLSearchParams(
    Object.entries(params).filter((e): e is [string, string] => !!e[1]),
  );
  return q.size ? `${cmd}?${q}` : cmd;
}

/** The same command as native deep link (iOS app) and as web link (PWA / browser). */
export function commandLinks(
  cmd: string,
  params: Record<string, string | undefined>,
  webBase: string,
) {
  const path = commandPath(cmd, params);
  return { native: `wtt://${path}`, web: `${webBase}#/do/${path}` };
}
