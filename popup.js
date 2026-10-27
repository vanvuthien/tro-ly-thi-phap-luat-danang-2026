/**
 * AI Legal Assistant - Popup Logic
 * Settings management, OpenAI connection test, and NotebookLM-style knowledge source upload.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  const apiKeyInput = document.getElementById('openai-key');
  const btnToggleKey = document.getElementById('btn-toggle-key');
  const modelSelect = document.getElementById('openai-model');
  const baseUrlInput = document.getElementById('openai-base-url');
  const btnTestConn = document.getElementById('btn-test-conn');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const testResultBox = document.getElementById('test-result-box');

  const headerStatusPill = document.getElementById('header-status-pill');
  const headerStatusText = document.getElementById('header-status-text');

  // Knowledge Tab Elements
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('file-input');
  const pasteTitleInput = document.getElementById('paste-title');
  const pasteContentInput = document.getElementById('paste-content');
  const btnAddPaste = document.getElementById('btn-add-paste');
  const customSourcesList = document.getElementById('custom-sources-list');
  const customSourceCount = document.getElementById('custom-source-count');

  let currentCustomSources = [];

  // 1. Tab Switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Toggle API Key visibility
  btnToggleKey.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      btnToggleKey.innerText = '🔒';
    } else {
      apiKeyInput.type = 'password';
      btnToggleKey.innerText = '👁️';
    }
  });

  // 2. Load Settings from chrome.storage.local
  async function loadSettings() {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    const data = response?.settings || {};

    if (data.openaiApiKey) {
      apiKeyInput.value = data.openaiApiKey;
      headerStatusPill.querySelector('.status-dot-sm').className = 'status-dot-sm';
      headerStatusText.innerText = 'Sẵn sàng';
    } else {
      headerStatusPill.querySelector('.status-dot-sm').className = 'status-dot-sm warning';
      headerStatusText.innerText = 'Chưa có Key';
    }

    if (data.openaiModel) modelSelect.value = data.openaiModel;
    if (data.openaiBaseUrl) baseUrlInput.value = data.openaiBaseUrl;

    currentCustomSources = data.customSources || [];
    renderCustomSourcesList();
  }

  // 3. Test OpenAI Connection
  btnTestConn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const model = (modelSelect.value || 'gpt-4o-mini').trim();
    const baseUrl = baseUrlInput.value.trim();

    if (!apiKey) {
      showResultBox('Vui lòng nhập API Key trước khi kiểm tra!', false);
      return;
    }

    btnTestConn.innerText = '⏳ Đang kết nối...';
    btnTestConn.disabled = true;

    try {
      const res = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'TEST_OPENAI_CONNECTION',
          payload: { apiKey, model, baseUrl }
        }, response => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else if (response && response.success) resolve(response.data);
          else reject(new Error(response?.error || 'Lỗi kiểm tra'));
        });
      });

      showResultBox('✅ ' + res.message, true);
      headerStatusPill.querySelector('.status-dot-sm').className = 'status-dot-sm';
      headerStatusText.innerText = 'Đã kết nối';
    } catch (err) {
      showResultBox('❌ ' + err.message, false);
      headerStatusPill.querySelector('.status-dot-sm').className = 'status-dot-sm warning';
      headerStatusText.innerText = 'Lỗi kết nối';
    } finally {
      btnTestConn.innerText = '⚡ Kiểm Tra Kết Nối';
      btnTestConn.disabled = false;
    }
  });

  // 4. Save Settings
  btnSaveSettings.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const model = (modelSelect.value || 'gpt-4o-mini').trim();
    const baseUrl = baseUrlInput.value.trim();

    await chrome.storage.local.set({
      openaiApiKey: apiKey,
      openaiModel: model,
      openaiBaseUrl: baseUrl
    });

    showResultBox('✅ Đã lưu cấu hình OpenAI thành công!', true);
    setTimeout(() => {
      testResultBox.style.display = 'none';
    }, 3000);
  });

  function showResultBox(message, isSuccess) {
    testResultBox.className = `alert-box ${isSuccess ? 'success' : 'error'}`;
    testResultBox.innerText = message;
    testResultBox.style.display = 'block';
  }

  // 6. Custom Knowledge Sources (NotebookLM Style)
  function renderCustomSourcesList() {
    customSourceCount.innerText = currentCustomSources.length;

    if (currentCustomSources.length === 0) {
      customSourcesList.innerHTML = '<div class="empty-hint">Chưa có tài liệu tùy chỉnh nào được tải lên.</div>';
      return;
    }

    customSourcesList.innerHTML = '';
    currentCustomSources.forEach((src, idx) => {
      const item = document.createElement('div');
      item.className = 'source-item';
      item.innerHTML = '<div class="source-icon">📄</div><div class="source-info"><div class="source-title"></div><div class="source-meta"></div></div><button class="btn-remove-source" title="Xóa tài liệu này">🗑️</button>';
      item.querySelector('.source-title').textContent = src.title || 'Tài liệu ' + (idx + 1);
      item.querySelector('.source-meta').textContent = `${(String(src.content || '').length / 1024).toFixed(1)} KB • ${String(src.content || '').split('\n').length} dòng`;

      item.querySelector('.btn-remove-source').addEventListener('click', async (e) => {
        currentCustomSources.splice(idx, 1);
        await chrome.storage.local.set({ customSources: currentCustomSources });
        renderCustomSourcesList();
      });

      customSourcesList.appendChild(item);
    });
  }

  // Dropzone File Selection
  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#10b981';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      handleFileUpload(fileInput.files[0]);
    }
  });

  function handleFileUpload(file) {
    if (!/\.(txt|md|json)$/i.test(file.name)) {
      alert('Chỉ hỗ trợ tệp văn bản .txt, .md hoặc .json.');
      fileInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      const newSource = {
        id: 'custom_' + Date.now(),
        title: file.name,
        category: 'Tài liệu người dùng tải lên',
        content: content,
        addedAt: new Date().toISOString()
      };

      currentCustomSources.push(newSource);
      await chrome.storage.local.set({ customSources: currentCustomSources });
      renderCustomSourcesList();
      alert(`Đã thêm tài liệu "${file.name}" vào nguồn tri thức AI!`);
      fileInput.value = '';
    };
    reader.readAsText(file);
  }

  // Quick Paste
  btnAddPaste.addEventListener('click', async () => {
    const title = pasteTitleInput.value.trim() || 'Ghi chú kiến thức ' + (currentCustomSources.length + 1);
    const content = pasteContentInput.value.trim();

    if (!content) {
      alert('Vui lòng dán nội dung kiến thức trước khi thêm!');
      return;
    }

    const newSource = {
      id: 'custom_' + Date.now(),
      title: title,
      category: 'Ghi chú kiến thức thủ công',
      content: content,
      addedAt: new Date().toISOString()
    };

    currentCustomSources.push(newSource);
    await chrome.storage.local.set({ customSources: currentCustomSources });
    renderCustomSourcesList();

    pasteTitleInput.value = '';
    pasteContentInput.value = '';
    alert(`Đã thêm ghi chú "${title}" vào nguồn tri thức AI!`);
  });

  // Initial Load
  loadSettings();
});
