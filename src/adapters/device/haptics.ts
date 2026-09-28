import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import type { HapticKind } from '../../ports/index.ts';

const NATIVE: Record<HapticKind, () => Promise<void>> = {
  tick: () => Haptics.impact({ style: ImpactStyle.Light }),
  grab: () => Haptics.impact({ style: ImpactStyle.Medium }),
  success: () => Haptics.notification({ type: NotificationType.Success }),
  warning: () => Haptics.notification({ type: NotificationType.Warning }),
};

const WEB: Record<HapticKind, number | number[]> = {
  tick: 8,
  grab: 15,
  success: [12, 40, 18],
  warning: [30, 50, 30],
};

/** Short tactile feedback; silently does nothing where unsupported. */
export function haptic(native: boolean) {
  return (kind: HapticKind) => {
    if (native) void NATIVE[kind]().catch(() => undefined);
    else navigator.vibrate?.(WEB[kind]);
  };
}
