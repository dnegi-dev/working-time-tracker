import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type HapticKind = 'tick' | 'success';

/** Short tactile feedback; silently does nothing where unsupported. */
export function haptic(native: boolean) {
  return (kind: HapticKind) => {
    if (native) {
      const done =
        kind === 'tick'
          ? Haptics.impact({ style: ImpactStyle.Light })
          : Haptics.notification({ type: NotificationType.Success });
      void done.catch(() => undefined);
    } else {
      navigator.vibrate?.(kind === 'tick' ? 8 : [12, 40, 18]);
    }
  };
}
