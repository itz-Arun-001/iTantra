# iTantra — Checking the Full Project on One Laptop

This guide takes you from a completely empty laptop (nothing installed) to running the full iTantra system — mic recording, speech-to-text, low-bitrate simulation, text-to-speech, and the web UI — all on a single machine.

Follow every step in order. Don't skip the "Expected Output" checks.

**Time required:** 1–2 hours, mostly waiting on downloads (depends on your internet speed).

---

## Prerequisites

- Windows laptop, 8GB+ RAM, ~10GB free disk space
- A working microphone (built-in or external)
- Stable internet connection (downloads total several GB)

---

## PART A — Install Python

### Step 1 — Check if Python is already installed

Open **PowerShell** (search "PowerShell" in the Start menu) and run:

```powershell
python --version
```

**If you see a version number** (e.g. `Python 3.11.x` or `Python 3.13.x`) → skip to Step 3.
**If you get an error** → continue to Step 2.

### Step 2 — Install Python

1. Go to [python.org/downloads](https://www.python.org/downloads/)
2. Download **Python 3.11** (recommended)
3. Run the installer
4. ⚠️ **Critical:** check the box **"Add Python to PATH"** before clicking Install
5. Close and reopen PowerShell, then re-run `python --version` to confirm

---

## PART B — Install Git

### Step 3 — Check if Git is installed

```powershell
git --version
```

**If you see a version number** → skip to Step 5.
**If you get an error** → continue to Step 4.

### Step 4 — Install Git

1. Go to [git-scm.com/downloads](https://git-scm.com/downloads)
2. Download and run the Windows installer
3. Click through with default settings (safe to leave everything as-is)
4. Close and reopen PowerShell, confirm with `git --version`

---

## PART C — Get the Project Code

### Step 5 — Choose a folder and clone the repository

```powershell
cd Desktop
git clone https://github.com/itz-Arun-001/iTantra.git
cd iTantra
```

**Expected output:** a new `iTantra` folder appears containing files like `sender_pipeline.py`, `api_server.py`, `PART1_SETUP_GUIDE.md`, etc.

---

## PART D — Python Environment Setup

### Step 6 — Create and activate a virtual environment

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

**Expected output:** your prompt now starts with `(venv)`.

### ⚠️ If you get "running scripts is disabled on this system"

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
Then try activating again. You'll need to run this once per new PowerShell window.

**Important:** every time you close and reopen PowerShell, you must `cd` back into the `iTantra` folder and re-run `venv\Scripts\Activate.ps1` before running any Python commands.

### Step 7 — Check if you have an NVIDIA GPU

```powershell
nvidia-smi
```

**If it shows GPU info** → note the CUDA version shown, go to Step 8A.
**If you get "not recognized"** → you don't have an NVIDIA GPU, go to Step 8B. This is completely fine — the project runs on CPU too, just a bit slower.

### Step 8A — Install PyTorch (GPU version)

```powershell
pip install torch --index-url https://download.pytorch.org/whl/cu124
```

This is a large download (~2.5GB). If it times out partway, just run the exact same command again — it resumes automatically.

Skip to Step 9.

### Step 8B — Install PyTorch (CPU version)

```powershell
pip install torch --index-url https://download.pytorch.org/whl/cpu
```

Smaller download (~200-300MB).

### Step 9 — Install all remaining Python packages

```powershell
pip install transformers onnxruntime soundfile numpy sounddevice torchaudio flask flask-cors
```

**If you installed the GPU version of torch**, also run:
```powershell
pip install torchaudio --index-url https://download.pytorch.org/whl/cu124
```

### Step 10 — Install the TTS library (from GitHub, not a standard package)

```powershell
pip install git+https://github.com/huggingface/parler-tts.git
```

### Step 11 — Verify the install

```powershell
python -c "import torch, transformers, flask, sounddevice; print('All good! CUDA available:', torch.cuda.is_available())"
```

**Expected output:** `All good! CUDA available: True` (or `False` if you're on CPU-only — both are fine, no errors).

---

## PART E — Hugging Face Account (needed for the TTS model)

### Step 12 — Create a Hugging Face account

Go to [huggingface.co](https://huggingface.co) and sign up (free) if you don't have an account.

### Step 13 — Request access to the TTS model

1. Go to [huggingface.co/ai4bharat/indic-parler-tts](https://huggingface.co/ai4bharat/indic-parler-tts)
2. You'll see a message asking you to accept conditions to access the model
3. Fill in the short form and submit — access is usually granted within minutes

### Step 14 — Generate an access token

1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Click **New token**, name it anything (e.g. "itantra"), select **Read** access, click **Create**
3. Copy the token (starts with `hf_`)

### Step 15 — Log in from your terminal

```powershell
huggingface-cli login
```

When prompted, right-click to paste your token, press Enter. When asked "Add token as git credential?", typing `y` is fine.

**Expected output:** `Login successful.`

---

## PART F — Find Your Microphone

### Step 16 — List your audio devices

```powershell
python -c "import sounddevice as sd; print(sd.query_devices())"
```

You'll see a numbered list of audio devices. Find your laptop's microphone — look for something with **"in"** channels greater than 0, commonly named "Microphone Array" or "Microphone (Realtek...)". **Note its index number** (the number at the start of that line).

### Step 17 — Update the mic index in the code

```powershell
notepad sender_pipeline.py
```

Find this line near the top:
```python
MIC_INDEX = 7  # your mic's index
```

Change `7` to **your** mic's index number from Step 16. Save and close.

### Step 18 — Test your microphone works

```powershell
python -c "
import sounddevice as sd
import numpy as np
device_info = sd.query_devices(MIC_INDEX_HERE)
native_rate = int(device_info['default_samplerate'])
print(f'Recording 3 seconds — speak loudly now...')
audio = sd.rec(int(3 * native_rate), samplerate=native_rate, channels=device_info['max_input_channels'], dtype='float32', device=MIC_INDEX_HERE)
sd.wait()
print(f'Max volume: {np.max(np.abs(audio)):.4f}')
"
```

Replace `MIC_INDEX_HERE` (both places) with your actual mic index number from Step 16 before running.

**Expected output:** a volume number above 0.05 after you speak. If it shows near 0.0000, check Windows microphone privacy settings (Settings → Privacy & Security → Microphone → ensure desktop apps are allowed).

---

## PART G — Set Up the Web Interface

### Step 19 — Check if Node.js is installed

```powershell
node --version
```

**If you see a version number** → skip to Step 21.
**If you get an error** → continue to Step 20.

### Step 20 — Install Node.js

1. Go to [nodejs.org](https://nodejs.org)
2. Download the **LTS** version, run the installer with default settings
3. On the "Tools for Native Modules" screen, leave the checkbox **unchecked**, click Next
4. Close and reopen PowerShell, confirm with `node --version`

### Step 21 — Install the frontend's dependencies

```powershell
cd itantra-ui
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm install
```

This downloads ~300MB of packages, takes a few minutes.

**Expected output:** ends with `added XXX packages`.

---

## PART H — Run Everything

You need **two PowerShell windows** open at the same time.

### Step 22 — Window 1: Start the Python backend

```powershell
cd Desktop\iTantra
venv\Scripts\Activate.ps1
python api_server.py
```

**Expected output (after model downloads finish — first run only, several GB, several minutes):**
```
Starting iTantra API server on http://localhost:5000
Running on http://127.0.0.1:5000
```

**Leave this window open.**

### Step 23 — Window 2: Start the web interface

Open a **new** PowerShell window:

```powershell
cd Desktop\iTantra\itantra-ui
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run dev
```

**Expected output:**
```
Local: http://localhost:3000
```

### Step 24 — Test it

Open your browser and go to:
```
http://localhost:3000
```

You should see the iTantra interface. Select a language and bitrate mode, click the record button, and speak a short sentence. After a short wait (model processing takes time, especially on CPU-only laptops), you should see:
- Your transcribed text
- Bandwidth reduction stats
- A playable audio clip of the synthesized speech response

---

## Common Issues

### "No speech detected" every time
- Check your mic index is correct (Step 16-17)
- Speak clearly and loudly during the "Listening..." phase
- Check Windows microphone privacy permissions

### `PortAudioError` or `DirectSound error`
- Close other apps that might be using the microphone (Zoom, Teams, browser tabs with mic access)
- Restart the Windows Audio service: open PowerShell **as Administrator**, run `Restart-Service -Name AudioSrv -Force`
- As a last resort, restart your laptop

### CORS error in the browser console
- Make sure **both** Window 1 (Flask) and Window 2 (npm) are running at the same time
- Refresh the browser page after both are confirmed running

### Everything is slow (30-45+ seconds per response)
- Expected on CPU-only laptops (no NVIDIA GPU) — the AI models are computationally heavy. This is not a bug.

### `GatedRepoError` when loading the TTS model
- You haven't completed Part E (Hugging Face account + access request + login) — go back and complete Steps 12-15

---

## Reporting Back

If you get stuck, share:
1. Which **Step number** you're on
2. The **exact command** you ran
3. The **full error message** (not a summary or screenshot description)
4. Whether you have an NVIDIA GPU or not (from Step 7)

This lets whoever's helping fix it quickly instead of guessing.
