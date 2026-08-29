import torch
import soundfile as sf
from transformers import AutoTokenizer
from parler_tts import ParlerTTSForConditionalGeneration

from bitrate_sim import decompress_text

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {DEVICE}")

print("Loading Indic Parler-TTS model...")
model = ParlerTTSForConditionalGeneration.from_pretrained("ai4bharat/indic-parler-tts").to(DEVICE)
tokenizer = AutoTokenizer.from_pretrained("ai4bharat/indic-parler-tts")
description_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)

VOICE_DESCRIPTION = "A clear, calm female voice speaking English at a moderate pace, with high recording quality."


def speak_text(text, output_file="received_speech.wav"):
    """Convert text to speech and save as a wav file."""
    print(f"\nGenerating speech for: \"{text}\"")

    input_ids = description_tokenizer(VOICE_DESCRIPTION, return_tensors="pt").input_ids.to(DEVICE)
    prompt_input_ids = tokenizer(text, return_tensors="pt").input_ids.to(DEVICE)

    generation = model.generate(input_ids=input_ids, prompt_input_ids=prompt_input_ids)
    audio_arr = generation.cpu().numpy().squeeze()

    sf.write(output_file, audio_arr, model.config.sampling_rate)
    print(f"✅ Speech saved to {output_file}")
    return output_file


def run_receiver(data_bytes, was_compressed):
    """
    Simulates the receiver side: takes the (simulated) received packet data,
    decompresses it back to text, and speaks it via TTS.
    """
    print(f"\n{'='*60}")
    print(f"RECEIVED {len(data_bytes)} bytes over the link.")

    text = decompress_text(data_bytes, was_compressed)
    print(f"Decoded text: \"{text}\"")

    speak_text(text)


if __name__ == "__main__":
    # Standalone test using a hardcoded example (simulating data "received" from sender)
    from bitrate_sim import compress_text

    test_text = "Medical emergency near the village. Send help immediately."
    data_bytes, was_compressed = compress_text(test_text)

    run_receiver(data_bytes, was_compressed)