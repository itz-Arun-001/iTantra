import sounddevice as sd
import numpy as np
import torch
import torchaudio
import time
from transformers import pipeline

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {DEVICE}")

MIC_INDEX = 15
DURATION = 10

print("Loading Whisper model...")
asr = pipeline(
    "automatic-speech-recognition",
    model="openai/whisper-small",
    device=0 if DEVICE == "cuda" else -1,
)
device_info = sd.query_devices(MIC_INDEX)
native_rate = int(device_info["default_samplerate"])

print("\nGet ready...")
time.sleep(1.5)  # buffer so your first word isn't cut off
print(f"Recording for {DURATION} seconds... SPEAK NOW!")

audio = sd.rec(int(DURATION * native_rate), samplerate=native_rate, channels=1, dtype="float32", device=MIC_INDEX)
sd.wait()
print("Recording done. Resampling and transcribing...")

audio_tensor = torch.from_numpy(audio.T)
resampler = torchaudio.transforms.Resample(orig_freq=native_rate, new_freq=16000)
resampled = resampler(audio_tensor).numpy().flatten()

result = asr(
    {"array": resampled, "sampling_rate": 16000},
    generate_kwargs={
        "language": "en",
        "task": "transcribe",
        "suppress_tokens": None,
        "begin_suppress_tokens": None,
    },
)
print("\n--- TRANSCRIPTION ---")
print(result["text"])