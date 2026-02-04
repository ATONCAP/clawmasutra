#!/bin/bash
# Generate HeyGen avatar video from voiceover audio
#
# Usage: ./generate-avatar-video.sh [audio_file] [output_file]
#
# Requires: HEYGEN_API_KEY environment variable

set -e

AUDIO_FILE="${1:-output/clawmasutra-demo.mp3}"
OUTPUT_FILE="${2:-output/clawmasutra-avatar.mp4}"
HEYGEN_API_KEY="${HEYGEN_API_KEY:-}"

if [ -z "$HEYGEN_API_KEY" ]; then
    echo "Error: HEYGEN_API_KEY environment variable not set"
    echo "Usage: export HEYGEN_API_KEY=your-key-here"
    exit 1
fi

if [ ! -f "$AUDIO_FILE" ]; then
    echo "Error: Audio file not found: $AUDIO_FILE"
    exit 1
fi

DEMO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DEMO_DIR"

echo "=== HeyGen Avatar Video Generation ==="
echo "Audio: $AUDIO_FILE"
echo "Output: $OUTPUT_FILE"
echo ""

# Step 1: Upload audio to HeyGen
echo "Step 1: Uploading audio..."
UPLOAD_RESPONSE=$(curl -s -X POST "https://api.heygen.com/v1/asset" \
  -H "X-Api-Key: $HEYGEN_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@$AUDIO_FILE")

AUDIO_ASSET_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.asset_id // .data.id // empty')
if [ -z "$AUDIO_ASSET_ID" ]; then
    echo "Error uploading audio:"
    echo "$UPLOAD_RESPONSE" | jq .
    exit 1
fi
echo "Audio uploaded: $AUDIO_ASSET_ID"

# Step 2: List available avatars
echo ""
echo "Step 2: Getting avatar list..."
AVATARS_RESPONSE=$(curl -s -X GET "https://api.heygen.com/v2/avatars" \
  -H "X-Api-Key: $HEYGEN_API_KEY")

# Pick first avatar (or you can specify a specific one)
AVATAR_ID=$(echo "$AVATARS_RESPONSE" | jq -r '.data.avatars[0].avatar_id // empty')
if [ -z "$AVATAR_ID" ]; then
    echo "No avatars found. Response:"
    echo "$AVATARS_RESPONSE" | jq .
    exit 1
fi
echo "Using avatar: $AVATAR_ID"

# Step 3: Create video with audio-driven avatar
echo ""
echo "Step 3: Creating video..."
VIDEO_REQUEST=$(cat <<EOF
{
  "video_inputs": [
    {
      "character": {
        "type": "avatar",
        "avatar_id": "$AVATAR_ID",
        "avatar_style": "normal"
      },
      "voice": {
        "type": "audio",
        "audio_asset_id": "$AUDIO_ASSET_ID"
      }
    }
  ],
  "dimension": {
    "width": 1920,
    "height": 1080
  }
}
EOF
)

VIDEO_RESPONSE=$(curl -s -X POST "https://api.heygen.com/v2/video/generate" \
  -H "X-Api-Key: $HEYGEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$VIDEO_REQUEST")

VIDEO_ID=$(echo "$VIDEO_RESPONSE" | jq -r '.data.video_id // empty')
if [ -z "$VIDEO_ID" ]; then
    echo "Error creating video:"
    echo "$VIDEO_RESPONSE" | jq .
    exit 1
fi
echo "Video generation started: $VIDEO_ID"

# Step 4: Poll for completion
echo ""
echo "Step 4: Waiting for video generation..."
MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))

    STATUS_RESPONSE=$(curl -s -X GET "https://api.heygen.com/v1/video_status.get?video_id=$VIDEO_ID" \
      -H "X-Api-Key: $HEYGEN_API_KEY")

    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.data.status // empty')

    case "$STATUS" in
        "completed")
            VIDEO_URL=$(echo "$STATUS_RESPONSE" | jq -r '.data.video_url // empty')
            echo "Video completed!"
            break
            ;;
        "failed")
            ERROR=$(echo "$STATUS_RESPONSE" | jq -r '.data.error // "Unknown error"')
            echo "Video generation failed: $ERROR"
            exit 1
            ;;
        "processing"|"pending")
            PROGRESS=$(echo "$STATUS_RESPONSE" | jq -r '.data.progress // 0')
            echo -ne "  Processing... ${PROGRESS}% (attempt $ATTEMPT/$MAX_ATTEMPTS)\r"
            sleep 10
            ;;
        *)
            echo "Unknown status: $STATUS"
            echo "$STATUS_RESPONSE" | jq .
            sleep 10
            ;;
    esac
done

if [ -z "$VIDEO_URL" ]; then
    echo "Timed out waiting for video generation"
    exit 1
fi

# Step 5: Download video
echo ""
echo "Step 5: Downloading video..."
curl -s -L "$VIDEO_URL" -o "$OUTPUT_FILE"

echo ""
echo "=== Done! ==="
echo "Video saved to: $OUTPUT_FILE"
echo ""

# Get video duration
DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUTPUT_FILE" 2>/dev/null || echo "unknown")
SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
echo "Duration: ${DURATION}s"
echo "Size: $SIZE"
echo ""
echo "Opening video..."
open "$OUTPUT_FILE"
