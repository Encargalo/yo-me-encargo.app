import { act, renderHook } from "@testing-library/react-native";
import { Keyboard } from "react-native";

import { useIsKeyboardVisible } from "./useIsKeyboardVisible";

describe("useIsKeyboardVisible", () => {
  it("pasa a true al mostrarse el teclado y a false al ocultarse", async () => {
    let showCb: (() => void) | undefined;
    let hideCb: (() => void) | undefined;

    jest.spyOn(Keyboard, "addListener").mockImplementation(
      // @ts-expect-error -- firma simplificada para el test, solo nos interesa el callback
      (event: string, cb: () => void) => {
        if (event === "keyboardDidShow" || event === "keyboardWillShow") {
          showCb = cb;
        } else {
          hideCb = cb;
        }
        return { remove: jest.fn() };
      },
    );

    const { result, rerender } = await renderHook(() => useIsKeyboardVisible());
    expect(result.current).toBe(false);

    await act(async () => {
      showCb?.();
    });
    await rerender({});
    expect(result.current).toBe(true);

    await act(async () => {
      hideCb?.();
    });
    await rerender({});
    expect(result.current).toBe(false);
  });
});
