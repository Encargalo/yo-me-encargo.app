import { Phone } from "lucide-react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Colors, FontFamilies } from "@/constants/theme";

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string | null;
}

export function PhoneInput({ value, onChangeText, error }: PhoneInputProps) {
  return (
    <View>
      <View style={[styles.container, error && styles.containerError]}>
        <Phone size={18} color={Colors.textoTenue} />
        <Text style={styles.prefix}>+57</Text>
        <View style={styles.separator} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType="phone-pad"
          placeholder="Número de teléfono"
          placeholderTextColor={Colors.textoTenue}
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
    borderColor: Colors.borde,
    borderRadius: 4,
    backgroundColor: Colors.superficie,
    height: 56,
    paddingHorizontal: 12,
    gap: 8,
  },
  containerError: {
    borderColor: Colors.error,
  },
  prefix: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: Colors.textoSuave,
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borde,
    marginHorizontal: 4,
  },
  input: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: Colors.texto,
    padding: 0,
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: Colors.error,
    marginTop: 6,
  },
});
