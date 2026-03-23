import { View, type ViewProps } from "react-native";

import { SkeuoTheme } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background",
  );

  return (
    <View
      style={[
        {
          backgroundColor: backgroundColor || SkeuoTheme.colors.pageBackground,
        },
        style,
      ]}
      {...otherProps}
    />
  );
}
