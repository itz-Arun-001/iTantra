from sender_pipeline import run_sender
from receiver_pipeline import run_receiver

if __name__ == "__main__":
    print("### iTantra FULL PIPELINE DEMO ###")
    print("(Sender and receiver simulated on the same laptop for this test)\n")

    result = run_sender(bitrate_mode="LOW")

    if result is None:
        print("No speech was captured — try again.")
    else:
        text, data_bytes, was_compressed = result
        print("\n--- Simulated transmission complete, now decoding on receiver side ---")
        run_receiver(data_bytes, was_compressed)

        print(f"\n{'='*60}")
        print("✅ FULL LOOP COMPLETE: your voice → text → compressed → decompressed → synthetic speech")