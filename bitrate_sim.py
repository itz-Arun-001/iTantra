import gzip

# ---- CONFIG ----
BITRATE_MODES = {
    "HIGH": 8000,      # 8 kbps
    "MEDIUM": 4000,    # 4 kbps
    "LOW": 1000,       # 1 kbps
    "EXTREME": 500,    # 0.5 kbps
}

RAW_AUDIO_BITRATE = 64000  # typical raw voice audio: 64 kbps, for comparison


def compress_text(text):
    """
    Compress text using gzip, but only if it actually reduces size.
    Returns (data_bytes, was_compressed: bool).
    """
    raw_bytes = text.encode("utf-8")
    compressed = gzip.compress(raw_bytes)

    if len(compressed) < len(raw_bytes):
        return compressed, True
    else:
        return raw_bytes, False  # not worth compressing, send as-is


def decompress_text(data_bytes, was_compressed):
    """Reverse of compress_text — only decompress if it was actually compressed."""
    if was_compressed:
        return gzip.decompress(data_bytes).decode("utf-8")
    else:
        return data_bytes.decode("utf-8")


def simulate_transmission(data_bytes, bitrate_bps):
    """
    Simulate sending data_bytes over a link with the given bitrate.
    Returns the time (in seconds) this transmission would realistically take.
    """
    bits_to_send = len(data_bytes) * 8
    seconds_required = bits_to_send / bitrate_bps
    return seconds_required


def run_demo(text, mode="LOW"):
    print(f"\n{'='*50}")
    print(f"Original text: \"{text}\"")
    print(f"Original size: {len(text.encode('utf-8'))} bytes")

    data_bytes, was_compressed = compress_text(text)
    transmitted_size = len(data_bytes)
    method = "gzip" if was_compressed else "raw (compression skipped — not beneficial for short text)"
    print(f"Transmitted size: {transmitted_size} bytes ({method})")

    bitrate = BITRATE_MODES[mode]
    print(f"\nSimulating transmission at {mode} mode ({bitrate} bps)...")

    transmit_time = simulate_transmission(data_bytes, bitrate)
    print(f"Estimated transmission time: {transmit_time:.3f} seconds")

    # For comparison: how long would RAW AUDIO take for a similar spoken sentence?
    estimated_audio_seconds = max(1, len(text.split()) / 2.5)

    print(f"\n--- COMPARISON ---")
    print(f"Raw audio equivalent (~{estimated_audio_seconds:.1f}s of speech): {RAW_AUDIO_BITRATE} bps needed")
    print(f"Our system ({mode} mode): {bitrate} bps needed")
    reduction = (1 - (bitrate / RAW_AUDIO_BITRATE)) * 100
    print(f"Bandwidth reduction: {reduction:.2f}%")

    # Verify decompression works (simulating receiver side)
    decompressed = decompress_text(data_bytes, was_compressed)
    assert decompressed == text, "Decompression mismatch!"
    print(f"\n✅ Receiver successfully decoded: \"{decompressed}\"")


if __name__ == "__main__":
    sample_text = "Medical emergency near the village. Send help immediately."

    for mode in ["HIGH", "MEDIUM", "LOW", "EXTREME"]:
        run_demo(sample_text, mode=mode)

    # Test with a longer message to confirm gzip kicks in when it actually helps
    long_text = (
        "This is a longer emergency message intended to demonstrate that gzip "
        "compression becomes beneficial once the text is sufficiently long, "
        "unlike very short messages where compression overhead outweighs the savings."
    )
    run_demo(long_text, mode="LOW")