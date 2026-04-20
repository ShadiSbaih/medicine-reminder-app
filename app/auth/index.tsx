import { Ionicons } from "@expo/vector-icons";
import * as Device from "expo-device";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SkeuoTheme } from "../../constants/theme";

export default function AuthScreen() {
  const router = useRouter();
  const brandFade = useSharedValue(0);
  const brandScale = useSharedValue(0.8);
  const cardFade = useSharedValue(0);
  const cardTranslate = useSharedValue(16);

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const showDeveloperContinue = __DEV__ || !Device.isDevice;

  const brandAnimatedStyle = useAnimatedStyle(() => ({
    opacity: brandFade.value,
    transform: [{ scale: brandScale.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardFade.value,
    transform: [{ translateY: cardTranslate.value }],
  }));

  const checkBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setHasBiometrics(hasHardware && isEnrolled);
  };

  const authenticate = async () => {
    setIsAuthenticating(true);
    setError(null);

    try {
      // Check if device has biometric hardware
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const hasBiometrics = await LocalAuthentication.isEnrolledAsync();

      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage:
          hasHardware && hasBiometrics
            ? "Use Face ID or Touch ID"
            : "Enter your PIN to access Pillora",
        fallbackLabel: "Use PIN",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (auth.success) {
        setIsAuthenticating(false);
        router.replace("/home");
        return;
      } else {
        setError("Authentication failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    }

    setIsAuthenticating(false);
  };

  useEffect(() => {
    checkBiometrics();

    brandFade.value = withTiming(1, { duration: 600 });
    brandScale.value = withSpring(1, { damping: 12, stiffness: 180 });
    cardFade.value = withDelay(180, withTiming(1, { duration: 500 }));
    cardTranslate.value = withDelay(180, withTiming(0, { duration: 500 }));
  }, [brandFade, brandScale, cardFade, cardTranslate]);

  return (
    <LinearGradient
      colors={["#d9f1fb", "#bce6f6", "#edf7fc"]}
      style={styles.container}
    >
      <View style={styles.topRibbon} />
      <View style={styles.bottomShape} />
      <View style={styles.leftOrb} />
      <View style={styles.content}>
        <Animated.View style={[styles.brandContainer, brandAnimatedStyle]}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="medical"
              size={56}
              color={SkeuoTheme.colors.accent}
            />
          </View>

          <Text style={styles.brandName}>Pillora</Text>
          <Text style={styles.subtitle}>Your Medication Companion</Text>
        </Animated.View>

        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          <View style={styles.kickerRow}>
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={SkeuoTheme.colors.accent}
            />
            <Text style={styles.kicker}>Secure</Text>
          </View>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.instructionText}>
            {hasBiometrics
              ? "Verify your identity to continue"
              : "Enter PIN to continue"}
          </Text>

          <TouchableOpacity
            style={[styles.button, isAuthenticating && styles.buttonDisabled]}
            onPress={authenticate}
            disabled={isAuthenticating}
          >
            <Ionicons
              name={hasBiometrics ? "finger-print-outline" : "keypad-outline"}
              size={24}
              color="white"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>
              {isAuthenticating
                ? "Verifying..."
                : hasBiometrics
                  ? "Authenticate"
                  : "Enter PIN"}
            </Text>
          </TouchableOpacity>
          {showDeveloperContinue && (
            <TouchableOpacity
              style={{ marginTop: 20 }}
              onPress={() => router.push("/home")}
            >
              <Text style={{ marginTop: 12, color: SkeuoTheme.colors.accent }}>
                continue as developr
              </Text>
            </TouchableOpacity>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle"
                size={20}
                color={SkeuoTheme.colors.danger}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons
              name="lock-closed"
              size={14}
              color={SkeuoTheme.colors.textSecondary}
            />
            <Text style={styles.metaChipText}>Private & Secure</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topRibbon: {
    position: "absolute",
    top: -84,
    left: -90,
    right: -90,
    height: 250,
    backgroundColor: "rgba(15, 143, 174, 0.18)",
    borderBottomLeftRadius: 180,
    borderBottomRightRadius: 180,
  },
  bottomShape: {
    position: "absolute",
    bottom: -70,
    right: -80,
    width: 240,
    height: 220,
    borderRadius: 120,
    backgroundColor: "rgba(10, 110, 135, 0.16)",
  },
  leftOrb: {
    position: "absolute",
    bottom: 120,
    left: -64,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255, 255, 255, 0.26)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    width: 106,
    height: 106,
    backgroundColor: "rgba(255, 255, 255, 0.74)",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#c6dbe9",
    ...SkeuoTheme.shadow.outerSoft,
  },
  brandLogo: {
    width: 72,
    height: 72,
  },
  brandName: {
    marginTop: 4,
    fontSize: 36,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: SkeuoTheme.colors.textSecondary,
    marginBottom: 28,
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 30,
    padding: 22,
    width: "100%",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    ...SkeuoTheme.shadow.outer,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  kicker: {
    fontSize: 13,
    color: SkeuoTheme.colors.accent,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 14,
    color: SkeuoTheme.colors.textSecondary,
    textAlign: "left",
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    backgroundColor: SkeuoTheme.colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: SkeuoTheme.colors.dangerSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.dangerBorder,
  },
  errorText: {
    color: SkeuoTheme.colors.danger,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  metaRow: {
    marginTop: 12,
    width: "100%",
    gap: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.68)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#c6dbe9",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  metaChipText: {
    color: SkeuoTheme.colors.textSecondary,
    fontWeight: "600",
    fontSize: 13,
  },
});
