# Clawmasutra Demo

Narrated walkthrough demo using [Agenvo](https://github.com/alphatoncapital/agenvo).

## Files

- `walkthrough.yaml` - Full 4:30 demo script with 40+ segments

## Usage

### Prerequisites

```bash
npm install -g agenvo

# Set TTS provider key
export ELEVENLABS_API_KEY=your-key
# or
export OPENAI_API_KEY=your-key
```

### Generate Voiceover

```bash
# Preview the script
agenvo preview walkthrough.yaml

# Validate
agenvo validate walkthrough.yaml

# Generate audio with subtitles
agenvo generate walkthrough.yaml -o output/clawmasutra-demo.mp3 --subtitles srt,vtt

# Use OpenAI instead of ElevenLabs
agenvo generate walkthrough.yaml -o output/clawmasutra-demo.mp3 -p openai -v nova
```

### Output

The generated files can be used to create a video:

- `output/clawmasutra-demo.mp3` - Narration audio
- `output/clawmasutra-demo.srt` - Subtitles (SRT format)
- `output/clawmasutra-demo.vtt` - Subtitles (WebVTT format)

## Script Structure

| Section | Time | Duration | Content |
|---------|------|----------|---------|
| Intro | 0:00 | 25s | What is Clawmasutra |
| The Metaphor | 0:25 | 25s | Kama Sutra → Agent Collaboration |
| Architecture | 0:50 | 25s | MCP-first design |
| Solo Positions | 1:15 | 35s | Contemplator, Wanderer |
| Duet Positions | 1:50 | 45s | Mirror demo in depth |
| Group Positions | 2:35 | 35s | Swarm demo |
| Crypto Positions | 3:10 | 25s | Arbitrageur, Oracle Choir, Liquidity Lotus |
| Gallery | 3:35 | 20s | Visual observation |
| Healing Arts | 3:55 | 15s | Pattern Doctor, Recovery |
| Conclusion | 4:10 | 20s | Summary and CTA |

## Voice Options

### ElevenLabs (default)

| Voice | ID | Style |
|-------|-----|-------|
| Rachel | `EXAVITQu4vr4xnSDxMaL` | Professional, clear |
| Adam | `21m00Tcm4TlvDq8ikWAM` | Deep, authoritative |

### OpenAI

| Voice | Style |
|-------|-------|
| `nova` | Friendly, upbeat |
| `onyx` | Deep, authoritative |
| `shimmer` | Clear, professional |

## Customization

Edit `walkthrough.yaml` to:

- Adjust timing (`startTime`, `pauseAfter`)
- Change voice (`defaultVoice` or per-segment `voice`)
- Modify narration text
- Update `actionDescription` for video editing guidance

## Creating the Video

The `actionDescription` field in each segment provides guidance for screen recording/animation. Recommended workflow:

1. Generate voiceover with Agenvo
2. Import audio into video editor
3. Record/animate each segment following actionDescription
4. Sync video to audio using timestamps
5. Add subtitles from generated SRT/VTT
