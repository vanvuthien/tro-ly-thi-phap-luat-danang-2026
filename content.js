/**
 * AI Legal Assistant - Content Script
 * Automatically detects quiz questions on timhieuphapluatdanang2026.com & myaloha.vn,
 * queries the knowledge base + OpenAI API and displays suggestions,
 * and shows suggestions without interacting with exam controls.
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__AILegalAssistantInjected) return;
  window.__AILegalAssistantInjected = true;

  console.log('%c[AI Legal Assistant] Initializing on page...', 'color: #10b981; font-weight: bold;');

  // State
  let engine = null;
  let settings = {
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
    openaiBaseUrl: 'https://api.openai.com/v1',
    mode: 'safe_highlight',
    customSources: []
  };
  let isSolving = false;
  let questionCheckTimer = null;
  let lastPredictionInput = null;
  let predictionRequestInFlight = false;
  let lastVisibleQuestionSignature = null;
  let highlightedChoice = null;
  let lastSuggestedAnswer = null;

  function getContestTopic() {
    const path = location.pathname.replace(/\/$/, '');
    if (path === '/cuoc-thi/tim-hieu-phap-luat-ve-lao-dong-viec-lam-va-an-sinh-xa-hoi-1') return 'labor';
    if (path === '/cuoc-thi/tim-hieu-quy-dinh-phap-luat-ve-bao-ve-du-lieu-ca-nhan-2') return 'privacy';
    return null;
  }

  // Initialize Knowledge Engine & Settings
  async function initAssistant() {
    try {
      // Load settings from storage
      const res = await new Promise(resolve => {
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, resolve);
      });
      if (res && res.settings) {
        settings = { ...settings, ...res.settings };
      }
      settings.mode = 'safe_highlight';

      // Initialize KnowledgeEngine
      if (typeof KnowledgeEngine !== 'undefined') {
        engine = new KnowledgeEngine();
        await engine.init(settings.customSources);
      }

    } catch (err) {
      console.error('[AI Legal Assistant] Initialization error:', err);
    } finally {
      renderFloatingHUD();
      updateHUDStatus();
      watchVisibleQuestions();
    }
  }

  // 3. Render Floating HUD Widget
  function renderFloatingHUD() {
    if (document.getElementById('ai-legal-hud')) return;

    const hud = document.createElement('div');
    hud.id = 'ai-legal-hud';
    hud.innerHTML = `
      <div class="hud-min-icon" title="Mở Trợ Lý Pháp Luật">⚖️</div>
      <div class="hud-header" id="hud-drag-handle">
        <div class="hud-header-title">
          <div class="icon-badge">⚖️</div>
          <span>AI Trợ Lý Pháp Luật</span>
        </div>
        <div class="hud-header-actions">
          <div class="hud-btn-icon" id="hud-settings-btn" title="Mở Cài Đặt">⚙️</div>
          <div class="hud-btn-icon" id="hud-min-btn" title="Thu nhỏ">─</div>
        </div>
      </div>
      <div class="hud-body">
        <div class="hud-status-bar">
          <div class="hud-status-indicator">
            <span class="status-dot" id="hud-status-dot"></span>
            <span id="hud-status-text">Đang khởi tạo...</span>
          </div>
          <span class="hud-model-tag" id="hud-model-tag">GPT-4O-MINI</span>
        </div>

        <div class="hud-mode-row">📖 Tự hiện gợi ý khi chuyển câu; bạn tự chọn đáp án</div>

        <div class="hud-action-row" id="hud-default-actions">
          <button class="hud-primary-btn" id="btn-solve-current">
            🎯 GIẢI CÂU NÀY
          </button>
        </div>

        <div class="hud-participant-card" id="hud-participant-card" role="status" style="display: none;">
          <div class="hud-participant-heading">📊 Thống kê tại <span id="hud-participant-time">—</span></div>
          <div class="hud-participant-stats">
            <div><span>Lượt đăng ký</span><strong id="hud-participant-joined">—</strong></div>
            <div><span>Lượt thi hoàn thành</span><strong id="hud-participant-finished">—</strong></div>
          </div>
          <div class="hud-participant-note" id="hud-participant-note"></div>
        </div>

        <div class="hud-result-card" id="hud-result-card" style="display: none;">
          <div class="hud-result-header">
            <div class="hud-answer-badge" id="res-badge">ĐÁP ÁN: A</div>
          <div class="hud-confidence-pill" id="res-confidence">Khớp ngân hàng</div>
          </div>
          <div class="hud-answer-text" id="res-answer-text">...</div>
          <div class="hud-law-reference" id="res-law-article">📜 Căn cứ: ...</div>
          <div class="hud-reasoning-text" id="res-reasoning">...</div>
        </div>
      </div>
    `;

    document.body.appendChild(hud);
    attachHUDEvents(hud);
  }

  // 4. Attach Events to HUD
  function attachHUDEvents(hud) {
    // Minimize / Expand
    const minBtn = hud.querySelector('#hud-min-btn');
    const minIcon = hud.querySelector('.hud-min-icon');

    const toggleMinimize = () => {
      hud.classList.toggle('minimized');
    };

    minBtn.addEventListener('click', toggleMinimize);
    minIcon.addEventListener('click', toggleMinimize);

    // Settings button -> open popup / alert guide
    hud.querySelector('#hud-settings-btn').addEventListener('click', () => {
      alert('Vui lòng bấm vào biểu tượng Extension "AI Trợ Lý Pháp Luật" trên thanh công cụ của trình duyệt Chrome để cấu hình OpenAI API Key và tải thêm tệp tài liệu!');
    });

    // Solve Current
    hud.querySelector('#btn-solve-current').addEventListener('click', () => {
      solveCurrentQuestion();
    });

    // Make HUD Draggable
    makeHUDDraggable(hud);
  }

  // Draggable HUD functionality
  function makeHUDDraggable(hud) {
    const handle = hud.querySelector('#hud-drag-handle');
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('.hud-btn-icon')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = hud.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      hud.style.right = 'auto';
      hud.style.bottom = 'auto';
      hud.style.left = `${initialLeft}px`;
      hud.style.top = `${initialTop}px`;

      const onMouseMove = (moveEvent) => {
        if (!isDragging) return;
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        hud.style.left = `${Math.max(10, Math.min(window.innerWidth - hud.offsetWidth - 10, initialLeft + deltaX))}px`;
        hud.style.top = `${Math.max(10, Math.min(window.innerHeight - hud.offsetHeight - 10, initialTop + deltaY))}px`;
      };

      const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  // Update Status in HUD
  function updateHUDStatus() {
    const dot = document.getElementById('hud-status-dot');
    const text = document.getElementById('hud-status-text');
    const modelTag = document.getElementById('hud-model-tag');

    if (!dot || !text) return;

    if (modelTag) {
      modelTag.innerText = (settings.openaiModel || 'GPT-4O-MINI').toUpperCase();
    }

    if (engine?.isLoaded) {
      dot.className = 'status-dot';
      text.innerText = `Gợi ý đáp án • ${engine.questionsFor(getContestTopic()).length} câu`;
    } else if (!settings.openaiApiKey) {
      dot.className = 'status-dot warning';
      text.innerText = 'Chưa có ngân hàng câu hỏi hoặc API Key';
    } else {
      dot.className = 'status-dot';
      text.innerText = 'OpenAI & Tri thức Sẵn sàng';
    }
  }

  // 5. DOM Inspection: Extract Current Visible Question & Choices
  function extractActiveQuestionDOM() {
    // Strategy 1: Look for MyAloha's visible question container
    // In MyAloha, question containers are div.pb-10 with v-show (style not display:none)
    const allQuestionDivs = Array.from(document.querySelectorAll('div.pb-10'));
    let activeDiv = null;

    for (const div of allQuestionDivs) {
      const style = window.getComputedStyle(div);
      if (style.display !== 'none' && style.visibility !== 'hidden' && div.offsetHeight > 0) {
        // Check if contains "Câu"
        if (/Câu\s+\d+/i.test(div.innerText)) {
          activeDiv = div;
          break;
        }
      }
    }

    // Strategy 2: If no visible pb-10, search for any element containing "Câu [0-9]"
    if (!activeDiv) {
      const allDivs = Array.from(document.querySelectorAll('div, section, article'));
      for (const el of allDivs) {
        if (/^Câu\s+\d+/i.test(el.innerText?.trim()) && el.offsetHeight > 50 && el.offsetHeight < 800) {
          activeDiv = el;
          break;
        }
      }
    }

    if (!activeDiv) {
      return null;
    }

    // Extract Options
    // MyAloha renders options inside labels or elements with input[type="radio"], input[type="checkbox"]
    const options = [];
    const labels = Array.from(activeDiv.querySelectorAll('label'));

    if (labels.length > 0) {
      labels.forEach((lbl, idx) => {
        const input = lbl.querySelector('input[type="radio"], input[type="checkbox"]');
        let text = lbl.innerText.replace(/✓\s*(?:ĐÁP ÁN ĐÚNG|KHỚP NGÂN HÀNG):\s*[A-D]/gi, '').trim();

        // Extract key like A, B, C, D
        let key = String.fromCharCode(65 + idx);
        const keyMatch = text.match(/^([A-D])[\s.:)\-]+([\s\S]*)/i);
        if (keyMatch) {
          key = keyMatch[1].toUpperCase();
          text = keyMatch[2].trim();
        }

        options.push({
          key,
          text,
          labelElement: lbl,
          inputElement: input
        });
      });
    } else {
      // Generic fallback: inputs with name in container
      const inputs = Array.from(activeDiv.querySelectorAll('input[type="radio"], input[type="checkbox"]'));
      inputs.forEach((input, idx) => {
        const parent = input.closest('div, li, p') || input.parentElement;
        const text = parent.innerText.trim().replace(/^[A-D][\s.:)\-]+/i, '');
        const key = String.fromCharCode(65 + idx);
        options.push({
          key,
          text,
          labelElement: parent,
          inputElement: input
        });
      });
    }

    const fullText = activeDiv.innerText || '';
    const firstOption = labels[0]?.innerText?.replace(/✓\s*(?:ĐÁP ÁN ĐÚNG|KHỚP NGÂN HÀNG):\s*[A-D]/gi, '').trim() || '';
    const boundaryByLabel = firstOption ? fullText.indexOf(firstOption) : -1;
    const boundary = boundaryByLabel >= 0 ? boundaryByLabel : fullText.search(/\n\s*A[.):]\s/);
    const questionText = (boundary >= 0 ? fullText.slice(0, boundary) : fullText)
      .replace(/^\s*Câu\s*\d+\s*[.:\-]?\s*/i, '').trim();
    const questionNumber = Number(fullText.match(/^\s*Câu\s*(\d+)/i)?.[1]) || null;

    return {
      container: activeDiv,
      questionNumber,
      questionText,
      options
    };
  }

  // On this contest, question 21 is rendered separately as "Câu tự luận 1".
  // The numeric input's Vue onInput handler stores the answer in the exam state.
  function findPredictionInput() {
    const contestPath = location.pathname.replace(/\/$/, '');
    if (location.origin !== 'https://timhieuphapluatdanang2026.com' ||
        ![
          '/cuoc-thi/tim-hieu-phap-luat-ve-lao-dong-viec-lam-va-an-sinh-xa-hoi-1',
          '/cuoc-thi/tim-hieu-quy-dinh-phap-luat-ve-bao-ve-du-lieu-ca-nhan-2'
        ].includes(contestPath)) {
      return null;
    }
    for (const container of document.querySelectorAll('div.pb-10')) {
      if (container.closest('#ai-legal-hud') ||
          getComputedStyle(container).display === 'none' || container.offsetHeight === 0) continue;
      const input = container.querySelector('input[type="text"][inputmode="numeric"]');
      if (input && !input.disabled && /Câu\s*tự\s*luận\s*1/i.test(container.innerText)) {
        return input;
      }
    }
    return null;
  }

  function showParticipantStatus(message) {
    const card = document.getElementById('hud-participant-card');
    if (!card) return;
    const note = document.getElementById('hud-participant-note');
    if (note) note.textContent = message;
    card.style.display = 'block';
  }

  function setParticipantStats(joinedCount, finishedCount, checkedAt) {
    document.getElementById('hud-participant-joined').textContent =
      Number.isSafeInteger(joinedCount) ? joinedCount.toLocaleString('vi-VN') : '—';
    document.getElementById('hud-participant-finished').textContent =
      Number.isSafeInteger(finishedCount) ? finishedCount.toLocaleString('vi-VN') : '—';
    document.getElementById('hud-participant-time').textContent = checkedAt;
  }

  async function updatePredictionInput(input) {
    if (predictionRequestInFlight) return false;
    predictionRequestInFlight = true;
    setParticipantStats(null, null, '—');
    showParticipantStatus('Đang lấy số liệu từ trang cuộc thi...');
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'GET_CONTEST_PARTICIPANTS' }, result => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else if (result?.success) resolve(result.data);
          else reject(new Error(result?.error || 'Không tải được số lượt thi.'));
        });
      });
      if (findPredictionInput() !== input) return false;

      const { joinedCount, finishedCount } = response;
      if (!Number.isSafeInteger(joinedCount) || joinedCount < 0 ||
          !Number.isSafeInteger(finishedCount) || finishedCount < 0) {
        throw new Error('Số liệu cuộc thi không hợp lệ.');
      }
      const checkedAt = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }).format(new Date(response.checkedAt));
      setParticipantStats(joinedCount, finishedCount, checkedAt);
      showParticipantStatus('Bạn tự điền số dự đoán. Tổng cuối cuộc thi có thể cao hơn.');
      return true;
    } catch (error) {
      if (findPredictionInput() === input) {
        showParticipantStatus(`Không lấy được số lượt thi: ${error.message}`);
      }
      return false;
    } finally {
      predictionRequestInFlight = false;
      const currentInput = findPredictionInput();
      if (currentInput && currentInput !== input) {
        lastPredictionInput = null;
        scheduleQuestionCheck();
      }
    }
  }

  function getQuestionSignature(qData) {
    const normalize = typeof KnowledgeEngine !== 'undefined' &&
      typeof KnowledgeEngine.normalize === 'function'
      ? KnowledgeEngine.normalize
      : value => String(value || '').trim().toLowerCase();
    return JSON.stringify([
      getContestTopic(),
      qData.questionNumber,
      normalize(qData.questionText),
      ...qData.options.map(option => `${option.key}:${normalize(option.text)}`)
    ]);
  }

  function hideSuggestion() {
    const card = document.getElementById('hud-result-card');
    if (card) card.style.display = 'none';
    clearChoiceHighlight();
    lastSuggestedAnswer = null;
  }

  function clearChoiceHighlight() {
    if (!highlightedChoice) return;
    highlightedChoice.classList.remove('ai-correct-highlight');
    delete highlightedChoice.dataset.aiSuggestion;
    delete highlightedChoice.dataset.aiSuggestionKind;
    highlightedChoice = null;
  }

  function highlightSuggestedChoice(qData, answer) {
    const key = String(answer?.answerKey || '').trim().toUpperCase();
    const choice = qData?.options.find(option => option.key === key);
    if (!/^[A-D]$/.test(key) || !choice?.labelElement) {
      clearChoiceHighlight();
      return;
    }
    if (highlightedChoice !== choice.labelElement) clearChoiceHighlight();
    highlightedChoice = choice.labelElement;
    highlightedChoice.classList.add('ai-correct-highlight');
    highlightedChoice.dataset.aiSuggestion = `Gợi ý: ${key}`;
    highlightedChoice.dataset.aiSuggestionKind =
      answer.source === 'Ngân hàng câu hỏi' ? 'bank' : 'ai';
  }

  // Refresh statistics or a verified local suggestion when the visible question changes.
  function checkVisibleQuestion() {
    const predictionInput = findPredictionInput();
    if (predictionInput) {
      lastVisibleQuestionSignature = null;
      hideSuggestion();
      if (lastPredictionInput !== predictionInput) {
        lastPredictionInput = predictionInput;
        updatePredictionInput(predictionInput);
      }
      return;
    }
    if (lastPredictionInput) {
      lastPredictionInput = null;
      const card = document.getElementById('hud-participant-card');
      if (card) card.style.display = 'none';
    }
    const qData = extractActiveQuestionDOM();
    if (!qData?.questionText || qData.options.length < 2) {
      lastVisibleQuestionSignature = null;
      hideSuggestion();
      return;
    }
    const signature = getQuestionSignature(qData);
    if (signature === lastVisibleQuestionSignature) {
      if (lastSuggestedAnswer) {
        const choice = qData.options.find(option => option.key === lastSuggestedAnswer.answerKey);
        if (choice?.labelElement !== highlightedChoice) {
          highlightSuggestedChoice(qData, lastSuggestedAnswer);
        }
      }
      return;
    }
    lastVisibleQuestionSignature = signature;
    hideSuggestion();
    updateHUDStatus();

    const answer = engine?.lookupVerified(qData.questionText, qData.options, getContestTopic());
    if (answer) {
      displayResultInHUD(answer);
      highlightSuggestedChoice(qData, answer);
      lastSuggestedAnswer = answer;
    } else {
      document.getElementById('hud-status-text').textContent =
        'Chưa khớp ngân hàng; bấm Giải câu này để tra cứu thêm';
    }
  }

  function scheduleQuestionCheck() {
    if (questionCheckTimer) clearTimeout(questionCheckTimer);
    questionCheckTimer = setTimeout(() => {
      questionCheckTimer = null;
      checkVisibleQuestion();
    }, 120);
  }

  function watchVisibleQuestions() {
    const observer = new MutationObserver(records => {
      if (records.every(record => record.target.closest?.('#ai-legal-hud'))) return;
      scheduleQuestionCheck();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    // Some page transitions only change computed visibility.
    setInterval(checkVisibleQuestion, 1500);
    scheduleQuestionCheck();
  }

  // 6. Question Solver Logic
  async function solveCurrentQuestion() {
    if (isSolving) return false;
    isSolving = true;

    const btn = document.getElementById('btn-solve-current');
    if (btn) btn.innerHTML = '⏳ Đang tra cứu AI...';

    try {
      const predictionInput = findPredictionInput();
      if (predictionInput) return await updatePredictionInput(predictionInput);

      const qData = extractActiveQuestionDOM();
      if (!qData || !qData.questionText || qData.options.length === 0) {
        alert('Không tìm thấy câu hỏi hoặc phương án trên màn hình hiện tại! Vui lòng cuộn đến câu hỏi cần giải.');
        return false;
      }
      const questionSignature = getQuestionSignature(qData);

      console.log('[AI Legal Assistant] Extracted Question:', qData.questionText);
      console.log('[AI Legal Assistant] Extracted Options:', qData.options.map(o => `${o.key}: ${o.text}`));

      // Use the official question bank first, matching the answer by its text
      // because the visible choice order can differ from the source document.
      const contestTopic = getContestTopic();
      const localAnswer = engine?.lookupVerified(qData.questionText, qData.options, contestTopic) ||
        engine?.lookup(qData.questionText, qData.options, contestTopic);
      if (localAnswer) {
        displayResultInHUD(localAnswer);
        highlightSuggestedChoice(qData, localAnswer);
        lastSuggestedAnswer = localAnswer;
        return true;
      }

      // Build context for questions that are absent from the local bank.
      let contextText = '';
      if (engine && engine.isLoaded) {
        const searchResult = engine.buildContextForLLM(qData.questionText, contestTopic);
        contextText = searchResult.contextText;
        console.log('[AI Legal Assistant] Grounding Context:\n', contextText);
      }

      // 2. Query OpenAI API via background worker
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'CALL_OPENAI',
          payload: {
            question: qData.questionText,
            options: qData.options.map(o => ({ key: o.key, text: o.text })),
            contextText: contextText,
            contestTopic
          }
        }, (res) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (res && res.success) {
            resolve(res.data);
          } else {
            reject(new Error(res?.error || 'Lỗi không xác định khi gọi OpenAI'));
          }
        });
      });

      console.log('[AI Legal Assistant] AI Answer Result:', response);

      const currentQuestion = extractActiveQuestionDOM();
      if (!currentQuestion || getQuestionSignature(currentQuestion) !== questionSignature) {
        return false;
      }

      // 3. Display Result in HUD
      displayResultInHUD(response);
      highlightSuggestedChoice(currentQuestion, response);
      lastSuggestedAnswer = response;

      // AI responses are shown for review; the user selects the answer.
      return true;

    } catch (err) {
      console.error('[AI Legal Assistant] Error solving question:', err);
      alert('Lỗi: ' + err.message);
      return false;
    } finally {
      isSolving = false;
      if (btn) btn.innerHTML = '🎯 GIẢI CÂU NÀY';
    }
  }

  // Display Result Card in HUD
  function displayResultInHUD(data) {
    const card = document.getElementById('hud-result-card');
    const badge = document.getElementById('res-badge');
    const confidence = document.getElementById('res-confidence');
    const ansText = document.getElementById('res-answer-text');
    const lawArticle = document.getElementById('res-law-article');
    const reasoning = document.getElementById('res-reasoning');

    if (!card) return;

    badge.innerText = `ĐÁP ÁN: ${data.answerKey}`;
    confidence.innerText = data.source === 'Ngân hàng câu hỏi' ? 'Khớp ngân hàng' : 'AI gợi ý • cần kiểm tra';
    ansText.innerText = data.answerText || '';
    lawArticle.innerText = `📜 Căn cứ: ${data.lawArticle || 'Pháp luật hiện hành'}`;
    reasoning.innerText = data.reasoning || '';

    card.style.display = 'flex';
  }

  // 8. Listen for Storage Changes (Settings update from Popup)
  chrome.storage.onChanged.addListener((changes) => {
    for (const [key, change] of Object.entries(changes)) {
      settings[key] = change.newValue;
    }
    settings.mode = 'safe_highlight';
    if (changes.customSources && engine) {
      engine.setCustomSources(changes.customSources.newValue);
    }
    updateHUDStatus();
  });

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAssistant);
  } else {
    initAssistant();
  }

})();
