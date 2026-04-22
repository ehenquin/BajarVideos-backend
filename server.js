const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const tmpDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir); // Crea carpeta temporal si no existe
}

app.post('/download', (req, res) => {
    const { url, format } = req.body;

    if (!url) return res.status(400).json({ error: 'URL requerida' });

    const uniqueId = Date.now().toString();
    const isAudio = format === 'audio';

    // Parámetros de yt-dlp según el formato seleccionado
    const formatArg = isAudio
        ? '-x --audio-format mp3'
        : '-f "best[ext=mp4]/best"';

    const outputTemplate = path.join(tmpDir, `media_${uniqueId}.%(ext)s`);

    // Comando directo y seguro
    const command = `yt-dlp ${formatArg} -o "${outputTemplate}" "${url}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('yt-dlp Error:', stderr);
            return res.status(500).json({ error: 'Fallo al procesar la URL o plataforma no soportada.' });
        }

        // Busca el archivo generado rastreando el ID único
        fs.readdir(tmpDir, (err, files) => {
            if (err) return res.status(500).json({ error: 'Error leyendo carpeta temporal.' });

            const downloadedFile = files.find(f => f.includes(uniqueId));

            if (!downloadedFile) return res.status(500).json({ error: 'No se generó el archivo de descarga.' });

            res.json({
                filename: downloadedFile,
                filepath: path.join(tmpDir, downloadedFile)
            });
        });
    });
});

app.get('/file', (req, res) => {
    const file = req.query.path;
    const name = req.query.name;

    if (!file || !fs.existsSync(file)) {
        return res.status(404).send('El archivo no existe o ya expiró.');
    }

    res.download(file, name, (err) => {
        if (err) console.error("Error al transferir el archivo:", err);

        // Se autolimpieza eliminando el archivo local tras enviarlo a memoria
        fs.unlink(file, () => { });
    });
});

app.listen(PORT, () => {
    console.log(`Backend de descargas corriendo en el puerto ${PORT}`);
});
