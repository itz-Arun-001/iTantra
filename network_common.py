import struct

PORT = 5005
PACKET_SIZE = 200  # payload bytes per UDP packet
HEADER_FORMAT = "!III"  # sequence number, total packets, payload length (all unsigned ints)
HEADER_SIZE = struct.calcsize(HEADER_FORMAT)


def make_packet(seq, total, payload):
    header = struct.pack(HEADER_FORMAT, seq, total, len(payload))
    return header + payload


def parse_packet(data):
    header = data[:HEADER_SIZE]
    seq, total, length = struct.unpack(HEADER_FORMAT, header)
    payload = data[HEADER_SIZE:HEADER_SIZE + length]
    return seq, total, payload


def split_into_chunks(data_bytes, chunk_size=PACKET_SIZE):
    return [data_bytes[i:i + chunk_size] for i in range(0, len(data_bytes), chunk_size)]