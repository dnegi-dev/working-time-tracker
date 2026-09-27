import { Capacitor } from '@capacitor/core';

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => matchMedia('(display-mode: standalone)').matches;

export const isNative = () => Capacitor.isNativePlatform();

/** True when running in the "real" app: iOS native app, or installed PWA on desktop. */
export function inAppContext(): boolean {
  return isNative() || (!isIOS() && standalone());
}

/**
 * Hand a command (or `open`) over to the installed app.
 * iOS → native app via `wtt://`; elsewhere → installed PWA via its `web+wtt://` protocol handler.
 * Returns false when the browser stayed visible (app missing) so the caller can fall back.
 */
export function redirectToApp(path: string, timeoutMs = 1500): Promise<boolean> {
  const url = `${isIOS() ? 'wtt' : 'web+wtt'}://${path}`;
  return new Promise((resolve) => {
    const done = (left: boolean) => {
      document.removeEventListener('visibilitychange', onHide);
      resolve(left);
    };
    const onHide = () => document.hidden && done(true);
    document.addEventListener('visibilitychange', onHide);
    setTimeout(() => done(document.hidden), timeoutMs);
    dispatchEvent(new CustomEvent('wtt:redirect', { detail: url })); // test hook
    location.href = url;
  });
}
