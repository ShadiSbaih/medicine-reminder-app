import { SkeuoTheme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
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
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(32)).current;

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
    bottom: 24,
    zIndex: 100,
  },
  snackbar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  snackbarSuccess: {
    backgroundColor: SkeuoTheme.colors.successSurface,
    borderColor: SkeuoTheme.colors.border,
  },
  snackbarInfo: {
    backgroundColor: SkeuoTheme.colors.accentSoft,
    borderColor: SkeuoTheme.colors.border,
  },
  message: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
});
