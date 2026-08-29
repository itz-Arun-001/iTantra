import torch
import soundfile as sf
from transformers import AutoTokenizer
from parler_tts import ParlerTTSForConditionalGeneration

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {DEVICE}")

print("Loading Indic Parler-TTS model (first run downloads it, may take a few minutes)...")
model = ParlerTTSForConditionalGeneration.from_pretrained("ai4bharat/indic-parler-tts").to(DEVICE)
tokenizer = AutoTokenizer.from_pretrained("ai4bharat/indic-parler-tts")
description_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)

# The text we want spoken (this would normally come from the STT/VAD output)
text_to_speak = "Medical emergency near the village. Send help immediately."

# Describe the voice you want in plain English
voice_description = "A clear, calm female voice speaking English at a moderate pace, with high recording quality."

print(f"\nGenerating speech for: \"{text_to_speak}\"")

input_ids = description_tokenizer(voice_description, return_tensors="pt").input_ids.to(DEVICE)
prompt_input_ids = tokenizer(text_to_speak, return_tensors="pt").input_ids.to(DEVICE)

generation = model.generate(input_ids=input_ids, prompt_input_ids=prompt_input_ids)
audio_arr = generation.cpu().numpy().squeeze()

output_file = "output_speech.wav"
sf.write(output_file, audio_arr, model.config.sampling_rate)
print(f"\n✅ Speech saved to {output_file} — open it to listen!")