from sender_pipeline import run_sender
from receiver_pipeline import speak_text
from packet_reliability import transmit_with_retry
from bitrate_sim import decompress_text

if __name__ == "__main__":
    print("### iTantra FULL PIPELINE DEMO (with packet loss simulation) ###")
    print("(Sender and receiver simulated on the same laptop for this test)\n")

    result = run_sender(bitrate_mode="LOW")

    if result is None:
        print("No speech was captured — try again.")
    else:
        text, data_bytes, was_compressed = result

        print("\n--- Simulating transmission over an UNRELIABLE link (30% packet loss) ---")
        reconstructed_bytes, missing = transmit_with_retry(
            data_bytes, packet_size=16, loss_probability=0.3, priority="emergency"
        )

        if reconstructed_bytes is None:
            print(f"\n❌ Message could not be fully reconstructed. Missing packets: {missing}")
            print("   In a real system, this would trigger a 'please repeat' request to the sender.")
        else:
            decoded_text = decompress_text(reconstructed_bytes, was_compressed)
            print(f"\n✅ Message fully reconstructed despite packet loss: \"{decoded_text}\"")

            print("\n--- Now converting back to speech on receiver side ---")
            speak_text(decoded_text)

            print(f"\n{'='*60}")
            print("✅ FULL LOOP COMPLETE: voice → text → compressed → LOSSY transmission → recovered → synthetic speech")