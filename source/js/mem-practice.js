(() => {
  'use strict';

  const HISTORY_KEY = 'mem-practice:history';
  const WRONG_KEY = 'mem-practice:wrong-bank';
  const SESSION_PREFIX = 'mem-practice:session:';

  const readJson = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  };

  const writeJson = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const getHistory = () => readJson(HISTORY_KEY, {});
  const getWrongBank = () => readJson(WRONG_KEY, {});

  const summarizeSubject = (subject) => {
    const history = Object.values(getHistory());
    const filtered = subject === 'all' ? history : history.filter((item) => item.subject === subject);
    return filtered.reduce((summary, item) => {
      summary.completed += 1;
      if (item.correct) summary.correct += 1;
      return summary;
    }, { completed: 0, correct: 0 });
  };

  const countWrong = (subject) => {
    return Object.values(getWrongBank()).filter((item) => !subject || subject === 'all' || item.subject === subject).length;
  };

  const updateProgressCards = () => {
    document.querySelectorAll('[data-progress-subject]').forEach((node) => {
      const subject = node.dataset.progressSubject;
      const summary = summarizeSubject(subject === 'all' ? 'all' : subject);
      const wrong = countWrong(subject);

      if (node.classList.contains('mem-summary-panel')) {
        const values = node.querySelectorAll('.mem-summary-item__value');
        if (values[0]) values[0].textContent = `${summary.completed} 题`;
        if (values[1]) values[1].textContent = `${summary.correct} 题`;
        if (values[2]) values[2].textContent = `${wrong} 题`;
        return;
      }

      const value = node.querySelector('.mem-stat-card__value');
      if (!value) return;
      value.textContent = subject === 'all' ? `${wrong} 题` : `${summary.completed} 题`;
    });
  };

  const saveResult = (question, subject, category, selected, correct) => {
    const history = getHistory();
    history[question.id] = {
      id: question.id,
      subject,
      category,
      selected,
      correct,
      timestamp: Date.now()
    };
    writeJson(HISTORY_KEY, history);

    const wrongBank = getWrongBank();
    if (correct) {
      delete wrongBank[question.id];
    } else {
      wrongBank[question.id] = {
        ...question,
        subject,
        category,
        selected
      };
    }
    writeJson(WRONG_KEY, wrongBank);
  };

  // ==========================================================================
  // Practice App
  // ==========================================================================

  const renderPracticeApp = async () => {
    const app = document.getElementById('practice-app');
    if (!app) return;

    const subject = app.dataset.subject;
    const category = app.dataset.category;
    const path = app.dataset.questions;

    let questions = [];
    try {
      const response = await fetch(path);
      questions = await response.json();
    } catch (_) {
      app.innerHTML = '<div class="mem-empty-state"><div class="mem-empty-state__icon">📭</div>题库暂时不可用，请稍后再试。</div>';
      return;
    }

    const validQuestions = questions.filter((item) => item && item.id && item.stem && Array.isArray(item.options) && Array.isArray(item.answer));
    if (!validQuestions.length) {
      app.innerHTML = '<div class="mem-empty-state"><div class="mem-empty-state__icon">📝</div>当前分类还没有可练习的题目。</div>';
      return;
    }

    const total = validQuestions.length;
    const sessionKey = `${SESSION_PREFIX}${location.pathname}`;
    const session = readJson(sessionKey, { index: 0 });
    let currentIndex = Math.min(session.index || 0, total - 1);
    let selected = [];
    let answered = false;
    let sessionCorrect = 0;
    let sessionWrong = 0;

    const shell = document.createElement('div');
    shell.className = 'mem-practice-shell';

    const render = () => {
      const question = validQuestions[currentIndex];
      selected = [];
      answered = false;
      shell.innerHTML = '';

      // --- Progress bar ---
      const progressPct = ((currentIndex + 1) / total) * 100;
      const progress = document.createElement('div');
      progress.className = 'mem-progress';
      progress.innerHTML = `
        <span class="mem-progress__label">${currentIndex + 1}/${total}</span>
        <div class="mem-progress__track">
          <div class="mem-progress__fill" style="width:${progressPct}%"></div>
        </div>
      `;

      // --- Session stats ---
      const statsEl = document.createElement('div');
      statsEl.className = 'mem-session-stats';
      statsEl.innerHTML = `
        <span>✓ <span class="mem-session-stats__correct">${sessionCorrect}</span></span>
        <span>✗ <span class="mem-session-stats__wrong">${sessionWrong}</span></span>
      `;

      // --- Meta row ---
      const meta = document.createElement('div');
      meta.className = 'mem-practice-meta';
      meta.append(
        buildLabel(question.difficulty || 'unknown'),
        statsEl
      );

      // --- Question card ---
      const card = document.createElement('section');
      card.className = 'mem-practice-card';
      card.innerHTML = `<h2>${escapeHtml(question.stem)}</h2>`;

      // --- Option list ---
      const optionList = document.createElement('div');
      optionList.className = 'mem-option-list';
      const buttons = [];

      question.options.forEach((option, i) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.innerHTML = `<strong>${option.key}</strong> ${escapeHtml(option.text)}`;
        button.addEventListener('click', () => {
          if (answered) return;
          buttons.forEach((item) => item.classList.remove('is-selected'));
          selected = [option.key];
          button.classList.add('is-selected');
        });
        buttons.push(button);
        optionList.appendChild(button);
      });

      // --- Feedback ---
      const feedback = document.createElement('div');
      feedback.className = 'mem-answer-feedback';
      feedback.textContent = '选择一个答案后点击“提交答案”，或按键盘 1-4 选择。';

      // --- Explanation ---
      const explanation = document.createElement('div');
      explanation.className = 'mem-question-explanation';
      explanation.hidden = true;

      // --- Actions ---
      const actions = document.createElement('div');
      actions.className = 'mem-practice-actions';

      const prevBtn = createActionBtn('← 上一题', () => {
        if (currentIndex > 0) {
          currentIndex -= 1;
          writeJson(sessionKey, { index: currentIndex });
          render();
        }
      }, currentIndex === 0);

      const submitBtn = document.createElement('button');
      submitBtn.type = 'button';
      submitBtn.className = 'mem-button-primary';
      submitBtn.textContent = '提交答案';
      submitBtn.addEventListener('click', () => handleSubmit());

      const nextBtn = createActionBtn('下一题 →', () => {
        if (currentIndex < total - 1) {
          currentIndex += 1;
          writeJson(sessionKey, { index: currentIndex });
          render();
        }
      }, currentIndex >= total - 1);
      nextBtn.id = 'mem-next-btn';

      actions.append(prevBtn, submitBtn, nextBtn);

      // --- Keyboard hint ---
      const hint = document.createElement('div');
      hint.className = 'mem-keyboard-hint';
      hint.innerHTML = '键盘快捷键: <kbd>1</kbd>–<kbd>4</kbd> 选择 · <kbd>Enter</kbd> 提交 · <kbd>←</kbd> <kbd>→</kbd> 切换';

      shell.append(progress, meta, card, optionList, feedback, explanation, actions, hint);
    };

    // Build difficulty label
    const buildLabel = (difficulty) => {
      const map = { easy: '简单', medium: '中等', hard: '困难' };
      const el = document.createElement('span');
      el.className = 'mem-practice-label';
      el.textContent = map[difficulty] || difficulty;
      return el;
    };

    // Escape HTML
    const escapeHtml = (text) => {
      const d = document.createElement('div');
      d.textContent = text;
      return d.innerHTML;
    };

    // Create action button
    const createActionBtn = (text, onClick, disabled) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = text;
      btn.disabled = disabled;
      btn.addEventListener('click', onClick);
      return btn;
    };

    // Handle answer submission
    const handleSubmit = () => {
      if (answered) return;
      if (!selected.length) {
        feedback.className = 'mem-answer-feedback is-wrong';
        feedback.textContent = '请先选择一个答案。';
        return;
      }
      answered = true;

      const question = validQuestions[currentIndex];
      const isCorrect = selected.join(',') === question.answer.join(',');

      // Mark options
      const buttons = shell.querySelectorAll('.mem-option-list button');
      buttons.forEach((button, index) => {
        const key = question.options[index].key;
        if (question.answer.includes(key)) button.classList.add('is-correct');
        if (selected.includes(key) && !question.answer.includes(key)) button.classList.add('is-wrong');
      });

      // Update stats
      if (isCorrect) sessionCorrect++; else sessionWrong++;

      // Feedback
      feedback.className = `mem-answer-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`;
      feedback.textContent = isCorrect
        ? '回答正确！'
        : `回答错误，正确答案：${question.answer.join('、')}`;

      // Explanation
      explanation.hidden = false;
      explanation.innerHTML = `<strong>解析：</strong> ${question.explanation || '当前题目暂未提供解析。'}`;

      // Save
      saveResult(question, subject, category, selected, isCorrect);
      writeJson(sessionKey, { index: currentIndex });
      updateProgressCards();

      // Check if this was the last question
      const submitBtn = shell.querySelector('.mem-button-primary');
      if (currentIndex >= total - 1) {
        submitBtn.textContent = '查看结果';
        submitBtn.removeEventListener('click', handleSubmit);
        submitBtn.addEventListener('click', showSummary);
      } else {
        // Change submit button to "下一题"
        submitBtn.textContent = '下一题 →';
        submitBtn.removeEventListener('click', handleSubmit);
        submitBtn.addEventListener('click', () => {
          if (currentIndex < total - 1) {
            currentIndex += 1;
            writeJson(sessionKey, { index: currentIndex });
            render();
          }
        });
      }
    };

    // Show session summary
    const showSummary = () => {
      const totalAnswered = sessionCorrect + sessionWrong;
      const accuracy = totalAnswered > 0 ? Math.round((sessionCorrect / totalAnswered) * 100) : 0;

      const summary = document.createElement('div');
      summary.className = 'mem-session-summary';
      summary.innerHTML = `
        <div class="mem-session-summary__icon">${accuracy >= 80 ? '🎉' : accuracy >= 60 ? '💪' : '📚'}</div>
        <h3 class="mem-session-summary__title">本次练习完成！</h3>
        <div class="mem-session-summary__stats">
          <div class="mem-session-summary__stat">
            <div class="mem-session-summary__stat-value">${totalAnswered}</div>
            <div class="mem-session-summary__stat-label">已答题</div>
          </div>
          <div class="mem-session-summary__stat">
            <div class="mem-session-summary__stat-value">${sessionCorrect}</div>
            <div class="mem-session-summary__stat-label">正确</div>
          </div>
          <div class="mem-session-summary__stat">
            <div class="mem-session-summary__stat-value">${sessionWrong}</div>
            <div class="mem-session-summary__stat-label">错误</div>
          </div>
        </div>
        <div class="mem-session-summary__accuracy">
          <div class="mem-session-summary__stat-value" style="font-size:2.5rem">${accuracy}%</div>
          <div class="mem-session-summary__stat-label">正确率</div>
        </div>
        <div class="mem-session-summary__actions">
          <button class="mem-button mem-button--primary" onclick="location.reload()">再来一组</button>
          <a class="mem-button mem-button--ghost" href="/practice/wrong/">查看错题</a>
        </div>
      `;

      const submitBtn = shell.querySelector('.mem-button-primary');
      if (submitBtn) submitBtn.style.display = 'none';
      const nextBtn = document.getElementById('mem-next-btn');
      if (nextBtn) nextBtn.style.display = 'none';

      shell.querySelector('.mem-progress').style.display = 'none';
      const meta = shell.querySelector('.mem-practice-meta');
      if (meta) meta.style.display = 'none';
      const card = shell.querySelector('.mem-practice-card');
      if (card) card.style.display = 'none';
      const opt = shell.querySelector('.mem-option-list');
      if (opt) opt.style.display = 'none';
      const fb = shell.querySelector('.mem-answer-feedback');
      if (fb) fb.style.display = 'none';
      const exp = shell.querySelector('.mem-question-explanation');
      if (exp) exp.style.display = 'none';
      const hint = shell.querySelector('.mem-keyboard-hint');
      if (hint) hint.style.display = 'none';

      // Remove old actions and insert summary
      const oldActions = shell.querySelector('.mem-practice-actions');
      if (oldActions) oldActions.remove();
      const oldHint = shell.querySelector('.mem-keyboard-hint');
      if (oldHint) oldHint.remove();

      shell.appendChild(summary);
    };

    // --- Keyboard shortcuts ---
    const keyboardHandler = (e) => {
      // Don't handle if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // 1-4: select option
      const idx = parseInt(e.key);
      if (idx >= 1 && idx <= 4) {
        const btns = shell.querySelectorAll('.mem-option-list button');
        if (btns[idx - 1]) {
          btns[idx - 1].click();
        }
        return;
      }

      // Enter: submit
      if (e.key === 'Enter') {
        const submitBtn = shell.querySelector('.mem-button-primary');
        if (submitBtn) submitBtn.click();
        return;
      }

      // Left/Right: navigate
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        const prev = shell.querySelector('.mem-practice-actions button:first-child');
        if (prev && !prev.disabled) prev.click();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        const nextBtn = document.getElementById('mem-next-btn');
        if (nextBtn && !nextBtn.disabled) nextBtn.click();
        return;
      }
    };

    document.addEventListener('keydown', keyboardHandler);

    // Cleanup on page unload (not strictly needed but good practice)
    // We'll use the shell's disconnected callback

    app.innerHTML = '';
    app.appendChild(shell);
    render();
  };

  // ==========================================================================
  // Wrong Review App
  // ==========================================================================

  const renderWrongReview = () => {
    const app = document.getElementById('wrong-review-app');
    if (!app) return;

    const wrongBank = Object.values(getWrongBank());
    if (!wrongBank.length) {
      app.innerHTML = '<div class="mem-empty-state"><div class="mem-empty-state__icon">✅</div>当前设备上还没有错题，继续去做题即可。</div>';
      return;
    }

    const shell = document.createElement('div');
    shell.className = 'mem-wrong-shell';

    const title = document.createElement('div');
    title.className = 'mem-practice-meta';
    title.innerHTML = `<span class="mem-practice-label">共 ${wrongBank.length} 题</span><span>做对后自动移出错题本</span>`;
    shell.appendChild(title);

    const list = document.createElement('div');
    list.className = 'mem-wrong-list';

    wrongBank.forEach((question) => {
      const card = document.createElement('section');
      card.className = 'mem-wrong-card';

      const tags = document.createElement('p');
      tags.className = 'mem-practice-label';
      tags.textContent = `${question.subject || ''} / ${question.category || ''}`;

      const stem = document.createElement('h3');
      stem.textContent = question.stem;

      const answer = document.createElement('p');
      answer.innerHTML = `<strong>正确答案：</strong>${question.answer.join('、')}`;

      const explanation = document.createElement('p');
      explanation.innerHTML = `<strong>解析：</strong> ${question.explanation || '暂无解析。'}`;

      const btn = document.createElement('button');
      btn.className = 'mem-button-primary';
      btn.textContent = '标记为已掌握 ✓';
      btn.addEventListener('click', () => {
        const wrong = getWrongBank();
        delete wrong[question.id];
        writeJson(WRONG_KEY, wrong);
        renderWrongReview();
        updateProgressCards();
      });

      card.append(tags, stem, answer, explanation, btn);
      list.appendChild(card);
    });

    shell.appendChild(list);
    app.innerHTML = '';
    app.appendChild(shell);
  };

  // ==========================================================================
  // Init
  // ==========================================================================

  document.addEventListener('DOMContentLoaded', () => {
    updateProgressCards();
    renderPracticeApp();
    renderWrongReview();
  });
})();
