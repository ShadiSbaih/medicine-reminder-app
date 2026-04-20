import { SkeuoTheme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

type SnackbarType = "success" | "info";

interface FeedbackSnackbarProps {
  visible: boolean;
  message: string;
  type?: SnackbarType;
  onHide: () => void;
  duration?: number;
}

export function FeedbackSnackbar({
  visible,
  message,
  type = "success",
  onHide,
  duration = 1800,
}: FeedbackSnackbarProps) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(32));

  useEffect(() => {
    if (!visible) {
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 20,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onHide, opacity, translateY]);

  if (!visible || !message) {
    return null;
  }

  const isSuccess = type === "success";

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="none"
    >
      <View
        style={[
          styles.snackbar,
          isSuccess ? styles.snackbarSuccess : styles.snackbarInfo,
        ]}
      >
        <Ionicons
          name={isSuccess ? "checkmark-circle" : "information-circle"}
          size={18}
          color={
            isSuccess ? SkeuoTheme.colors.success : SkeuoTheme.colors.accentDark
          }
        />
        <Text
          style={[
            styles.message,
            {
              color: isSuccess
                ? SkeuoTheme.colors.success
                : SkeuoTheme.colors.accentDark,
            },
          ]}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 28,
    zIndex: 30,
  },
  snackbar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    ...SkeuoTheme.shadow.outerSoft,
  },
  snackbarSuccess: {
    backgroundColor: SkeuoTheme.colors.successSurface,
    borderColor: "#bfe7d5",
  },
  snackbarInfo: {
    backgroundColor: SkeuoTheme.colors.accentSoft,
    borderColor: "#b9deea",
  },
  message: {
    marginLeft: 9,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    letterSpacing: 0.2,
  },
});
