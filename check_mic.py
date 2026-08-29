import sounddevice as sd
import numpy as np

print("Available audio devices:\n")
print(sd.query_devices())

print(f"\nDefault input device: {sd.default.device[0]}")

print("\nRecording 3 seconds — speak loudly now...")
audio = sd.rec(int(3 * 16000), samplerate=16000, channels=1, dtype="float32")
sd.wait()

max_vol = np.max(np.abs(audio))
print(f"\nMax volume captured: {max_vol:.4f}")
if max_vol < 0.01:
    print("⚠️  Almost silent — mic likely not capturing audio.")
else:
    print("✅ Mic is capturing audio.")