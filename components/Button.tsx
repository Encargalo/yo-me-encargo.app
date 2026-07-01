import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { Primary } from "@/constants/theme";

interface ButtonProps {
  label: string;
  onPress: () => void;
  type?: "primary";
  disabled?: boolean;
  loading?: boolean;
}

export function Button({
  label,
  onPress,
  type = "primary",
  disabled = false,
  loading = false,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        styles[type],
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: Primary,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
