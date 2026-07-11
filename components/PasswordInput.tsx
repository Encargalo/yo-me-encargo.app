import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string | null;
  placeholder?: string;
}

export function PasswordInput({
  value,
  onChangeText,
  error,
  placeholder = "Contraseña",
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <View style={[styles.container, error && styles.containerError]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          autoComplete="password"
        />
        <TouchableOpacity
          onPress={() => setVisible((v) => !v)}
          style={styles.toggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {visible ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#9ca3af" />}
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    backgroundColor: "#fff",
    height: 56,
    paddingHorizontal: 12,
  },
  containerError: {
    borderColor: "#dc2626",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    padding: 0,
  },
  toggle: {
    paddingLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#dc2626",
    marginTop: 6,
  },
});
