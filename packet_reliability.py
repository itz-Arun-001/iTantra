import random

def split_into_packets(data_bytes, packet_size=16):
    """Split data into small chunks (packets), each tagged with a sequence number."""
    packets = []
    for i in range(0, len(data_bytes), packet_size):
        chunk = data_bytes[i:i + packet_size]
        seq_num = i // packet_size
        packets.append({"seq": seq_num, "data": chunk})
    return packets


def simulate_lossy_link(packets, loss_probability=0.2):
    """
    Simulate transmission over an unreliable link.
    Each packet has `loss_probability` chance of being dropped.
    Returns (received_packets, lost_seq_numbers).
    """
    received = []
    lost = []
    for pkt in packets:
        if random.random() < loss_probability:
            lost.append(pkt["seq"])
        else:
            received.append(pkt)
    return received, lost


def reassemble(received_packets, total_packets):
    """
    Try to reassemble the message from received packets.
    Returns (reassembled_bytes_or_None, missing_seq_numbers).
    """
    received_by_seq = {pkt["seq"]: pkt["data"] for pkt in received_packets}
    missing = [seq for seq in range(total_packets) if seq not in received_by_seq]

    if missing:
        return None, missing

    ordered_data = b"".join(received_by_seq[seq] for seq in range(total_packets))
    return ordered_data, []


def transmit_with_retry(data_bytes, packet_size=16, loss_probability=0.2, max_retries=5, priority="normal"):
    """
    Full reliability simulation: split into packets, simulate loss,
    detect missing packets, and retransmit only the missing ones (like real ACK/NACK).
    Emergency-priority messages get more retries.
    """
    packets = split_into_packets(data_bytes, packet_size)
    total_packets = len(packets)
    print(f"Message split into {total_packets} packet(s).")

    all_received = {}
    remaining_packets = packets
    retries_allowed = max_retries if priority == "emergency" else 2

    for attempt in range(1, retries_allowed + 1):
        received, lost = simulate_lossy_link(remaining_packets, loss_probability)
        for pkt in received:
            all_received[pkt["seq"]] = pkt["data"]

        missing_seqs = [seq for seq in range(total_packets) if seq not in all_received]

        print(f"  Attempt {attempt}: received {len(received)}/{len(remaining_packets)} packets sent this round. "
              f"Still missing: {len(missing_seqs)}")

        if not missing_seqs:
            break

        # Only retransmit the missing packets (this is the ACK/NACK-style efficiency gain)
        remaining_packets = [pkt for pkt in packets if pkt["seq"] in missing_seqs]
    else:
        print(f"  ⚠️  Max retries reached, some packets still missing.")

    reassembled, still_missing = reassemble(
        [{"seq": s, "data": d} for s, d in all_received.items()], total_packets
    )

    return reassembled, still_missing


def run_demo(text, loss_probability=0.3, priority="normal"):
    print(f"\n{'='*60}")
    print(f"Message: \"{text}\"")
    print(f"Priority: {priority.upper()} | Simulated packet loss rate: {loss_probability*100:.0f}%")

    data_bytes = text.encode("utf-8")
    result_bytes, missing = transmit_with_retry(
        data_bytes, packet_size=16, loss_probability=loss_probability, priority=priority
    )

    if result_bytes is not None:
        print(f"\n✅ Message fully reconstructed: \"{result_bytes.decode('utf-8')}\"")
    else:
        print(f"\n❌ Message incomplete — missing packet(s): {missing}")
        print("   (In a real emergency system, this would trigger a 'please repeat' request.)")


if __name__ == "__main__":
    message = "Medical emergency near the village. Send help immediately."

    print("### NORMAL PRIORITY MESSAGE (fewer retries) ###")
    run_demo(message, loss_probability=0.3, priority="normal")

    print("\n\n### EMERGENCY PRIORITY MESSAGE (more retries) ###")
    run_demo(message, loss_probability=0.3, priority="emergency")