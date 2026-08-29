export type RecorderState =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'transmitting'
  | 'success'
  | 'error'

export type BitrateMode = 'HIGH' | 'MEDIUM' | 'LOW' | 'EXTREME'

export type Priority = 'normal' | 'emergency'

export type Language = 'en' | 'hi' | 'ta' | 'te'

export type DeliveryStatus = 'delivered' | 'recovered' | 'failed'

export interface BitrateOption {
  mode: BitrateMode
  kbps: number
  label: string
}

export interface TransmissionStats {
  originalBytes: number
  transmittedBytes: number
  reductionPct: number
  status: DeliveryStatus
  packetsTotal: number
  packetsLost: number
  packetsRetried: number
  durationSec: number
}

export const BITRATE_OPTIONS: BitrateOption[] = [
  { mode: 'HIGH', kbps: 8, label: '8kbps' },
  { mode: 'MEDIUM', kbps: 4, label: '4kbps' },
  { mode: 'LOW', kbps: 1, label: '1kbps' },
  { mode: 'EXTREME', kbps: 0.3, label: '0.3kbps' },
]

export const LANGUAGES: {
  code: Language
  label: string
  voice: string
  samples: string[]
}[] = [
  {
    code: 'en',
    label: 'English',
    voice: 'en-US',
    samples: [
      'Requesting immediate medical evacuation at grid four-seven-alpha. Two casualties, one critical.',
      'Bridge on route nine is down. Reroute all supply convoys through the eastern pass.',
      'Fire spreading toward the northern sector. Evacuate residents within two kilometers now.',
      'Team bravo secured the shelter. Awaiting further instructions from command.',
    ],
  },
  {
    code: 'hi',
    label: 'Hindi',
    voice: 'hi-IN',
    samples: [
      'तुरंत चिकित्सा सहायता भेजें। ग्रिड चार-सात पर दो घायल हैं।',
      'उत्तर की ओर आग फैल रही है। दो किलोमीटर के भीतर सभी को निकालें।',
      'रास्ता नंबर नौ बंद है। सभी वाहनों को पूर्वी मार्ग से भेजें।',
    ],
  },
  {
    code: 'ta',
    label: 'Tamil',
    voice: 'ta-IN',
    samples: [
      'உடனடி மருத்துவ உதவி தேவை. கட்டம் நான்கு-ஏழில் இரண்டு காயம்.',
      'வடக்கு பகுதியில் தீ பரவுகிறது. இரண்டு கிலோமீட்டருக்குள் அனைவரையும் வெளியேற்றுங்கள்.',
    ],
  },
  {
    code: 'te',
    label: 'Telugu',
    voice: 'te-IN',
    samples: [
      'వెంటనే వైద్య సహాయం పంపండి. గ్రిడ్ నాలుగు-ఏడు వద్ద ఇద్దరు గాయపడ్డారు.',
      'ఉత్తర దిశగా మంటలు వ్యాపిస్తున్నాయి. రెండు కిలోమీటర్ల లోపు అందరినీ ఖాళీ చేయించండి.',
    ],
  },
]
