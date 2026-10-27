/* Local question-bank lookup used by the content script. */
class KnowledgeEngine {
  constructor() {
    this.questions = [];
    this.customSources = [];
    this.isLoaded = false;
  }

  async init(customSources = []) {
    this.setCustomSources(customSources);
    const url = chrome.runtime.getURL('knowledge/knowledge_db.json');
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Không tải được ngân hàng câu hỏi (${response.status})`);
    this.questions = await response.json();
    this.isLoaded = this.questions.length > 0;
  }

  setCustomSources(sources) {
    this.customSources = Array.isArray(sources) ? sources : [];
  }

  static normalize(value) {
    return String(value || '')
      .normalize('NFKC')
      .toLocaleLowerCase('vi')
      .replace(/^\s*câu\s*\d+\s*[.:\-]?\s*/i, '')
      .replace(/[“”"'‘’.,:;!?()[\]{}\-–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static contestFor(item) {
    const basis = String(item?.legalBasis || '');
    if (/^(Hiến pháp|Bộ luật Dân sự|Bộ luật Hình sự|Luật Căn cước|Luật An ninh mạng|Luật Bảo vệ dữ liệu cá nhân|Nghị định số (356|330)\/)/i.test(basis)) return 'privacy';
    if (/^(Luật Việc làm|Luật Người lao động|Luật Bảo hiểm xã hội|Bộ luật Lao động|Luật Công đoàn|Nghị định số (158|335|283)\/)/i.test(basis)) return 'labor';
    return null;
  }

  questionsFor(contest) {
    return contest ? this.questions.filter(item => KnowledgeEngine.contestFor(item) === contest) : this.questions;
  }

  findQuestion(questionText, contest = null) {
    if (!this.isLoaded) return null;
    const query = KnowledgeEngine.normalize(questionText);
    if (!query) return null;
    const questions = this.questionsFor(contest);
    const exact = questions.find(item => KnowledgeEngine.normalize(item.question) === query);
    if (exact) return { item: exact, confidence: 1 };

    // Minor whitespace or punctuation differences are common. Require a very
    // close match so a similar legal question cannot silently get an answer.
    const queryWords = new Set(query.split(' '));
    let best = null;
    let bestScore = 0;
    for (const item of questions) {
      const candidate = KnowledgeEngine.normalize(item.question);
      const words = new Set(candidate.split(' '));
      let overlap = 0;
      for (const word of queryWords) if (words.has(word)) overlap++;
      const score = 2 * overlap / (queryWords.size + words.size);
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
    }
    return bestScore >= 0.94 ? { item: best, confidence: bestScore } : null;
  }

  lookup(questionText, visibleOptions, contest = null) {
    const match = this.findQuestion(questionText, contest);
    if (!match || !Array.isArray(visibleOptions)) return null;
    const normalizedQuestion = KnowledgeEngine.normalize(match.item.question);
    const candidates = this.questionsFor(contest).filter(item => KnowledgeEngine.normalize(item.question) === normalizedQuestion);
    const visibleTexts = new Set(visibleOptions.map(opt => KnowledgeEngine.normalize(opt.text)));
    const chosen = candidates.map(item => ({
      item,
      overlap: item.options.filter(opt => visibleTexts.has(KnowledgeEngine.normalize(opt.text))).length,
      option: visibleOptions.find(opt => KnowledgeEngine.normalize(opt.text) === KnowledgeEngine.normalize(item.correctAnswerText))
    })).sort((a, b) => b.overlap - a.overlap).find(result =>
      result.option && result.overlap >= Math.min(2, result.item.options.length, visibleOptions.length)
    );
    const option = chosen?.option;
    if (!option) return null;
    return {
      answerKey: option.key,
      answerText: option.text,
      lawArticle: chosen.item.legalBasis || '',
      reasoning: 'Khớp với câu hỏi và nội dung đáp án trong ngân hàng.',
      confidence: match.confidence,
      source: 'Ngân hàng câu hỏi'
    };
  }

  // Only an exact question and complete option set may trigger an automatic click.
  lookupVerified(questionText, visibleOptions, contest = null) {
    if (!this.isLoaded || !Array.isArray(visibleOptions) || visibleOptions.length < 2) return null;
    const normalize = KnowledgeEngine.normalize;
    const question = normalize(questionText);
    const optionTexts = visibleOptions.map(option => normalize(option.text));
    if (!question || optionTexts.some(text => !text) || new Set(optionTexts).size !== optionTexts.length) return null;

    const matches = this.questionsFor(contest).filter(item => {
      if (normalize(item.question) !== question || item.options.length !== optionTexts.length) return false;
      const sourceTexts = item.options.map(option => normalize(option.text));
      return sourceTexts.length === new Set(sourceTexts).size &&
        sourceTexts.every(text => optionTexts.includes(text));
    });
    if (!matches.length) return null;

    const answerTexts = new Set(matches.map(item => normalize(item.correctAnswerText)));
    if (answerTexts.size !== 1) return null;
    const answerText = [...answerTexts][0];
    const options = visibleOptions.filter(option => normalize(option.text) === answerText);
    if (options.length !== 1 || !/^[A-D]$/.test(options[0].key)) return null;

    return {
      answerKey: options[0].key,
      answerText: options[0].text,
      lawArticle: matches[0].legalBasis || '',
      reasoning: 'Khớp chính xác câu hỏi và toàn bộ phương án trong ngân hàng.',
      confidence: 1,
      source: 'Ngân hàng câu hỏi'
    };
  }

  buildContextForLLM(questionText, contest = null) {
    const match = this.findQuestion(questionText, contest);
    const sections = [];
    if (match) {
      const item = match.item;
      sections.push(`Câu hỏi trong ngân hàng:\n${item.question}\nĐáp án: ${item.correctAnswerText}\nCăn cứ: ${item.legalBasis || 'Chưa có'}`);
    }
    const words = new Set(KnowledgeEngine.normalize(questionText).split(' ').filter(w => w.length > 3));
    const relevant = this.customSources.map(source => {
      const content = String(source.content || '');
      const normalized = KnowledgeEngine.normalize(content.slice(0, 20000));
      let score = 0;
      for (const word of words) if (normalized.includes(word)) score++;
      return { source, score };
    }).filter(entry => entry.score > 0).sort((a, b) => b.score - a.score).slice(0, 2);
    for (const { source } of relevant) {
      sections.push(`${source.title || 'Tài liệu bổ sung'}:\n${String(source.content).slice(0, 6000)}`);
    }
    return { contextText: sections.join('\n\n---\n\n') };
  }
}
globalThis.KnowledgeEngine = KnowledgeEngine;
