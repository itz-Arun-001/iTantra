# 📡 iTantra — Indian Multilingual TTS & STT Aided Neural Transceiver Radio Access for Low-Bitrate Links

> **Speak in your language. Send it over almost nothing. Hear it come out the other side.**

iTantra is a Smart India Hackathon (SIH) build tackling a simple but hard problem: **voice is expensive to transmit, but in an emergency, voice is the message people actually understand.** iTantra converts speech to text on-device, sends only the (tiny) text payload over a low-bitrate link, and reconstructs speech on the receiving end — so a distress call can travel over a link that could never carry raw audio.

This repo currently contains the **early proof-of-concept pipeline** (Python, desktop/laptop) used to validate the STT → compress → low-bitrate-transmit → TTS loop before porting it to Android. It is **not yet the final Android app** described in the problem statement — see [Project Status](#-project-status) below for exactly what's built vs. planned.

---

## 📑 Table of Contents

- [Problem Statement](#-problem-statement)
- [Core Idea](#-core-idea)
- [Project Status](#-project-status)
- [Pipeline Architecture](#-pipeline-architecture)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
- [Usage](#-usage)
- [Tech Stack](#-tech-stack)
- [Evaluation Metrics (per PS)](#-evaluation-metrics-per-ps)
- [Roadmap](#-roadmap)
- [Known Limitations](#-known-limitations)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Problem Statement

**SIH Problem Statement:** *iTantra – Indian Multilingual TTS & STT Aided Neural Transceiver Radio Access for Low Bitrate Links*

**Background:** Voice is highly data-intensive, making it hard to transmit over low-data-rate links. In alert and distress scenarios, however, transmitting *audio* — not text — is critical, because it's inclusive of people regardless of literacy.

**Ask:** Build an Android app with lightweight, accurate on-device STT and TTS for **10 Indian languages** (Hindi, Gujarati, Marathi, Kannada, Malayalam, Tamil, Telugu, Odia, Bengali, English) that:

- 🎙️ Detects speech, waits for a natural pause, and converts it to text (STT) locally
- 📶 Streams that text with minimal latency over Wi-Fi/Bluetooth to another phone or embedded device running the same app
- 🔊 Converts received text back into intelligible speech (TTS), playing it as a voice note — with emergency alerts announced at max volume and non-interruptible
- 📻 Works like a **push-to-talk walkie-talkie** between two phones (or degrades gracefully to a normal phone when the feature is off)
- 💻 Runs **fully offline**, on **low/mid-range Android hardware**, using **open-source only** frameworks (TensorFlow Lite for Microcontrollers, PyTorch Mobile, etc.) — no proprietary or cloud-hosted APIs

**Judged on:** Efficiency (model/app size, CPU/RAM footprint) · Accuracy (low WER for STT, natural/legible TTS) · Latency (speech→text time, text→speech time, end-to-end phone-to-phone delay, RTF).

---

## 💡 Core Idea

> Don't send the audio. Send the *meaning*, and rebuild the audio at the other end.

```
🗣️  Speaker's voice
      │
      ▼
 [ On-device STT ]  ──►  "Medical emergency near the village. Send help immediately."
      │
      ▼
 [ Text compression ]  ──►  a few dozen bytes, not a few hundred KB of audio
      │
      ▼
 [ Low-bitrate link: Wi-Fi / Bluetooth / packet radio ]
      │
      ▼
 [ On-device TTS at receiver ]  ──►  🔊 spoken voice note / non-interruptible alert
```

A typical spoken sentence (~4–5 seconds) costs **~64 kbps as raw audio** but only a **few hundred bits as text**, a bandwidth reduction of 95%+ — which is what makes this workable on constrained links where raw voice simply won't fit.

---

## 🚦 Project Status

This repo is at the **desktop prototype / pipeline-validation stage**, not the Android deliverable yet.

| Component (per PS) | Status | Notes |
|---|---|---|
| Speech capture + VAD (pause detection) | ✅ Working prototype | `test_vad.py`, `sender_pipeline.py` — uses Silero VAD |
| STT (English) | ✅ Working prototype | `test_stt.py`, `sender_pipeline.py` — uses OpenAI Whisper (`whisper-small`) as a placeholder model |
| STT (9 Indian languages) | 🔜 Not yet implemented | Planned: AI4Bharat IndicConformer (see [Roadmap](#-roadmap)) |
| Text compression / bitrate simulation | ✅ Working prototype | `bitrate_sim.py` — gzip + simulated transmission time across HIGH/MEDIUM/LOW/EXTREME bitrate modes |
| Packet loss / reliable transmission | ⚠️ Referenced, not included in this repo | `sender_pipeline.py`, `full_pipeline_demo.py`, and `demo_ui.py` import `transmit_with_retry` from a `packet_reliability.py` module that isn't present in this zip yet |
| TTS (speech synthesis on receive) | ⚠️ Referenced, not included in this repo | Same files import `speak_text` from a `receiver_pipeline.py` module that isn't present in this zip yet |
| Desktop demo UI | ✅ Working prototype | `demo_ui.py` — Tkinter UI simulating the full record → compress → transmit(lossy) → speak loop on one machine |
| Android app | 🔜 Not started | Current pipeline runs on a Windows laptop, per `PART1_SETUP_GUIDE.md` |
| Wi-Fi/Bluetooth phone-to-phone transport | 🔜 Not started | Currently simulated locally (sender and "receiver" run on the same machine) |
| Push-to-talk walkie-talkie mode | 🔜 Not started | |
| On-device (TFLite / PyTorch Mobile) model conversion | 🔜 Not started | Current models (Whisper, Silero VAD) run via full PyTorch/`transformers`, not yet quantized/mobile-optimized |

**In short:** the *concept has been validated end-to-end in software* (mic → VAD → STT → compress → simulate lossy low-bitrate transmission → decompress → TTS), but it runs on a laptop, in English only, with two of the pipeline's own modules (`receiver_pipeline.py`, `packet_reliability.py`) still to be added to this repo before `demo_ui.py` / `full_pipeline_demo.py` will run as-is.

---

## 🏗️ Pipeline Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                              SENDER SIDE                               │
│                                                                          │
│   🎤 Mic input                                                          │
│      │                                                                  │
│      ▼                                                                  │
│   Silero VAD  ──►  detects speech start/stop, trims silence            │
│      │                                                                  │
│      ▼                                                                  │
│   Whisper STT  ──►  transcribes trimmed audio to text                  │
│      │                                                                  │
│      ▼                                                                  │
│   gzip compression (bitrate_sim.py)  ──►  raw bytes if gzip doesn't help│
│      │                                                                  │
│      ▼                                                                  │
│   Bitrate-mode simulation  ──►  HIGH / MEDIUM / LOW / EXTREME kbps      │
└──────────────────────────────┬───────────────────────────────────────┘
                                │
                    (planned) Wi-Fi / Bluetooth link
                     packet_reliability.py: chunk into
                     packets, simulate loss, retry
                                │
┌──────────────────────────────▼───────────────────────────────────────┐
│                             RECEIVER SIDE                              │
│                                                                          │
│   Reassemble packets  ──►  decompress text                             │
│      │                                                                  │
│      ▼                                                                  │
│   receiver_pipeline.py: speak_text()  ──►  TTS synthesis                │
│      │                                                                  │
│      ▼                                                                  │
│   🔊 Played as voice note / non-interruptible alert                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Repository Structure

```
iTantra-main/
├── PART1_SETUP_GUIDE.md    # Full Windows environment setup walkthrough (Python, venv, PyTorch, mic check)
├── check_mic.py            # Mic sanity check using device-native sample rate + resample to 16kHz
├── check_mic2.py           # Variant mic check, hardcoded device index, resamples for Whisper/IndicConformer
├── test_vad.py             # Standalone VAD + STT test: records, trims silence, transcribes
├── test_stt.py             # Standalone STT test: records fixed duration, transcribes with Whisper
├── sender_pipeline.py       # Full sender flow: record → VAD trim → STT → compress → simulate transmission
├── bitrate_sim.py          # Text compression + simulated transmission time across bitrate modes
├── full_pipeline_demo.py   # End-to-end demo: sender → simulated lossy link → receiver TTS (single machine)
└── demo_ui.py               # Tkinter desktop UI wrapping the full pipeline with bitrate/priority controls
```

> ⚠️ `full_pipeline_demo.py` and `demo_ui.py` also expect a `receiver_pipeline.py` (with a `speak_text()` function) and a `packet_reliability.py` (with a `transmit_with_retry()` function). These aren't in the current zip — add them before running those two files.

---

## 🛠️ Getting Started

The current pipeline runs on a Windows laptop with Python. Follow **`PART1_SETUP_GUIDE.md`** for the full step-by-step (it's written for teammates with no prior setup and includes troubleshooting for common mic/PyTorch issues). Short version:

1. Install Python 3.11+ and add it to PATH
2. Create and activate a virtual environment
   ```powershell
   python -m venv venv
   venv\Scripts\Activate.ps1
   ```
3. Install PyTorch (GPU or CPU build depending on your hardware — see the guide for the exact command)
4. Install the remaining dependencies
   ```powershell
   pip install transformers onnxruntime soundfile numpy sounddevice torchaudio
   ```
5. Find your microphone's device index
   ```powershell
   python -c "import sounddevice as sd; print(sd.query_devices())"
   ```
   and update `MIC_INDEX` / `DEVICE_INDEX` at the top of `check_mic.py`, `sender_pipeline.py`, `test_stt.py`, and `test_vad.py` accordingly.
6. Run `check_mic.py` to confirm your mic is captured correctly before moving on.

---

## ▶️ Usage

| Script | What it does | Run it with |
|---|---|---|
| `check_mic.py` / `check_mic2.py` | Verify mic input is being captured | `python check_mic.py` |
| `test_stt.py` | Record a fixed duration and transcribe (no silence trimming) | `python test_stt.py` |
| `test_vad.py` | Record, auto-detect speech start/stop, then transcribe | `python test_vad.py` |
| `bitrate_sim.py` | See compression + simulated transmission time across bitrate modes for a sample sentence | `python bitrate_sim.py` |
| `sender_pipeline.py` | Full sender-side flow (record → VAD → STT → compress → simulate transmission) | `python sender_pipeline.py` |
| `full_pipeline_demo.py` | Full sender + simulated lossy transmission + receiver TTS | `python full_pipeline_demo.py` *(needs `receiver_pipeline.py` + `packet_reliability.py`)* |
| `demo_ui.py` | Desktop GUI wrapping the full loop with bitrate mode and emergency priority controls | `python demo_ui.py` *(needs `receiver_pipeline.py` + `packet_reliability.py`)* |

---

## 🧰 Tech Stack

**Currently used (prototype):**
- 🐍 Python 3.11+
- 🔥 PyTorch / `torchaudio`
- 🤗 Hugging Face `transformers` — `openai/whisper-small` for STT (English, placeholder model)
- 🎙️ Silero VAD — pause/speech-segment detection
- 🔊 `sounddevice`, `numpy` — audio I/O
- 🖼️ Tkinter — desktop demo UI
- 📦 `gzip` — text compression before simulated transmission

**Planned (to meet the PS requirements):**
- 📱 Android (Kotlin/Java) app shell
- ⚡ TensorFlow Lite / TensorFlow Lite for Microcontrollers, or PyTorch Mobile — for on-device, quantized STT/TTS models
- 🗣️ AI4Bharat **IndicConformer** (or similar open-source model) for multilingual Indian-language STT
- 🔉 An open-source, offline-capable Indian-language TTS engine (e.g. AI4Bharat **Indic-TTS** / Coqui-TTS-style models)
- 📶 Android Wi-Fi Direct / Bluetooth (Classic or BLE) transport layer for real phone-to-phone streaming
- 🔁 A real packet-based reliability layer (chunking, ACK/retry, forward error correction) replacing today's simulated version

---

## 📊 Evaluation Metrics (per PS)

| Metric | Weight | What it measures | Where it's exercised in this repo |
|---|---|---|---|
| ⚙️ Efficiency | 20% | Model size, app RAM/flash footprint, idle-listening CPU usage | Not yet measured — current models (Whisper-small, Silero VAD) are desktop-scale and **not** representative of the eventual mobile footprint |
| 🎯 Accuracy | 40% | Low WER (STT), high legibility/flow (TTS) | `test_stt.py` / `test_vad.py` give a rough sense of Whisper's English WER; no Indian-language or TTS accuracy testing yet |
| ⏱️ Latency | 20% | Speech→text time, text→speech time, phone-to-phone delta, RTF | `bitrate_sim.py` simulates transmission time by bitrate mode; end-to-end wall-clock latency isn't instrumented yet |

---

## 🗺️ Roadmap

- [ ] Add `receiver_pipeline.py` (TTS `speak_text()`) and `packet_reliability.py` (`transmit_with_retry()`) to complete the local demo loop
- [ ] Swap Whisper → AI4Bharat IndicConformer (or equivalent) and add language selection for all 10 target languages
- [ ] Add an open-source offline Indian-language TTS engine
- [ ] Quantize/convert STT + TTS models to TensorFlow Lite / PyTorch Mobile for on-device inference
- [ ] Port the pipeline into an Android app (Kotlin), replacing `sounddevice`/Tkinter with Android AudioRecord/AudioTrack + a native UI
- [ ] Implement real Wi-Fi Direct / Bluetooth transport between two devices (replacing the same-machine simulation)
- [ ] Implement push-to-talk mode with a toggle to fall back to normal phone functionality
- [ ] Implement non-interruptible, max-volume playback for emergency/alert-priority messages
- [ ] Benchmark model size, RAM/flash footprint, and idle CPU usage on actual low/mid-range Android hardware
- [ ] Measure and report WER (STT) and end-to-end / RTF latency across all 10 languages

---

## ⚠️ Known Limitations

- STT currently supports **English only** (via Whisper); the 9 Indian languages required by the PS are not yet implemented
- `receiver_pipeline.py` and `packet_reliability.py` are imported by `demo_ui.py` and `full_pipeline_demo.py` but are **not included in this repo** — those two scripts won't run until they're added
- Everything runs on a **Windows laptop**, not an Android device — this validates the pipeline logic but not the size/latency/CPU constraints the PS actually evaluates
- The "low-bitrate transmission" and "packet loss" are **simulated in-process**, not sent over a real Wi-Fi/Bluetooth link between two devices
- Models used (`whisper-small`, full Silero VAD via `torch.hub`) are **not yet quantized or mobile-optimized** and are far heavier than what a low/mid-range phone can comfortably run

---

## 🤝 Contributing

This is an active SIH team project. If you're a teammate:

1. Read `PART1_SETUP_GUIDE.md` fully before running anything
2. Hardcode your own mic's `DEVICE_INDEX` — don't assume a teammate's index matches yours
3. Open an issue/PR when adding the missing `receiver_pipeline.py` / `packet_reliability.py` modules so the full demo loop runs for everyone
4. Keep new dependencies open-source only (per PS constraints) — no proprietary/cloud STT or TTS SDKs

---

## 📄 License

License not yet specified for this repository — add a `LICENSE` file before public release.
