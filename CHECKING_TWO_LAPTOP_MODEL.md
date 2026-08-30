# iTantra — Checking the Two-Laptop Network Model

This guide takes you from a completely empty laptop (nothing installed) to running iTantra's **real network transmission** — one laptop as sender (records your voice), another laptop as receiver (speaks it back) — communicating over actual WiFi, not simulated on one machine.

You'll do this in two stages:
1. **Single-laptop test** — sender and receiver both running on your own laptop, talking to each other over "localhost." This proves the code works before adding network complexity.
2. **Two-laptop test** — sender on one physical laptop, receiver on another, both on the same WiFi.

Follow every step in order. Don't skip the "Expected Output" checks.

**Time required:** 1.5–2.5 hours total (mostly downloads), split across two people if doing the two-laptop stage.

---

## Prerequisites

- Two Windows laptops (for Stage 2), OR one laptop is enough to complete Stage 1
- 8GB+ RAM each, ~10GB free disk space each
- A working microphone on the sender laptop, working speakers on the receiver laptop
- Both laptops on the **same WiFi network** for Stage 2
- Stable internet connection for the initial setup (downloads total several GB)

---

# PART A — Base Setup (do this on every laptop involved)

## A1 — Install Python

Open **PowerShell** and run:
```powershell
python --version
```
**If you see a version number** → skip to A3.
**If you get an error** → go to [python.org/downloads](https://www.python.org/downloads/), download **Python 3.11**, run the installer, and ⚠️ **check "Add Python to PATH"** before installing. Reopen PowerShell and confirm with `python --version`.

## A2 — Install Git

```powershell
git --version
```
**If you see a version number** → skip to A3.
**If you get an error** → download from [git-scm.com/downloads](https://git-scm.com/downloads), install with default settings, reopen PowerShell, confirm with `git --version`.

## A3 — Clone the repository

```powershell
cd Desktop
git clone https://github.com/itz-Arun-001/iTantra.git
cd iTantra
```

**Expected output:** a new `iTantra` folder with files like `sender_pipeline.py`, `network_sender.py`, `network_receiver.py`, etc.

## A4 — Create and activate a virtual environment

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

**If you get "running scripts is disabled":**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
Then activate again. You'll need to repeat this `Set-ExecutionPolicy` command once per new PowerShell window.

**Expected output:** your prompt starts with `(venv)`.

## A5 — Check for an NVIDIA GPU

```powershell
nvidia-smi
```
**Shows GPU info** → go to A6A. **Shows "not recognized"** → go to A6B. Both paths are fully supported; a GPU just makes processing faster.

## A6A — Install PyTorch (GPU path)

```powershell
pip install torch --index-url https://download.pytorch.org/whl/cu124
```
Large download (~2.5GB) — if it times out, re-run the same command, it resumes. Then skip to A7.

## A6B — Install PyTorch (CPU-only path)

```powershell
pip install torch --index-url https://download.pytorch.org/whl/cpu
```
Smaller download (~200-300MB). Expect STT/TTS to take longer per message (15-40+ seconds) — this is normal, not a bug.

## A7 — Install remaining Python packages

```powershell
pip install transformers onnxruntime soundfile numpy sounddevice torchaudio flask flask-cors
pip install git+https://github.com/huggingface/parler-tts.git
```

**If you're on the GPU path**, also run:
```powershell
pip install torchaudio --index-url https://download.pytorch.org/whl/cu124
```

## A8 — Verify the install

```powershell
python -c "import torch, transformers, sounddevice; print('All good! CUDA:', torch.cuda.is_available())"
```
**Expected output:** `All good! CUDA: True` or `False` — either is fine, just no errors.

## A9 — Hugging Face account (needed for the TTS model)

1. Sign up free at [huggingface.co](https://huggingface.co) if you don't have an account
2. Go to [huggingface.co/ai4bharat/indic-parler-tts](https://huggingface.co/ai4bharat/indic-parler-tts) and request access (fill the short form, usually approved within minutes)
3. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens), click **New token**, name it anything, select **Read**, click **Create**, copy the token
4. Log in from your terminal:
```powershell
huggingface-cli login
```
Right-click to paste your token when prompted, press Enter. Type `y` if asked about git credentials.

**Expected output:** `Login successful.`

## A10 — Find your microphone (needed on the SENDER laptop)

```powershell
python -c "import sounddevice as sd; print(sd.query_devices())"
```
Find your built-in mic in the list (look for "Microphone Array" or similar, with input channels > 0). **Note its index number.**

Then:
```powershell
notepad sender_pipeline.py
```
Find:
```python
MIC_INDEX = 7  # your mic's index
```
Change `7` to your actual mic's index number. Save and close.

Also update the same value in:
```powershell
notepad network_sender.py
```
(If `network_sender.py` reads the mic index from `sender_pipeline.py` automatically, you can skip this — but check the top of the file to confirm which mic index it's actually using.)

## A11 — Test your microphone (on the sender laptop)

```powershell
python -c "
import sounddevice as sd
import numpy as np
MIC_INDEX = 7  # replace with your actual index from A10
device_info = sd.query_devices(MIC_INDEX)
native_rate = int(device_info['default_samplerate'])
print('Recording 3 seconds — speak loudly now...')
audio = sd.rec(int(3 * native_rate), samplerate=native_rate, channels=device_info['max_input_channels'], dtype='float32', device=MIC_INDEX)
sd.wait()
print(f'Max volume: {np.max(np.abs(audio)):.4f}')
"
```

**Expected output:** a volume number above 0.05 after speaking. Near-zero means check Windows mic permissions (Settings → Privacy & Security → Microphone → allow desktop apps).

---

**Part A complete on this laptop.** If setting up two laptops, repeat all of Part A on the second laptop before continuing — each laptop needs its own full environment.

---

# PART B — Stage 1: Single-Laptop Loopback Test

Do this on **one laptop only** first, before involving a second machine. This proves the networking code itself works, isolating bugs in your code from bugs in actual network/firewall setup.

## B1 — Set the receiver address to localhost

```powershell
notepad network_sender.py
```
Find:
```python
RECEIVER_IP = "192.168.1.42"
```
Change to:
```python
RECEIVER_IP = "127.0.0.1"
```
Save and close.

## B2 — Open two PowerShell windows

Both need to be in the project folder with venv active:
```powershell
cd Desktop\iTantra
venv\Scripts\Activate.ps1
```
(Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first if needed, in each window.)

## B3 — Window 1: start the receiver

```powershell
python network_receiver.py
```

**Expected output** (after model downloads finish — several GB, first run only):
```
Listening for messages on port 5005...
```
**Leave this running.**

## B4 — Window 2: start the sender

```powershell
python network_sender.py
```

Speak a short sentence when prompted (e.g. "Medical emergency near the village, send help immediately").

## B5 — Check both windows

**Sender window should show:**
```
TRANSCRIBED: "..."
Sending X packet(s) over real network to 127.0.0.1...
✅ All X packets delivered (attempt 1).
Message fully delivered.
```

**Receiver window should show:**
```
Incoming message: X packet(s) expected, language=en
Decoded text: "..."
✅ Speech synthesized and saved to received_speech.wav
```

## B6 — Play back the result

Find `received_speech.wav` in your project folder and play it — you should hear a synthesized voice speaking back what you said.

**If Stage 1 works correctly, move to Part C. If something fails here, fix it before attempting two physical laptops** — it's much easier to debug on one machine.

---

# PART C — Stage 2: Real Two-Laptop Test

Now repeat with sender and receiver on two separate physical laptops, both connected to the **same WiFi network**.

## C1 — Get the receiver laptop's IP address

On the **receiver laptop**, run:
```powershell
ipconfig
```
Find **IPv4 Address** under your active WiFi adapter (e.g. `192.168.1.42`). Write this down.

## C2 — Set the real IP on the sender laptop

On the **sender laptop** (the one with the mic):
```powershell
notepad network_sender.py
```
Find:
```python
RECEIVER_IP = "127.0.0.1"
```
Change to the receiver laptop's actual IP from C1, e.g.:
```python
RECEIVER_IP = "192.168.1.42"
```
Save and close.

## C3 — Start the receiver first (on the receiver laptop)

```powershell
cd Desktop\iTantra
venv\Scripts\Activate.ps1
python network_receiver.py
```

**A Windows Firewall popup will likely appear** the first time — click **"Allow access"** (specifically for Private networks).

Wait for:
```
Listening for messages on port 5005...
```

## C4 — Start the sender (on the sender laptop)

```powershell
cd Desktop\iTantra
venv\Scripts\Activate.ps1
python network_sender.py
```

Speak your message when prompted.

## C5 — Verify it worked

Same expected output as Stage 1 (Part B5), but now happening across two physical machines over real WiFi. The receiver laptop should play synthesized speech through its own speakers from `received_speech.wav`, generated from a message that was recorded on a completely different laptop.

## C6 — Prove the bandwidth reduction is real (optional but impressive for judges)

After a successful run, check the sender laptop's project folder for `actual_raw_recording.wav` — this is your real recorded audio. Compare its file size (right-click → Properties) against the "Transmitted size" printed in the sender's terminal. This is a genuine, measured comparison — not a theoretical estimate.

---

## Troubleshooting

### Receiver never gets anything / sender times out waiting for a response
- Double-check the IP address in `network_sender.py` exactly matches what `ipconfig` showed on the receiver laptop
- Confirm both laptops are on the **same WiFi network** (not one on WiFi and one on mobile data, and not connected to a "Guest" network that isolates devices from each other — some routers block device-to-device communication on guest networks)
- Check the Windows Firewall popup was actually allowed on the receiver laptop — if missed, go to Windows Defender Firewall settings and manually allow Python through both Private and Public profiles

### "No speech detected" repeatedly
- Confirm `MIC_INDEX` in `sender_pipeline.py` matches the sender laptop's actual microphone (Part A10) — every laptop has a different index
- Speak clearly and loudly during the "Listening..." phase

### `PortAudioError` or `DirectSound error`
- Close other apps using the microphone (Zoom, Teams, browser tabs)
- Restart Windows Audio service: open PowerShell **as Administrator**, run `Restart-Service -Name AudioSrv -Force`
- Restart the laptop as a last resort

### `GatedRepoError` when the receiver tries to load the TTS model
- The receiver laptop hasn't completed Part A9 (Hugging Face account, access request, login) — go back and complete it

### Everything is very slow (30-60+ seconds per message)
- Expected on CPU-only laptops (no NVIDIA GPU) — this is not a bug, just a hardware limitation of the prototype stage

### Different WiFi networks / can't reach each other at all
- This method only works when both laptops are on the **same local network**. If testing remotely from different locations, you'll need something like Tailscale (a free virtual network tool) — ask before attempting this, it's a separate setup process.

---

## Reporting Back

If stuck, share:
1. Which **Part/Step** you're on (e.g. "C4")
2. The exact command you ran
3. The full error message from **both** terminal windows if relevant
4. Whether you're on the GPU or CPU path (Part A5)
5. Confirm both laptops show the same WiFi network name

This lets whoever's helping fix it quickly instead of guessing.
