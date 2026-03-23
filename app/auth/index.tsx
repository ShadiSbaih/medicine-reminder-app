import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SkeuoTheme } from "../../constants/theme";

const { width } = Dimensions.get("window");

export default function AuthScreen() {
  const router = useRouter();
  const brandFadeAnim = useState(new Animated.Value(0))[0];
  const brandScaleAnim = useState(new Animated.Value(0.8))[0];
  const cardFadeAnim = useState(new Animated.Value(0))[0];
  const cardTranslateAnim = useState(new Animated.Value(16))[0];

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBiometrics, setHasBiometrics] = useState(false);

  const checkBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setHasBiometrics(hasHardware && isEnrolled);
  };

  const authenticate = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

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
        router.replace("/home");
      } else {
        setError("Authentication failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    checkBiometrics();

    Animated.parallel([
      Animated.timing(brandFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(brandScaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 180,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateAnim, {
        toValue: 0,
        duration: 500,
        delay: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [brandFadeAnim, brandScaleAnim, cardFadeAnim, cardTranslateAnim]);

  return (
    <LinearGradient
      colors={["#d9f1fb", "#bce6f6", "#edf7fc"]}
      style={styles.container}
    >
      <View style={styles.topRibbon} />
      <View style={styles.bottomShape} />
      <View style={styles.leftOrb} />
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.brandContainer,
            {
              opacity: brandFadeAnim,
              transform: [{ scale: brandScaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Image
              source={require("../../assets/images/splash_logo.png")}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.brandName}>PILLORA</Text>
          <Text style={styles.subtitle}>
            Clinical daily medication workflow
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardFadeAnim,
              transform: [{ translateY: cardTranslateAnim }],
            },
          ]}
        >
          <View style={styles.kickerRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={SkeuoTheme.colors.accentDark}
            />
            <Text style={styles.kicker}>Secure Access</Text>
          </View>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.instructionText}>
            {hasBiometrics
              ? "Authenticate with biometrics or device PIN to continue"
              : "Use your device PIN to continue"}
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
                ? "Verifying Identity"
                : hasBiometrics
                  ? "Continue Securely"
                  : "Continue with PIN"}
            </Text>
          </TouchableOpacity>
          {__DEV__ && (
            <TouchableOpacity
              style={{ marginTop: 20 }}
              onPress={() => router.push("/home")}
            >
              <Text style={{ marginTop: 12, color: SkeuoTheme.colors.accent }}>
                Enter as Developer
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
              name="notifications-outline"
              size={14}
              color={SkeuoTheme.colors.textSecondary}
            />
            <Text style={styles.metaChipText}>Private on-device data</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons
              name="time-outline"
              size={14}
              color={SkeuoTheme.colors.textSecondary}
            />
            <Text style={styles.metaChipText}>Fast daily check-ins</Text>
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
    fontSize: 42,
    fontWeight: "800",
    color: SkeuoTheme.colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: SkeuoTheme.colors.textSecondary,
    marginBottom: 28,
    textAlign: "center",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 30,
    padding: 22,
    width: width - 40,
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
    fontSize: 12,
    color: SkeuoTheme.colors.accentDark,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "800",
    color: SkeuoTheme.colors.textPrimary,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 15,
    color: SkeuoTheme.colors.textSecondary,
    textAlign: "left",
    marginBottom: 18,
    lineHeight: 22,
  },
  button: {
    backgroundColor: SkeuoTheme.colors.accentDark,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
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
    width: width - 40,
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
