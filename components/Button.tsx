import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamilies } from "@/constants/theme";

type ButtonVariant = "primary" | "green" | "secondary";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  leftIcon,
  rightIcon,
  disabled = false,
  loading = false,
}: ButtonProps) {
  const isSecondary = variant === "secondary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, styles[variant], (disabled || loading) && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? Colors.textoSuave : Colors.superficie} />
      ) : (
        <>
          {leftIcon ? <View style={[styles.iconSlot, styles.iconLeft]}>{leftIcon}</View> : null}
          <Text style={[styles.label, isSecondary && styles.labelSecondary]}>{label}</Text>
          {rightIcon ? <View style={[styles.iconSlot, styles.iconRight]}>{rightIcon}</View> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    minHeight: 49,
    paddingVertical: 14,
    paddingHorizontal: 44,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconSlot: {
    position: "absolute",
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  iconLeft: {
    left: 18,
  },
  iconRight: {
    right: 18,
  },
  primary: {
    backgroundColor: Colors.marca,
  },
  green: {
    backgroundColor: Colors.exito,
  },
  secondary: {
    backgroundColor: Colors.bordeSuave,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    flex: 1,
    textAlign: "center",
    color: Colors.superficie,
    fontFamily: FontFamilies.headingSemiBold,
    fontSize: 16,
  },
  labelSecondary: {
    color: Colors.textoSuave,
  },
});
