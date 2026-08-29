import tkinter as tk
from tkinter import ttk, messagebox
import threading

from sender_pipeline import run_sender
from receiver_pipeline import speak_text
from packet_reliability import transmit_with_retry
from bitrate_sim import decompress_text, BITRATE_MODES, RAW_AUDIO_BITRATE


class ITantraApp:
    def __init__(self, root):
        self.root = root
        self.root.title("iTantra — Low-Bitrate Voice Communication")
        self.root.geometry("650x550")
        self.root.configure(bg="#1E2761")

        self.build_ui()

    def build_ui(self):
        title = tk.Label(
            self.root, text="iTantra", font=("Georgia", 28, "bold"),
            fg="white", bg="#1E2761"
        )
        title.pack(pady=(20, 0))

        subtitle = tk.Label(
            self.root, text="Speech → Text → Low-Bitrate Link → Speech",
            font=("Arial", 11, "italic"), fg="#CADCFC", bg="#1E2761"
        )
        subtitle.pack(pady=(0, 20))

        # Bitrate mode selector
        mode_frame = tk.Frame(self.root, bg="#1E2761")
        mode_frame.pack(pady=10)
        tk.Label(mode_frame, text="Bitrate Mode:", font=("Arial", 11),
                 fg="white", bg="#1E2761").pack(side=tk.LEFT, padx=5)

        self.bitrate_var = tk.StringVar(value="LOW")
        mode_dropdown = ttk.Combobox(
            mode_frame, textvariable=self.bitrate_var,
            values=list(BITRATE_MODES.keys()), state="readonly", width=12
        )
        mode_dropdown.pack(side=tk.LEFT)

        # Priority toggle
        self.priority_var = tk.StringVar(value="normal")
        priority_frame = tk.Frame(self.root, bg="#1E2761")
        priority_frame.pack(pady=5)
        tk.Radiobutton(priority_frame, text="Normal", variable=self.priority_var, value="normal",
                        fg="white", bg="#1E2761", selectcolor="#26306E").pack(side=tk.LEFT, padx=10)
        tk.Radiobutton(priority_frame, text="🚨 Emergency", variable=self.priority_var, value="emergency",
                        fg="white", bg="#1E2761", selectcolor="#26306E").pack(side=tk.LEFT, padx=10)

        # Record button
        self.record_btn = tk.Button(
            self.root, text="🎙️  Record & Send", font=("Arial", 14, "bold"),
            bg="#3B82C4", fg="white", activebackground="#2c649c",
            padx=20, pady=10, command=self.start_recording_thread
        )
        self.record_btn.pack(pady=20)

        self.status_label = tk.Label(
            self.root, text="Ready.", font=("Arial", 11),
            fg="#CADCFC", bg="#1E2761", wraplength=550
        )
        self.status_label.pack(pady=10)

        # Stats display
        stats_frame = tk.Frame(self.root, bg="#26306E", padx=15, pady=15)
        stats_frame.pack(pady=10, fill=tk.X, padx=30)

        self.stats_label = tk.Label(
            stats_frame, text="No transmission yet.", font=("Consolas", 10),
            fg="white", bg="#26306E", justify=tk.LEFT, anchor="w"
        )
        self.stats_label.pack(fill=tk.X)

        # Transcription display
        self.transcript_label = tk.Label(
            self.root, text="", font=("Arial", 10), fg="white", bg="#1E2761",
            wraplength=550, justify=tk.LEFT
        )
        self.transcript_label.pack(pady=10)

    def start_recording_thread(self):
        # Run in a thread so the UI doesn't freeze while recording/processing
        self.record_btn.config(state=tk.DISABLED, text="Processing...")
        self.status_label.config(text="Listening... speak now!")
        thread = threading.Thread(target=self.run_pipeline)
        thread.start()

    def run_pipeline(self):
        try:
            mode = self.bitrate_var.get()
            priority = self.priority_var.get()

            result = run_sender(bitrate_mode=mode)

            if result is None:
                self.update_status("No speech detected. Try again.")
                return

            text, data_bytes, was_compressed = result
            self.update_transcript(f"Transcribed: \"{text}\"")

            loss_prob = 0.3  # simulated for demo purposes
            reconstructed_bytes, missing = transmit_with_retry(
                data_bytes, packet_size=16, loss_probability=loss_prob, priority=priority
            )

            bitrate = BITRATE_MODES[mode]
            reduction = (1 - (bitrate / RAW_AUDIO_BITRATE)) * 100

            if reconstructed_bytes is None:
                self.update_stats(
                    f"Mode: {mode} ({bitrate} bps)\n"
                    f"Bandwidth reduction: {reduction:.2f}%\n"
                    f"❌ Transmission failed — packets lost: {missing}"
                )
                self.update_status("Message could not be delivered. Try again or use Emergency priority.")
            else:
                decoded_text = decompress_text(reconstructed_bytes, was_compressed)
                self.update_stats(
                    f"Mode: {mode} ({bitrate} bps) | Priority: {priority.upper()}\n"
                    f"Original size: {len(text.encode('utf-8'))} bytes\n"
                    f"Transmitted size: {len(data_bytes)} bytes\n"
                    f"Bandwidth reduction: {reduction:.2f}%\n"
                    f"✅ Delivered successfully despite simulated packet loss"
                )
                self.update_status("Generating speech on receiver side...")
                speak_text(decoded_text)
                self.update_status("✅ Done! Check received_speech.wav")

        except Exception as e:
            self.update_status(f"Error: {e}")
        finally:
            self.root.after(0, lambda: self.record_btn.config(state=tk.NORMAL, text="🎙️  Record & Send"))

    def update_status(self, text):
        self.root.after(0, lambda: self.status_label.config(text=text))

    def update_stats(self, text):
        self.root.after(0, lambda: self.stats_label.config(text=text))

    def update_transcript(self, text):
        self.root.after(0, lambda: self.transcript_label.config(text=text))


if __name__ == "__main__":
    root = tk.Tk()
    app = ITantraApp(root)
    root.mainloop()