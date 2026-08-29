import sounddevice as sd
import numpy as np
import torch
import torchaudio

DEVICE_INDEX = 15  # Microphone Array via WASAPI

# Get the device's native sample rate
device_info = sd.query_devices(DEVICE_INDEX)
native_rate = int(device_info["default_samplerate"])
print(f"Device native sample rate: {native_rate}")

print(f"Recording 3 seconds — speak loudly now...")
audio = sd.rec(int(3 * native_rate), samplerate=native_rate, channels=1, dtype="float32", device=DEVICE_INDEX)
sd.wait()

max_vol = np.max(np.abs(audio))
print(f"\nMax volume captured (native rate): {max_vol:.4f}")
if max_vol < 0.01:
    print("⚠️  Still silent.")
else:
    print("✅ Mic is capturing audio!")

# Resample to 16000 Hz for later use with Whisper/IndicConformer
audio_tensor = torch.from_numpy(audio.T)
resampler = torchaudio.transforms.Resample(orig_freq=native_rate, new_freq=16000)
resampled = resampler(audio_tensor)
print(f"Resampled shape: {resampled.shape}")