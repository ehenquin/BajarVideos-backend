const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const tmpDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
}

app.post('/download', (req, res) => {
    const { url, format } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL requerida' });
    }

    const id = Date.now();
    const output = path.join(tmpDir, `file_${id}.%(ext)s`);
    const isAudio = format === 'audio';

    // 🔥 FORMATOS ROBUSTOS
    const args = isAudio
        ? ['-x', '--audio-format', 'mp3', '--no-playlist', '-o', output, url]
        : ['-f', 'bv*+ba/best', '--merge-output-format', 'mp4', '--no-playlist', '-o', output, url];

    const ytdlp = spawn('yt-dlp', args);

    let errorMsg = '';

    ytdlp.stderr.on('data', (data) => {
        errorMsg += data.toString();
        console.log(data.toString());
    });

    ytdlp.on('close', (code) => {
        if (code !== 0) {
            console.error('ERROR yt-dlp:', errorMsg);

            return res.status(500).json({
                error: 'No se pudo procesar el video',
                detail: errorMsg
            });
        }

        fs.readdir(tmpDir, (err, files) => {
            if (err) {
                return res.status(500).json({ error: 'Error interno' });
            }

            const file = files.find(f => f.includes(id));

            if (!file) {
                return res.status(500).json({ error: 'Archivo no generado' });
            }

            res.json({
                filename: file,
                filepath: path.join(tmpDir, file)
            });
        });
    });
});

app.get('/file', (req, res) => {
    const file = req.query.path;
    const name = req.query.name;

    if (!file || !fs.existsSync(file)) {
        return res.status(404).send('Archivo no disponible');
    }

    res.download(file, name, () => {
        fs.unlink(file, () => { });
    });
});

app.listen(PORT, () => {
    console.log('Servidor corriendo en puerto', PORT);
});
