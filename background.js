/**
 * Background Service Worker for AI Legal Assistant
 * Handles OpenAI & Custom Gateway API communication, model reasoning, settings storage,
 * and error handling.
 */

// Default Configuration
const DEFAULT_SETTINGS = {
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  openaiBaseUrl: 'https://api.openai.com/v1',
  mode: 'safe_highlight',
  customSources: []
};

const CONTESTS = new Map([
  ['/cuoc-thi/tim-hieu-phap-luat-ve-lao-dong-viec-lam-va-an-sinh-xa-hoi-1', 1],
  ['/cuoc-thi/tim-hieu-quy-dinh-phap-luat-ve-bao-ve-du-lieu-ca-nhan-2', 2]
]);
const CONTEST_ORIGIN = 'https://timhieuphapluatdanang2026.com';

// Previous versions enabled automatic interaction. Migrate every installation
// to the read-only suggestion mode on the next update.
async function getSettings() {
  const data = await chrome.storage.local.get(null);
  const toSet = {};
  if (data.modePreferenceVersion !== 2 || data.mode !== 'safe_highlight') {
    toSet.mode = 'safe_highlight';
    toSet.modePreferenceVersion = 2;
  }
  for (const [key, val] of Object.entries(DEFAULT_SETTINGS)) {
    if (data[key] === undefined) {
      toSet[key] = val;
    }
  }
  if (Object.keys(toSet).length > 0) {
    await chrome.storage.local.set(toSet);
  }
  return { ...data, ...toSet };
}

// Initialize settings on install or update.
chrome.runtime.onInstalled.addListener(async () => {
  await getSettings();
  console.log('[AI Legal Assistant] Extension installed and default settings initialized.');
});

// Message Dispatcher
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CONTEST_PARTICIPANTS') {
    getContestParticipants(sender)
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'CALL_OPENAI') {
    handleOpenAICall(message.payload)
      .then(res => sendResponse({ success: true, data: res }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }

  if (message.type === 'TEST_OPENAI_CONNECTION') {
    testOpenAIConnection(message.payload)
      .then(res => sendResponse({ success: true, data: res }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'GET_SETTINGS') {
    getSettings().then(settings => {
      sendResponse({ success: true, settings });
    });
    return true;
  }

  if (message.type === 'SAVE_SETTINGS') {
    chrome.storage.local.set(message.payload).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// The public lobby embeds its live counts in Inertia's data-page.
// Return both public counters: registrations and completed attempts.
// The HUD shows both counters for context; it never fills the prediction.
async function getContestParticipants(sender) {
  const pageUrl = new URL(sender.url || 'about:blank');
  const pathname = pageUrl.pathname.replace(/\/$/, '');
  const contestId = CONTESTS.get(pathname);
  if (pageUrl.origin !== CONTEST_ORIGIN || !contestId) {
    throw new Error('Trang này không thuộc hai cuộc thi được hỗ trợ.');
  }
  const contestUrl = new URL(pathname, CONTEST_ORIGIN);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let response;
  try {
    response = await fetch(contestUrl.href, {
      method: 'GET',
      headers: { Accept: 'text/html' },
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok || new URL(response.url).origin !== contestUrl.origin ||
      new URL(response.url).pathname.replace(/\/$/, '') !== contestUrl.pathname) {
    throw new Error('Không tải được số người tham gia từ trang cuộc thi.');
  }

  const html = await response.text();
  const page = html.match(/data-page="([^"]+)"/);
  if (!page || !/&quot;component&quot;:&quot;Module::Contest::Lobby2&quot;/.test(page[1]) ||
      !new RegExp(`&quot;contest_id&quot;:${contestId}\\b`).test(page[1])) {
    throw new Error('Trang cuộc thi không trả về dữ liệu thống kê hợp lệ.');
  }
  const joinedMatch = page[1].match(/&quot;countJoined&quot;:(\d+)/);
  const finishedMatch = page[1].match(/&quot;countFinished&quot;:(\d+)/);
  const joinedCount = joinedMatch ? Number(joinedMatch[1]) : NaN;
  const finishedCount = finishedMatch ? Number(finishedMatch[1]) : NaN;
  if (!Number.isSafeInteger(joinedCount) || joinedCount < 0 ||
      !Number.isSafeInteger(finishedCount) || finishedCount < 0) {
    throw new Error('Không xác định được hai bộ đếm của cuộc thi.');
  }
  return { joinedCount, finishedCount, checkedAt: new Date().toISOString() };
}

/**
 * Handle Chat Completion Request
 */
async function handleOpenAICall(payload) {
  const settings = await chrome.storage.local.get(['openaiApiKey', 'openaiModel', 'openaiBaseUrl']);
  const apiKey = (payload.apiKey || settings.openaiApiKey || '').trim();
  const model = (payload.model || settings.openaiModel || 'gpt-4o-mini').trim();
  let baseUrl = (payload.baseUrl || settings.openaiBaseUrl || 'https://api.openai.com/v1').trim();
  baseUrl = baseUrl.replace(/\/+$/, '');

  if (!apiKey) {
    throw new Error('Chưa cấu hình API Key! Vui lòng bấm vào biểu tượng Extension để nhập API Key.');
  }

  const { question, options, contextText, contestTopic } = payload;

  const formattedOptions = options.map((opt, i) => {
    const key = opt.key || String.fromCharCode(65 + i);
    const text = opt.text || opt;
    return `${key}. ${text}`;
  }).join('\n');

  const legalTopic = contestTopic === 'privacy'
    ? 'bảo vệ dữ liệu cá nhân, quyền riêng tư, an ninh mạng và các văn bản pháp luật liên quan'
    : contestTopic === 'labor'
      ? 'lao động, việc làm, bảo hiểm xã hội và an sinh xã hội'
      : 'pháp luật Việt Nam';
  const systemPrompt = `Bạn là trợ lý tra cứu ${legalTopic}.
Nhiệm vụ của bạn:
1. Đọc kỹ câu hỏi và các phương án lựa chọn được cung cấp.
2. Tham khảo tri thức pháp luật và ngân hàng đề thi được đính kèm.
3. Xác định chính xác phương án đúng nhất.
4. Trả về kết quả DUY NHẤT dưới định dạng JSON với cấu trúc:
{
  "answerKey": "A" (hoặc B, C, D; nếu câu hỏi chọn nhiều đáp án thì ghi các chữ cái cách nhau dấu phẩy như "A, B"),
  "answerText": "Nội dung phương án được chọn",
  "lawArticle": "Điều luật, Nghị định hoặc văn bản quy phạm pháp luật cụ thể làm căn cứ (ví dụ: 'Điều 20 Bộ luật Lao động 2019')",
  "reasoning": "Giải thích ngắn gọn 1-2 câu vì sao phương án này đúng",
  "confidence": 0.98
}
Chỉ trả về JSON thuần túy, không kèm markdown \`\`\`json.`;

  const userPrompt = `[TÀI LIỆU KIẾN THỨC TRA CỨU]:
${contextText || 'Không có tài liệu tham khảo bổ sung, hãy dựa vào kiến thức pháp luật Việt Nam hiện hành chính xác nhất.'}

---

[CÂU HỎI CẦN GIẢI]:
${question}

[CÁC PHƯƠNG ÁN LỰA CHỌN]:
${formattedOptions}

Hãy phân tích và trả về kết quả JSON chính xác.`;

  const url = `${baseUrl}/chat/completions`;

  // First try with response_format, fallback without it if proxy doesn't support it
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });
  } catch (netErr) {
    throw new Error(`Không thể kết nối đến máy chủ ${baseUrl}: ${netErr.message}`);
  }

  // If 400 or parameter error, retry without response_format
  if (response.status === 400) {
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1
        })
      });
    } catch (_) {}
  }

  if (!response.ok) {
    let errBody = '';
    try {
      const errJson = await response.json();
      errBody = errJson.error ? (errJson.error.message || JSON.stringify(errJson.error)) : JSON.stringify(errJson);
    } catch (_) {
      errBody = await response.text();
    }

    if (response.status === 401) {
      throw new Error(`API Key không hợp lệ hoặc đã hết hạn (401). Chi tiết: ${errBody}`);
    } else if (response.status === 429) {
      throw new Error(`Tài khoản đã hết hạn mức (Quota) hoặc bị Rate Limit (429). Chi tiết: ${errBody}`);
    } else if (response.status === 502) {
      throw new Error(`Máy chủ ${baseUrl} báo lỗi 502 Bad Gateway (Server proxy/gateway đang gặp sự cố kết nối upstream hoặc chưa cấu hình model '${model}').`);
    } else {
      throw new Error(`Lỗi kết nối API (${response.status}): ${errBody}`);
    }
  }

  const result = await response.json();
  const rawContent = result.choices && result.choices[0] && result.choices[0].message
    ? result.choices[0].message.content
    : '';

  try {
    const cleanJson = rawContent
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    const parsed = JSON.parse(cleanJson);
    return parsed;
  } catch (e) {
    const match = rawContent.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Không thể phân tích phản hồi JSON từ AI: ' + rawContent);
  }
}

