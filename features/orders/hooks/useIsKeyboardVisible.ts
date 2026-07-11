import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

const SHOW_EVENT = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const HIDE_EVENT = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

/**
 * Si el teclado está visible o no. A diferencia de medir su alto exacto (que
 * en Android con `edgeToEdgeEnabled` no es confiable), esto solo alterna un
 * booleano — se usa para elegir entre dos valores de padding fijos, no para
 * calcular el desplazamiento (eso ya lo hace `KeyboardAvoidingView`).
 */
export function useIsKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(SHOW_EVENT, () => setVisible(true));
    const hideSub = Keyboard.addListener(HIDE_EVENT, () => setVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return visible;
}
