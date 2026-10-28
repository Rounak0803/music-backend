const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
// Use the port Render assigns, or default to 3000 for local Termux testing
const PORT = process.env.PORT || 3000;

// Allow your Flutter app to make requests to this backend
app.use(cors());

// Health check route so Render knows the server is alive
app.get('/', (req, res) => {
  res.send('Music App Backend is Running!');
});

// Endpoint to get the direct audio stream URL
app.get('/api/stream', (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ error: "Missing 'url' query parameter" });
  }

  // -f bestaudio: forces highest quality audio
  // -g: tells yt-dlp to just return the raw stream URL, not download the file
  const yt = spawn('yt-dlp', ['-f', 'bestaudio', '-g', videoUrl]);

  let audioUrl = '';
  let errorOutput = '';

  // Capture the output URL
  yt.stdout.on('data', (data) => {
    audioUrl += data.toString();
  });

  // Capture any errors
  yt.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  // When yt-dlp finishes running
  yt.on('close', (code) => {
    if (code === 0) {
      // Send the clean, playable stream URL back to Flutter
      res.json({ streamUrl: audioUrl.trim() });
    } else {
      console.error("yt-dlp error:", errorOutput);
      res.status(500).json({ error: "Failed to fetch audio stream" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

