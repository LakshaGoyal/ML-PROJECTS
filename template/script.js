const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const scanPreview = document.getElementById('scan-preview');
const scanLine = document.getElementById('scan-line');
const analyzeBtn = document.getElementById('analyze-btn');
const btnText = document.getElementById('btn-text');
const loader = document.getElementById('loader');
const resultPlaceholder = document.getElementById('result-placeholder');
const resultDisplay = document.getElementById('result-display');
const predictionTitle = document.getElementById('prediction-title');
const confidenceVal = document.getElementById('confidence-val');
const meterFill = document.getElementById('meter-fill');
const statsGrid = document.getElementById('stats-grid');

let currentFile = null;

// Interaction Handlers
dropArea.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleUpload(e.target.files[0]);
});

dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('active');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('active');
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('active');
    if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files[0]);
});

function handleUpload(file) {
    if (!file.type.startsWith('image/')) {
        showError('Invalid file type. Please upload an MRI scan image.');
        return;
    }

    currentFile = file;
    analyzeBtn.disabled = false;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        scanPreview.src = e.target.result;
        scanPreview.style.display = 'block';
        dropArea.style.display = 'none';
        
        // Reset analysis
        resultDisplay.style.display = 'none';
        resultPlaceholder.style.display = 'block';
        scanLine.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

analyzeBtn.addEventListener('click', async () => {
    if (!currentFile) return;

    // UI State: Scanning
    analyzeBtn.disabled = true;
    btnText.textContent = 'SCANNING...';
    loader.style.display = 'block';
    scanLine.style.display = 'block';
    resultPlaceholder.querySelector('p').textContent = 'Analyzing neural patterns...';

    const formData = new FormData();
    formData.append('file', currentFile);

    try {
        const startTime = Date.now();
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        // Artificial delay for "premium" scanning feel if it's too fast
        const elapsed = Date.now() - startTime;
        if (elapsed < 2000) await new Promise(r => setTimeout(r, 2000 - elapsed));

        if (data.success) {
            showResults(data);
        } else {
            showError('Diagnostic failure. Please recalibrate input.');
        }
    } catch (err) {
        showError('System connection error. Verify backend status.');
        console.error(err);
    } finally {
        loader.style.display = 'none';
        btnText.textContent = 'INITIALIZE SCAN';
        analyzeBtn.disabled = false;
        scanLine.style.display = 'none';
    }
});

function showResults(data) {
    resultPlaceholder.style.display = 'none';
    resultDisplay.style.display = 'block';

    predictionTitle.textContent = data.class;
    const conf = (data.confidence * 100).toFixed(1);
    confidenceVal.textContent = conf + '%';
    
    // Animate meter
    setTimeout(() => {
        meterFill.style.width = conf + '%';
    }, 100);

    // Populate stats
    statsGrid.innerHTML = '';
    Object.entries(data.probabilities).forEach(([cls, prob]) => {
        const item = document.createElement('div');
        item.className = 'stat-item';
        item.innerHTML = `
            <span class="stat-label">${cls.toUpperCase()}</span>
            <span class="stat-value">${(prob * 100).toFixed(2)}%</span>
        `;
        statsGrid.appendChild(item);
    });
}

function showError(msg) {
    alert(msg);
}
