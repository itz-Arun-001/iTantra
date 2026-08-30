import socket
import json

from receiver_pipeline import speak_text
from bitrate_sim import decompress_text
from network_common import PORT, parse_packet

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind(("0.0.0.0", PORT))

print(f"Listening for messages on port {PORT}...")

received_chunks = {}
expected_total = None
was_compressed = False
language = "en"
sender_addr = None

while True:
    data, addr = sock.recvfrom(4096)
    sender_addr = addr

    if data.startswith(b"META"):
        meta = json.loads(data[4:].decode("utf-8"))
        expected_total = meta["total"]
        was_compressed = meta["was_compressed"]
        language = meta.get("language", "en")
        received_chunks = {}
        print(f"\nIncoming message: {expected_total} packet(s) expected, language={language}")

    elif data == b"CHECK":
        if expected_total is None:
            continue
        missing = [seq for seq in range(expected_total) if seq not in received_chunks]
        if missing:
            sock.sendto(json.dumps(missing).encode("utf-8"), addr)
        else:
            sock.sendto(b"ALL_RECEIVED", addr)

            # Reassemble and process
            ordered_data = b"".join(received_chunks[seq] for seq in range(expected_total))
            text = decompress_text(ordered_data, was_compressed)
            print(f"Decoded text: \"{text}\"")
            speak_text(text, output_file="received_speech.wav", language=language)
            print("✅ Speech synthesized and saved to received_speech.wav")

            expected_total = None
            received_chunks = {}

    else:
        seq, total, payload = parse_packet(data)
        received_chunks[seq] = payload