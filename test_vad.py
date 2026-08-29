import sounddevice as sd
import numpy as np
import torch
import torchaudio
import time
from transformers import pipeline

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {DEVICE}")

MIC_INDEX = 15  # your mic's index
MAX_DURATION = 15  # max recording time as a safety cap

device_info = sd.query_devices(MIC_INDEX)
native_rate = int(device_info["default_samplerate"])

print("Loading Silero VAD...")
vad_model, utils = torch.hub.load(repo_or_dir="snakers4/silero-vad", model="silero_vad")
(get_speech_timestamps, _, _, _, _) = utils

print("Loading Whisper model...")
asr = pipeline(
    "automatic-speech-recognition",
    model="openai/whisper-small",
    device=0 if DEVICE == "cuda" else -1,
)
asr.model.generation_config.suppress_tokens = None
asr.model.generation_config.begin_suppress_tokens = None

print("\nGet ready...")
time.sleep(1.5)
print(f"Listening... speak, then just stop (max {MAX_DURATION} sec).")

channels = device_info["max_input_channels"]
audio = sd.rec(int(MAX_DURATION * native_rate), samplerate=native_rate, channels=channels, dtype="float32", device=MIC_INDEX)
sd.wait()
print("Recording done. Detecting speech segments...")

audio_tensor = torch.from_numpy(audio.T)
if audio_tensor.shape[0] > 1:
    audio_tensor = audio_tensor.mean(dim=0, keepdim=True)  # convert stereo to mono
resampler = torchaudio.transforms.Resample(orig_freq=native_rate, new_freq=16000)
resampled = resampler(audio_tensor).squeeze(0)
speech_timestamps = get_speech_timestamps(resampled, vad_model, sampling_rate=16000)
print(f"Detected {len(speech_timestamps)} speech segment(s).")

if speech_timestamps:
    start = speech_timestamps[0]["start"]
    end = speech_timestamps[-1]["end"]
    trimmed = resampled[start:end].numpy()
    print(f"Trimmed audio: {len(trimmed)/16000:.2f} seconds (silence removed)")

    result = asr(
        {"array": trimmed, "sampling_rate": 16000},
        generate_kwargs={"language": "en", "task": "transcribe"},
    )
    print("\n--- TRANSCRIPTION ---")
    print(result["text"])
else:
    print("No speech detected — try again, speaking louder/sooner.")