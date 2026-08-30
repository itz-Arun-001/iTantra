# 📡 iTantra — Indian Multilingual TTS & STT Aided Neural Transceiver Radio Access for Low-Bitrate Links

> **Speak in your language. Send it over almost nothing. Hear it come out the other side.**

iTantra is a Smart India Hackathon (SIH) build tackling a simple but hard problem: **voice is expensive to transmit, but in an emergency, voice is the message people actually understand.** iTantra converts speech to text on-device, sends only the (tiny) text payload over a low-bitrate link, and reconstructs speech on the receiving end — so a distress call can travel over a link that could never carry raw audio.

This repo contains a **working, end-to-end desktop prototype** — a Python backend (STT → compression → simulated low-bitrate transmission with packet-loss recovery → TTS) wired up to a live web interface. It runs on a laptop today; porting the validated pipeline to Android is the next phase. See [Project Status](#-project-status) for exactly what's built vs. planned.

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
- 💻 Runs **fully offline**, on **low/mid-range Android hardware**, using **open-source only** frameworks — no proprietary or cloud-hosted APIs

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
 [ Low-bitrate link: simulated today, Wi-Fi/Bluetooth/radio in production ]
      │
      ▼
 [ On-device TTS at receiver ]  ──►  🔊 spoken voice note / non-interruptible alert
```

A typical spoken sentence costs **~64 kbps as raw audio** but only a **few hundred bits as text** — a measured bandwidth reduction of **98%+** in this prototype, which is what makes this workable on constrained links where raw voice simply won't fit.

---

## 🚦 Project Status

This repo is a **working, end-to-end desktop prototype** with a live web UI — not yet the Android deliverable described in the PS.

| Component (per PS) | Status | Notes |
|---|---|---|
| Speech capture + VAD (pause detection) | ✅ Working | `sender_pipeline.py` — Silero VAD trims silence, with onset/offset padding to avoid clipping the first/last word |
| STT | ✅ Working — 4 languages | English, Hindi, Tamil, Telugu via `openai/whisper-small`. Architecture supports all 10 PS-required languages by adding language codes; not yet using an Indian-language-specialized model (see [Known Limitations](#-known-limitations)) |
| Text compression / bitrate simulation | ✅ Working | `bitrate_sim.py` — gzip (auto-skipped when it doesn't help on short text) + simulated transmission time across HIGH/MEDIUM/LOW/EXTREME bitrate modes |
| Packet loss / reliable transmission | ✅ Working | `packet_reliability.py` — packetizes the payload, simulates configurable packet loss, and retries (priority-aware: Emergency gets more retry attempts than Normal) |
| TTS (speech synthesis on receive) | ✅ Working — 4 languages | `receiver_pipeline.py` — AI4Bharat **Indic Parler-TTS**, with a per-language voice description |
| Full pipeline integration | ✅ Working | `full_pipeline_demo.py` (CLI) and a **Flask API + web UI** (see below) both run mic → VAD → STT → compress → simulated lossy transmission → TTS end-to-end |
| Web-based demo UI | ✅ Working | `api_server.py` (Flask backend) + `itantra-ui/` (Next.js/React frontend) — live recording, bitrate mode selector, Normal/Emergency priority toggle, language picker, real-time transmission stats, and receiver audio playback |
| Desktop Tkinter UI | ✅ Working (earlier iteration) | `demo_ui.py` — a simpler standalone Tkinter version of the same loop, kept as a lighter-weight fallback demo |
| Android app | 🔜 Not started | Current pipeline runs on a Windows laptop (see `PART1_SETUP_GUIDE.md` / `CHECKING_ONE_LAPTOP_MODEL.md`) |
| Real Wi-Fi/Bluetooth phone-to-phone transport | 🔜 Not started | Low-bitrate transmission and packet loss are currently **simulated in-process**, not sent over a real link between two devices |
| Push-to-talk walkie-talkie mode | 🔜 Not started | |
| On-device (TFLite / PyTorch Mobile) model conversion | 🔜 Not started | Current models (Whisper-small, Indic Parler-TTS, Silero VAD) run via full PyTorch/`transformers`, not yet quantized/mobile-optimized |
| All 10 PS-required languages | 🔜 Partial | 4 of 10 demonstrated (English, Hindi, Tamil, Telugu); remaining 6 need language codes added + accuracy validation |

**In short:** the full loop — mic → VAD → STT → compress → simulate lossy low-bitrate transmission → decompress → TTS — is validated, working, and demoable through both a CLI script and a polished web UI backed by a real Python AI pipeline. What's left is primarily the **mobile port** (Android, on-device model optimization, real wireless transport) rather than proving the core concept.

---

## 🏗️ Pipeline Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                              SENDER SIDE                               │
│                                                                          │
│   🎤 Mic input                                                          │
│      │                                                                  │
│      ▼                                                                  │
│   Silero VAD  ──►  detects speech start/stop, trims silence (padded)   │
│      │                                                                  │
│      ▼                                                                  │
│   Whisper STT  ──►  transcribes trimmed audio to text (en/hi/ta/te)    │
│      │                                                                  │
│      ▼                                                                  │
│   gzip compression (bitrate_sim.py)  ──►  raw bytes if gzip doesn't help│
│      │                                                                  │
│      ▼                                                                  │
│   Bitrate-mode simulation  ──►  HIGH / MEDIUM / LOW / EXTREME kbps      │
└──────────────────────────────┬───────────────────────────────────────┘
                                │
                  Simulated low-bitrate link
                  packet_reliability.py: chunk into
                  packets, simulate loss, priority-based retry
                                │
┌──────────────────────────────▼───────────────────────────────────────┐
│                             RECEIVER SIDE                              │
│                                                                          │
│   Reassemble packets  ──►  decompress text                             │
│      │                                                                  │
│      ▼                                                                  │
│   receiver_pipeline.py: speak_text()  ──►  Indic Parler-TTS synthesis  │
│      │                                                                  │
│      ▼                                                                  │
│   🔊 Played as voice note / non-interruptible alert                    │
└────────────────────────────────────────────────────────────────────────┘

              ┌────────────────────────────────────────┐
              │   api_server.py (Flask, port 5000)      │
              │   wraps the above pipeline as 3 steps:  │
              │   /api/step/record → /transmit →         │
              │   /synthesize, plus /api/received-audio │
              └───────────────┬──────────────────────────┘
                               │
              ┌────────────────▼──────────────────────────┐
              │   itantra-ui/ (Next.js, port 3000)         │
              │   record button · bitrate & priority       │
              │   controls · language picker · live stats  │
              │   · receiver audio playback                │
              └─────────────────────────────────────────────┘
```

---

## 📂 Repository Structure

```
iTantra/
├── PART1_SETUP_GUIDE.md         # Windows environment setup (Python, venv, PyTorch, mic check)
├── CHECKING_ONE_LAPTOP_MODEL.md # Zero-to-running setup guide for a teammate's fresh laptop
├── check_mic.py                 # Mic sanity check using device-native sample rate + resample to 16kHz
├── check_mic2.py                # Variant mic check, hardcoded device index
├── test_vad.py                  # Standalone VAD + STT test: records, trims silence, transcribes
├── test_stt.py                  # Standalone STT test: records fixed duration, transcribes with Whisper
├── test_tts.py                  # Standalone TTS test: generates output_speech.wav from hardcoded text
├── sender_pipeline.py           # Sender flow: record → VAD trim (padded) → STT → compress → simulate transmission
├── receiver_pipeline.py         # Receiver flow: decompress → Indic Parler-TTS speech synthesis
├── bitrate_sim.py                # Text compression + simulated transmission time across bitrate modes
├── packet_reliability.py        # Packetization, simulated loss, priority-aware retry/reassembly
├── full_pipeline_demo.py        # CLI end-to-end demo: sender → simulated lossy link → receiver TTS
├── demo_ui.py                   # Tkinter desktop UI wrapping the full pipeline (earlier iteration)
├── api_server.py                # Flask API exposing the pipeline as 3 HTTP steps for the web UI
├── itantra-ui/                  # Next.js/React web frontend (the primary demo interface)
├── output_speech.wav            # Sample TTS output (from test_tts.py)
├── received_speech.wav          # Sample receiver-side TTS output (regenerated on each run)
└── iTantra_SIH_Analysis.md      # Problem-statement analysis / strategy notes
```

---

## 🛠️ Getting Started

**New to this repo with nothing installed?** Follow **`CHECKING_ONE_LAPTOP_MODEL.md`** — it goes from a completely empty laptop to a running web demo, step by step, including Node.js/Git/Hugging Face account setup and troubleshooting.

**Already have Python set up?** Follow **`PART1_SETUP_GUIDE.md`** for the environment basics, then:

1. Install the additional backend dependencies:
   ```powershell
   pip install flask flask-cors
   pip install git+https://github.com/huggingface/parler-tts.git
   ```
2. Request access to the gated TTS model at [huggingface.co/ai4bharat/indic-parler-tts](https://huggingface.co/ai4bharat/indic-parler-tts), generate a token, and log in:
   ```powershell
   huggingface-cli login
   ```
3. Find your microphone's device index and update `MIC_INDEX` in `sender_pipeline.py`:
   ```powershell
   python -c "import sounddevice as sd; print(sd.query_devices())"
   ```
4. Install the frontend:
   ```powershell
   cd itantra-ui
   npm install
   ```

---

## ▶️ Usage

### Web UI (recommended — the primary demo)

Two terminals, both from the repo root:

```powershell
# Terminal 1 — backend
venv\Scripts\Activate.ps1
python api_server.py
```

```powershell
# Terminal 2 — frontend
cd itantra-ui
npm run dev
```

Then open **http://localhost:3000**, pick a language and bitrate mode, and hit record.

### CLI scripts

| Script | What it does | Run it with |
|---|---|---|
| `check_mic.py` / `check_mic2.py` | Verify mic input is being captured | `python check_mic.py` |
| `test_stt.py` | Record a fixed duration and transcribe | `python test_stt.py` |
| `test_vad.py` | Record, auto-detect speech start/stop, then transcribe | `python test_vad.py` |
| `test_tts.py` | Generate speech from a hardcoded sentence | `python test_tts.py` |
| `bitrate_sim.py` | See compression + simulated transmission time across bitrate modes | `python bitrate_sim.py` |
| `packet_reliability.py` | See packet loss + priority-based retry simulation | `python packet_reliability.py` |
| `sender_pipeline.py` | Sender-side flow only (record → VAD → STT → compress → simulate) | `python sender_pipeline.py` |
| `full_pipeline_demo.py` | Full sender + simulated lossy transmission + receiver TTS (CLI) | `python full_pipeline_demo.py` |
| `demo_ui.py` | Tkinter desktop GUI version of the full loop | `python demo_ui.py` |

---

## 🧰 Tech Stack

**Backend (working prototype):**
- 🐍 Python 3.11+
- 🔥 PyTorch / `torchaudio` (CUDA-accelerated where available, CPU fallback otherwise)
- 🤗 Hugging Face `transformers` — `openai/whisper-small` for STT (English, Hindi, Tamil, Telugu)
- 🗣️ AI4Bharat **Indic Parler-TTS** — multilingual speech synthesis
- 🎙️ Silero VAD — pause/speech-segment detection with onset/offset padding
- 🔊 `sounddevice`, `numpy`, `soundfile` — audio I/O
- 📦 `gzip` — text compression before simulated transmission
- 🌶️ Flask + `flask-cors` — HTTP API bridging the Python pipeline to the web UI

**Frontend (working prototype):**
- ⚛️ Next.js / React, Tailwind CSS
- Live recording controls, bitrate/priority selectors, language picker, real-time stats, receiver audio playback

**Planned (to meet the full PS requirements):**
- 📱 Android (Kotlin/Java) app shell, replacing the Python/web stack
- ⚡ TensorFlow Lite / PyTorch Mobile — quantized, on-device STT/TTS
- 🗣️ AI4Bharat **IndicConformer** (or similar) for improved multilingual STT accuracy, and coverage of the remaining 6 PS-required languages
- 📶 Android Wi-Fi Direct / Bluetooth transport layer for real phone-to-phone streaming
- 🔁 A real packet-based reliability layer (chunking, ACK/retry, forward error correction) over an actual wireless link, replacing today's in-process simulation

---

## 📊 Evaluation Metrics (per PS)

| Metric | Weight | What it measures | Where it's exercised in this repo |
|---|---|---|---|
| ⚙️ Efficiency | 20% | Model size, app RAM/flash footprint, idle-listening CPU usage | Not yet measured on mobile — current models (Whisper-small, Indic Parler-TTS, Silero VAD) are desktop-scale, not representative of eventual mobile footprint |
| 🎯 Accuracy | 40% | Low WER (STT), high legibility/flow (TTS) | Demonstrated qualitatively across 4 languages via the live UI; no formal WER benchmarking yet, and Indian-language STT accuracy is currently a known weak point (see [Known Limitations](#-known-limitations)) |
| ⏱️ Latency | 20% | Speech→text time, text→speech time, phone-to-phone delta, RTF | `bitrate_sim.py` simulates transmission time by bitrate mode (measured, e.g. 98.44% bandwidth reduction at LOW); full end-to-end wall-clock latency (record → transcribe → transmit → synthesize) is visible live in the UI but not yet formally benchmarked |

---

## 🗺️ Roadmap

- [x] Add `receiver_pipeline.py` (TTS `speak_text()`) and `packet_reliability.py` (`transmit_with_retry()`)
- [x] Build a Flask API + web UI wrapping the full pipeline
- [x] Add multi-language support for STT + TTS (English, Hindi, Tamil, Telugu)
- [ ] Improve Indian-language STT accuracy — swap Whisper → AI4Bharat IndicConformer (or equivalent) and extend to all 10 target languages
- [ ] Quantize/convert STT + TTS models to TensorFlow Lite / PyTorch Mobile for on-device inference
- [ ] Port the pipeline into an Android app (Kotlin), replacing Python/Flask/web stack with native AudioRecord/AudioTrack + UI
- [ ] Implement real Wi-Fi Direct / Bluetooth transport between two physical devices (replacing the same-machine simulation)
- [ ] Implement push-to-talk mode with a toggle to fall back to normal phone functionality
- [ ] Implement non-interruptible, max-volume playback for emergency/alert-priority messages
- [ ] Benchmark model size, RAM/flash footprint, and idle CPU usage on actual low/mid-range Android hardware
- [ ] Measure and report WER (STT) and end-to-end / RTF latency across all 10 languages

---

## ⚠️ Known Limitations

- STT currently supports **4 of 10 PS-required languages** (English, Hindi, Tamil, Telugu) via Whisper; the remaining 6 (Gujarati, Marathi, Kannada, Malayalam, Odia, Bengali) aren't wired up yet
- Whisper's accuracy on Hindi/Tamil/Telugu is noticeably weaker than English, particularly for words at the very start of an utterance (VAD onset padding mitigates but doesn't fully solve this) — AI4Bharat's IndicConformer is the planned fix, since it's purpose-trained on Indian languages
- The language spoken **must match the language selected in the UI** — there is no automatic spoken-language detection; selecting the wrong language will produce garbled transcriptions
- Everything runs on a **Windows laptop**, not an Android device — this validates the pipeline logic but not the size/latency/CPU constraints the PS actually evaluates
- The "low-bitrate transmission" and "packet loss" are **simulated in-process** on one machine, not sent over a real Wi-Fi/Bluetooth link between two physical devices
- Models used (`whisper-small`, Indic Parler-TTS, full Silero VAD via `torch.hub`) are **not yet quantized or mobile-optimized** and are far heavier than what a low/mid-range phone can comfortably run
- Microphone device indices are **hardware-specific** — `MIC_INDEX` in `sender_pipeline.py` must be updated per machine (see `CHECKING_ONE_LAPTOP_MODEL.md`)
- Some Windows audio drivers (particularly WASAPI under rapid repeated use) can intermittently throw `PortAudioError`/`DirectSound` errors requiring an Audio service restart — see the troubleshooting section in `CHECKING_ONE_LAPTOP_MODEL.md`

---

## 🤝 Contributing

This is an active SIH team project. If you're a teammate:

1. New machine? Start with `CHECKING_ONE_LAPTOP_MODEL.md`. Already set up? Use `PART1_SETUP_GUIDE.md` as reference.
2. Hardcode your own mic's `MIC_INDEX` — don't assume a teammate's index matches yours.
3. You'll need your own Hugging Face account + access request for the gated Indic Parler-TTS model.
4. Keep new dependencies open-source only (per PS constraints) — no proprietary/cloud STT or TTS SDKs.
5. When adding a new language, update `sender_pipeline.py` (Whisper language code) **and** `receiver_pipeline.py`'s `VOICE_DESCRIPTIONS` dict together, so STT and TTS stay in sync.

---

## 📄 License

License not yet specified for this repository — add a `LICENSE` file before public release.
