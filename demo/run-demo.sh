#!/bin/bash
# Clawmasutra Demo Runner
# Records screen while playing voiceover and automating UI

set -e

DEMO_DIR="$(cd "$(dirname "$0")" && pwd)"
AUDIO_FILE="$DEMO_DIR/output/clawmasutra-demo.mp3"
OUTPUT_VIDEO="$DEMO_DIR/output/clawmasutra-demo-video.mp4"
TEMP_VIDEO="$DEMO_DIR/output/temp-screen.mp4"

# Check audio exists
if [ ! -f "$AUDIO_FILE" ]; then
    echo "Error: Audio file not found at $AUDIO_FILE"
    exit 1
fi

# Get audio duration
DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$AUDIO_FILE")
echo "Audio duration: ${DURATION}s"

# Browser automation function using AppleScript
click_tab() {
    local tab_name=$1
    osascript -e "
        tell application \"System Events\"
            tell process \"Google Chrome\"
                set frontmost to true
                delay 0.2
                -- Click on tab by name
                try
                    click button \"$tab_name\" of group 1 of group 1 of group 1 of window 1
                end try
            end tell
        end tell
    " 2>/dev/null || true
}

# Function to click coordinates (backup method)
click_coords() {
    local x=$1
    local y=$2
    osascript -e "
        tell application \"System Events\"
            click at {$x, $y}
        end tell
    " 2>/dev/null || true
}

# Function to scroll down
scroll_down() {
    osascript -e "
        tell application \"System Events\"
            tell process \"Google Chrome\"
                set frontmost to true
                key code 125 using {command down}
            end tell
        end tell
    " 2>/dev/null || true
}

scroll_up() {
    osascript -e "
        tell application \"System Events\"
            tell process \"Google Chrome\"
                set frontmost to true
                key code 126 using {command down}
            end tell
        end tell
    " 2>/dev/null || true
}

echo "Starting demo recording..."
echo "Make sure Chrome is showing localhost:5173"
echo ""
echo "Starting in 3 seconds..."
sleep 3

# Bring Chrome to front
osascript -e 'tell application "Google Chrome" to activate'
sleep 0.5

# Start screen recording with ffmpeg (capture screen 0)
echo "Starting screen capture..."
ffmpeg -y -f avfoundation -framerate 30 -i "1:none" -t "$DURATION" \
    -c:v libx264 -preset ultrafast -crf 18 \
    "$TEMP_VIDEO" 2>/dev/null &
FFMPEG_PID=$!

# Wait a moment for recording to start
sleep 1

# Play audio
echo "Playing audio..."
afplay "$AUDIO_FILE" &
AUDIO_PID=$!

# Timeline of UI actions based on walkthrough.yaml
# Format: sleep_until action

# Intro (0-25s) - Show header/gallery
sleep 3

# The Metaphor (25-50s) - Scroll through gallery
sleep 22
scroll_down

sleep 5
scroll_down

# Architecture (50-75s)
sleep 5
scroll_up

# Solo Positions (75-117s) - Scroll to solo section
sleep 20

# Duet Positions (117-177s) - Scroll to duet section
sleep 42
scroll_down

# Group Positions (177-225s) - Scroll to group section
sleep 20
scroll_down

sleep 28

# Crypto Positions (225-258s)
scroll_down
sleep 33

# Gallery & Observation (258-285s) - Switch to Agent Stream tab
sleep 5
# Try clicking Agent Stream tab (approximate position)
osascript -e '
tell application "System Events"
    tell process "Google Chrome"
        set frontmost to true
        key code 48 -- Tab key
        delay 0.1
        key code 36 -- Enter
    end tell
end tell
' 2>/dev/null || true

sleep 22

# Healing Arts (285-304s) - Back to gallery
sleep 5

# Conclusion (304-330s)
sleep 26

# Wait for processes to finish
wait $AUDIO_PID 2>/dev/null || true
wait $FFMPEG_PID 2>/dev/null || true

echo "Screen capture complete."

# Combine video with audio
echo "Combining video with audio..."
ffmpeg -y -i "$TEMP_VIDEO" -i "$AUDIO_FILE" \
    -c:v libx264 -preset medium -crf 20 \
    -c:a aac -b:a 192k \
    -shortest \
    "$OUTPUT_VIDEO"

# Clean up temp file
rm -f "$TEMP_VIDEO"

echo ""
echo "Done! Output saved to: $OUTPUT_VIDEO"
echo "Opening video..."
open "$OUTPUT_VIDEO"
