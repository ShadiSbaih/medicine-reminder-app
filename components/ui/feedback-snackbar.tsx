import { AppIcon } from "@/components/ui/app-icon";
import { SkeuoTheme } from "@/constants/theme";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

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
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(32);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (!visible) {
      return;
    }

    opacity.value = withTiming(1, { duration: 180 });
    translateY.value = withTiming(0, { duration: 180 });

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 180 }, (finished) => {
        if (finished) {
          runOnJS(onHide)();
        }
      });
      translateY.value = withTiming(20, { duration: 180 });
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, message, duration, onHide, opacity, translateY]);

  if (!visible || !message) {
    return null;
  }

  const isSuccess = type === "success";

  return (
    <Animated.View
      style={[styles.wrapper, animatedStyle]}
      pointerEvents="none"
    >
      <View
        style={[
          styles.snackbar,
          isSuccess ? styles.snackbarSuccess : styles.snackbarInfo,
        ]}
      >
        <AppIcon
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
