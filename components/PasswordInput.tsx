import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Colors, FontFamilies } from "@/constants/theme";

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
          placeholderTextColor={Colors.textoTenue}
          autoComplete="password"
        />
        <TouchableOpacity
          onPress={() => setVisible((v) => !v)}
          style={styles.toggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {visible ? (
            <EyeOff size={20} color={Colors.textoTenue} />
          ) : (
            <Eye size={20} color={Colors.textoTenue} />
          )}
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
    borderColor: Colors.borde,
    borderRadius: 4,
    backgroundColor: Colors.superficie,
    height: 56,
    paddingHorizontal: 12,
  },
  containerError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: Colors.texto,
    padding: 0,
  },
  toggle: {
    paddingLeft: 8,
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: Colors.error,
    marginTop: 6,
  },
});
