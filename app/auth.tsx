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
import { SkeuoTheme } from "../constants/theme";

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
    <LinearGradient colors={["#bfe9df", "#69c4b4"]} style={styles.container}>
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
              source={require("../assets/images/splash_logo.png")}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.brandName}>Pillora</Text>
          <Text style={styles.subtitle}>
            Your Personal Medication Tracker and Reminder App
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
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.instructionText}>
            {hasBiometrics
              ? "Use Face ID/Touch ID or PIN to access your medications"
              : "Enter your PIN to access your medications"}
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
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  brandContainer: {
    alignItems: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: "rgba(234, 247, 243, 0.64)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  brandLogo: {
    width: 90,
    height: 90,
  },
  brandName: {
    marginTop: 6,
    fontSize: 56,
    fontWeight: "800",
    color: "#123336",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 18,
    color: "#0f4c49",
    marginBottom: 40,
    textAlign: "center",
    fontWeight: "500",
  },
  card: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: SkeuoTheme.radius.lg,
    padding: 30,
    width: width - 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    shadowColor: "#5f807f",
    shadowOffset: {
      width: 6,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 7,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: SkeuoTheme.colors.textPrimary,
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: SkeuoTheme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    backgroundColor: SkeuoTheme.colors.accent,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: SkeuoTheme.radius.md,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    padding: 10,
    backgroundColor: SkeuoTheme.colors.dangerSurface,
    borderRadius: 8,
  },
  errorText: {
    color: SkeuoTheme.colors.danger,
    marginLeft: 8,
    fontSize: 14,
  },
});
