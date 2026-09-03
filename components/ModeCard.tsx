import { ArrowRight } from "encargalo-icons";
import type { ImageSourcePropType } from "react-native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamilies, Radius } from "@/constants/theme";

interface ModeCardProps {
  illustration: ImageSourcePropType;
  title: string;
  description: string;
  onPress: () => void;
}

export function ModeCard({ illustration, title, description, onPress }: ModeCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Image source={illustration} resizeMode="contain" style={styles.illustration} />
      <View style={styles.textGroup}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <ArrowRight size={26} color={Colors.texto} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: Radius.lg,
    backgroundColor: Colors.superficie,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 2,
  },
  illustration: {
    width: 56,
    height: 56,
  },
  textGroup: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: FontFamilies.headingBold,
    fontSize: 20,
    color: Colors.texto,
  },
  description: {
    fontFamily: FontFamilies.heading,
    fontSize: 12,
    color: Colors.textoTenue,
  },
});
