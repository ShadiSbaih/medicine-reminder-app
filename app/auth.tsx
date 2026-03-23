import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
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
    }, []);


    return (
        <LinearGradient colors={["#8ca6d8", "#627fb5"]} style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Image
                        source={require("../assets/images/splash_logo.png")}
                        style={styles.brandLogo}
                        resizeMode="contain"
                    />
                </View>

                <Text style={styles.title}>Pillora</Text>
                <Text style={styles.subtitle}>Your Personal Medication Assistant</Text>

                <View style={styles.card}>
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

                    {error && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={20} color="#f44336" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}
                </View>
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
    iconContainer: {
        width: 120,
        height: 120,
        backgroundColor: "rgba(230, 236, 245, 0.7)",
        borderRadius: 60,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    brandLogo: {
        width: 90,
        height: 90,
    },
    title: {
        fontSize: 36,
        fontWeight: "bold",
        color: SkeuoTheme.colors.white,
        marginBottom: 10,
        textShadowColor: "rgba(0, 0, 0, 0.2)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    subtitle: {
        fontSize: 18,
        color: "rgba(255, 255, 255, 0.95)",
        marginBottom: 40,
        textAlign: "center",
    },
    card: {
        backgroundColor: SkeuoTheme.colors.cardBackground,
        borderRadius: SkeuoTheme.radius.lg,
        padding: 30,
        width: width - 40,
        alignItems: "center",
        borderWidth: 1,
        borderColor: SkeuoTheme.colors.border,
        shadowColor: "#8e9ab0",
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
        backgroundColor: "#f9e5e5",
        borderRadius: 8,
    },
    errorText: {
        color: "#f44336",
        marginLeft: 8,
        fontSize: 14,
    },
});
