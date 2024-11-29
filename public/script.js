const loginForm = document.getElementById("loginForm");
const loginPage = document.getElementById("loginPage");
const mainContent = document.getElementById("mainContent");
const uploadForm = document.getElementById("uploadForm");
const fileInput = document.getElementById("fileInput");
const submitButton = document.getElementById("submitButton");
const downloadButton = document.getElementById("downloadButton");
const resultDiv = document.getElementById("result");
const dropZone = document.getElementById('dropZone');
const uploadProgress = document.getElementById('uploadProgress');

let transcriptionUrl = '';

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = document.getElementById("password").value;
  
  try {
    const response = await fetch("/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();
    if (data.success) {
      loginPage.style.display = "none";
      mainContent.style.display = "block";
    } else {
      alert("Mot de passe incorrect");
    }
  } catch (error) {
    alert("Erreur lors de la vérification du mot de passe");
  }
});

// Drag & Drop handlers
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

['dragleave', 'dragend'].forEach(type => {
  dropZone.addEventListener(type, () => {
    dropZone.classList.remove('drag-over');
  });
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('audio/')) {
    handleFile(file);
  }
});

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) {
    handleFile(e.target.files[0]);
  }
});

async function handleFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  dropZone.style.display = 'none';
  uploadProgress.style.display = 'block';
  resultDiv.style.display = 'none';

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    
    // Configuration du bouton de téléchargement
    downloadButton.href = data.file;
    downloadButton.setAttribute('download', 'transcription.txt');
    
    uploadProgress.style.display = 'none';
    resultDiv.style.display = 'block';
  } catch (error) {
    alert('Erreur : ' + error.message);
    dropZone.style.display = 'block';
    uploadProgress.style.display = 'none';
  }
} 