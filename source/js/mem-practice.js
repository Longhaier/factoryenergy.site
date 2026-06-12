(() => {
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
    }, {
      completed: 0,
      correct: 0
    });
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

  const buildOptionButton = (option, onClick) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = `<strong>${option.key}</strong> ${option.text}`;
    button.addEventListener('click', onClick);
    return button;
  };

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
      app.innerHTML = '<div class="mem-empty-state">题库暂时不可用，请稍后再试。</div>';
      return;
    }

    const validQuestions = questions.filter((item) => item && item.id && item.stem && Array.isArray(item.options) && Array.isArray(item.answer));
    if (!validQuestions.length) {
      app.innerHTML = '<div class="mem-empty-state">当前分类还没有可练习的题目。</div>';
      return;
    }

    const sessionKey = `${SESSION_PREFIX}${location.pathname}`;
    const session = readJson(sessionKey, { index: 0 });
    let currentIndex = Math.min(session.index || 0, validQuestions.length - 1);
    let selected = [];

    const shell = document.createElement('div');
    shell.className = 'mem-practice-shell';

    const render = () => {
      const question = validQuestions[currentIndex];
      selected = [];
      shell.innerHTML = '';

      const meta = document.createElement('div');
      meta.className = 'mem-practice-meta';
      meta.innerHTML = `
        <span class="mem-practice-label">${subject}</span>
        <span>第 ${currentIndex + 1} / ${validQuestions.length} 题</span>
        <span>难度：${question.difficulty || 'unknown'}</span>
      `;

      const card = document.createElement('section');
      card.className = 'mem-practice-card';
      card.innerHTML = `<h2>${question.stem}</h2>`;

      const optionList = document.createElement('div');
      optionList.className = 'mem-option-list';
      const buttons = [];

      question.options.forEach((option) => {
        const button = buildOptionButton(option, () => {
          buttons.forEach((item) => item.classList.remove('is-selected'));
          selected = [option.key];
          button.classList.add('is-selected');
        });
        buttons.push(button);
        optionList.appendChild(button);
      });

      const feedback = document.createElement('div');
      feedback.className = 'mem-answer-feedback';
      feedback.textContent = '选择一个答案后点击“提交答案”。';

      const explanation = document.createElement('div');
      explanation.className = 'mem-question-explanation';
      explanation.hidden = true;

      const actions = document.createElement('div');
      actions.className = 'mem-practice-actions';

      const submitButton = document.createElement('button');
      submitButton.type = 'button';
      submitButton.className = 'mem-button-primary';
      submitButton.textContent = '提交答案';
      submitButton.addEventListener('click', () => {
        if (!selected.length) {
          feedback.className = 'mem-answer-feedback is-wrong';
          feedback.textContent = '先选择一个答案。';
          return;
        }

        const isCorrect = selected.join(',') === question.answer.join(',');
        buttons.forEach((button, index) => {
          const key = question.options[index].key;
          if (question.answer.includes(key)) button.classList.add('is-correct');
          if (selected.includes(key) && !question.answer.includes(key)) button.classList.add('is-wrong');
        });

        feedback.className = `mem-answer-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`;
        feedback.textContent = isCorrect
          ? '回答正确，可以直接进入下一题。'
          : `回答错误，正确答案：${question.answer.join('、')}`;

        explanation.hidden = false;
        explanation.innerHTML = `<strong>解析：</strong> ${question.explanation || '当前题目暂未提供解析。'}`;

        saveResult(question, subject, category, selected, isCorrect);
        writeJson(sessionKey, { index: currentIndex });
        updateProgressCards();
      });

      const prevButton = document.createElement('button');
      prevButton.type = 'button';
      prevButton.textContent = '上一题';
      prevButton.disabled = currentIndex === 0;
      prevButton.addEventListener('click', () => {
        currentIndex -= 1;
        writeJson(sessionKey, { index: currentIndex });
        render();
      });

      const nextButton = document.createElement('button');
      nextButton.type = 'button';
      nextButton.textContent = '下一题';
      nextButton.disabled = currentIndex >= validQuestions.length - 1;
      nextButton.addEventListener('click', () => {
        currentIndex += 1;
        writeJson(sessionKey, { index: currentIndex });
        render();
      });

      actions.append(prevButton, submitButton, nextButton);
      shell.append(meta, card, optionList, feedback, explanation, actions);
    };

    app.innerHTML = '';
    app.appendChild(shell);
    render();
  };

  const renderWrongReview = () => {
    const app = document.getElementById('wrong-review-app');
    if (!app) return;

    const wrongBank = Object.values(getWrongBank());
    if (!wrongBank.length) {
      app.innerHTML = '<div class="mem-empty-state">当前设备上还没有错题，继续去做题即可。</div>';
      return;
    }

    const shell = document.createElement('div');
    shell.className = 'mem-wrong-shell';

    const title = document.createElement('div');
    title.className = 'mem-practice-meta';
    title.innerHTML = `<span>共 ${wrongBank.length} 题待复盘</span><span>重新做对后会自动移出错题本</span>`;
    shell.appendChild(title);

    const list = document.createElement('div');
    list.className = 'mem-wrong-list';

    wrongBank.forEach((question) => {
      const card = document.createElement('section');
      card.className = 'mem-wrong-card';
      card.innerHTML = `
        <p class="mem-practice-label">${question.subject} / ${question.category}</p>
        <h3>${question.stem}</h3>
        <p>${question.explanation || '当前题目暂未提供解析。'}</p>
      `;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mem-button-primary';
      button.textContent = '标记为已复盘';
      button.addEventListener('click', () => {
        const wrong = getWrongBank();
        delete wrong[question.id];
        writeJson(WRONG_KEY, wrong);
        renderWrongReview();
        updateProgressCards();
      });

      card.appendChild(button);
      list.appendChild(card);
    });

    shell.appendChild(list);
    app.innerHTML = '';
    app.appendChild(shell);
  };

  document.addEventListener('DOMContentLoaded', () => {
    updateProgressCards();
    renderPracticeApp();
    renderWrongReview();
  });
})();
