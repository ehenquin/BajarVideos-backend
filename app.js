// ATENCIÓN: Actualizar esta URL con el endpoint real de tu VPS, Render o Railway
const BACKEND_URL = 'https://bajarvideos-backend-production.up.railway.app';

const form = document.getElementById('downloadForm');
const urlInput = document.getElementById('urlInput');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const loader = document.getElementById('loader');
const resultArea = document.getElementById('resultArea');
const resultText = document.getElementById('resultText');
const downloadLink = document.getElementById('downloadLink');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const url = urlInput.value.trim();
    const format = document.querySelector('input[name="format"]:checked').value;

    if (!url) return;

    // UI - Cargando
    btnText.classList.add('hidden');
    loader.classList.remove('hidden');
    submitBtn.disabled = true;
    resultArea.classList.add('hidden');

    try {
        const response = await fetch(`${BACKEND_URL}/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, format })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Error procesando la URL');

        // UI - Éxito
        resultText.textContent = 'Archivo procesado con éxito';
        downloadLink.href = `${BACKEND_URL}/file?path=${encodeURIComponent(data.filepath)}&name=${encodeURIComponent(data.filename)}`;
        downloadLink.download = data.filename;

        resultArea.classList.remove('hidden');

    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        // UI - Reset
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
        submitBtn.disabled = false;
        urlInput.value = '';
    }
});
