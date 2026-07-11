import { Phone } from "lucide-react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string | null;
}

export function PhoneInput({ value, onChangeText, error }: PhoneInputProps) {
  return (
    <View>
      <View style={[styles.container, error && styles.containerError]}>
        <Phone size={18} color="#9ca3af" />
        <Text style={styles.prefix}>+57</Text>
        <View style={styles.separator} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType="phone-pad"
          placeholder="Número de teléfono"
          placeholderTextColor="#9ca3af"
          maxLength={10}
        />
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
    gap: 8,
  },
  containerError: {
    borderColor: "#dc2626",
  },
  prefix: {
    fontSize: 15,
    color: "#374151",
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: "#d1d5db",
    marginHorizontal: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    color: "#dc2626",
    marginTop: 6,
  },
});