/**
 * Test Connection with diagnostic information
 */
async function testOpenAIConnection(payload) {
  const apiKey = (payload.apiKey || '').trim();
  const model = (payload.model || 'gpt-4o-mini').trim();
  let baseUrl = (payload.baseUrl || 'https://api.openai.com/v1').trim();
  baseUrl = baseUrl.replace(/\/+$/, '');

  if (!apiKey) {
    throw new Error('Vui lòng nhập API Key để kiểm tra.');
  }

  // Diagnostic 1: Try checking /models if available
  let modelsList = [];
  try {
    const modelsRes = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    if (modelsRes.ok) {
      const data = await modelsRes.json();
      if (Array.isArray(data.data)) {
        modelsList = data.data.map(m => m.id);
      }
    }
  } catch (_) {}

  // Diagnostic 2: Test chat completion ping
  let response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Say "OK"' }],
        max_tokens: 10
      })
    });
  } catch (netErr) {
    throw new Error(`Không thể gửi yêu cầu đến ${baseUrl}: ${netErr.message}`);
  }

  if (!response.ok) {
    let msg = '';
    try {
      const data = await response.json();
      msg = data.error ? (data.error.message || JSON.stringify(data.error)) : JSON.stringify(data);
    } catch (_) {
      msg = await response.text();
    }

    if (response.status === 502) {
      let extra = `Máy chủ '${baseUrl}' trả về lỗi 502 Bad Gateway.`;
      if (modelsList.length === 0) {
        extra += `\nLưu ý: API Key này hiện có danh sách model rỗng (data: []). Cổng proxy/gateway của bạn chưa bật kênh hoặc chưa gán model cho key này.`;
      }
      throw new Error(extra);
    }

    if (response.status === 404) {
      let extra = `Không tìm thấy model '${model}' (404) trên ${baseUrl}.`;
      if (modelsList.length > 0) {
        extra += ` Các model hiện có trên server: ${modelsList.slice(0, 5).join(', ')}`;
      }
      throw new Error(extra);
    }

    throw new Error(`Lỗi (${response.status}): ${msg}`);
  }

  return {
    message: `Kết nối thành công với ${baseUrl} (Model: ${model})!`
  };
}
