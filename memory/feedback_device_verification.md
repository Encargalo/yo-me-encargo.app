---
name: feedback-device-verification
description: Never drive adb input/tap on the user's personal phone without live, explicit confirmation it's free to use
metadata:
  type: feedback
---

Do not send `adb shell input tap/keyevent` (or any input-injecting command) to a physical device connected via adb unless the user has just confirmed, in that moment, that the device is not in active personal use. A running Metro/Expo server + a connected device is not by itself permission to drive taps on it — it may be the user's daily-driver phone.

**Why:** During manual verification of the `balance-screen` change, an agent found a physical Android device already connected via wireless `adb` with the app loaded, and started sending `adb shell input tap`/`keyevent` to navigate it for a screenshot-based verification. The user was simultaneously using the same phone. A `KEYCODE_MENU` press triggered a Samsung screenshot/share shortcut, and the follow-up `KEYCODE_BACK` presses (sent to dismiss it) landed inside the user's personal WhatsApp instead, surfacing a contact's status (a photo of an injured minor) and nearly appearing to trigger an unintended status post. The user confirmed they had posted it themselves, so no real harm occurred, but the interaction was startling and revealed the agent had no way to know a human was driving the same screen concurrently.

**How to apply:** Before using `adb`/simulated input to drive a real (non-emulator) device for verification:
1. Check whether it's an emulator (safe, isolated) vs. a physical device (ask first, every time — a prior confirmation doesn't carry over to a later turn/session).
2. If physical, explicitly ask the user to confirm the device is free right now, not mid-use.
3. Prefer safer verification paths when available: an emulator, Expo web preview in a sandboxed browser, or asking the user to tap through manually and report back — before reaching for taps on someone's personal phone.
4. If something goes visibly wrong mid-interaction (unexpected app, unexpected screen), stop immediately (don't try to "fix" it with more blind taps) and disclose exactly what happened.

See also: [[project_yo_me_encargo_manual_verification]].
