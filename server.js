const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const outputDir = path.join(__dirname, 'clips');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

app.post('/api/clip', async (req, res) => {
    const { videoUrl, startTime, duration } = req.body;
    
    if (!ytdl.validateURL(videoUrl)) {
        return res.status(400).json({ error: "Link YouTube tidak valid!" });
    }

    try {
        console.log(`📥 Memproses video langsung dari stream YouTube: ${videoUrl}`);
        
        const outputFileName = `clip_${Date.now()}.mp4`;
        const outputPath = path.join(outputDir, outputFileName);

        // Streaming langsung dari YouTube ke FFmpeg tanpa folder temp lokal
        ffmpeg(ytdl(videoUrl, { quality: 'highestvideo', filter: 'videoandaudio' }))
            .setStartTime(parseInt(startTime))
            .setDuration(parseInt(duration))
            .output(outputPath)
            .on('end', () => {
                console.log(`✅ Klip berhasil dibuat: ${outputFileName}`);
                res.json({ 
                    success: true, 
                    message: "Klip video berhasil dibuat!",
                    downloadUrl: `http://localhost:${PORT}/clips/${outputFileName}`
                });
            })
            .on('error', (err) => {
                console.error("❌ Error FFmpeg:", err);
                res.status(500).json({ success: false, error: "Gagal memotong video." });
            })
            .run();

    } catch (error) {
        console.error("❌ Error Server:", error);
        res.status(500).json({ success: false, error: "Gagal memproses video YouTube." });
    }
});

app.use('/clips', express.static(outputDir));

app.listen(PORT, () => {
    console.log(`Server aktif di http://localhost:${PORT}`);
});