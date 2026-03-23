import * as Haptics from "expo-haptics";

export async function triggerLightHaptic(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics can fail silently on unsupported devices.
  }
}
