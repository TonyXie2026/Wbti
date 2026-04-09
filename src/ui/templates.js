function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatQuestionNumber(index, total) {
  const current = String(index + 1).padStart(2, "0");
  const max = String(total).padStart(2, "0");
  return `${current} / ${max}`;
}

function renderLoading() {
  return `
    <main class="screen screen-centered">
      <section class="panel status-card">
        <span class="status-mark">WBTI</span>
        <p class="status-title">正在读取你的上网痕迹</p>
        <p class="status-text">题库和标签马上就绪，识别很快开始。</p>
      </section>
    </main>
  `;
}

function renderError(errorMessage) {
  return `
    <main class="screen screen-centered">
      <section class="panel status-card">
        <span class="status-mark">WBTI</span>
        <p class="status-title">识别失败</p>
        <p class="status-text">${escapeHtml(errorMessage)}</p>
      </section>
    </main>
  `;
}

function renderLanding(state) {
  return `
    <main class="screen screen-centered">
      <section class="landing-shell" aria-label="WBTI（Web Behavior Type Indicator）">
        <h1 class="landing-title">你在网上<br />是什么成分</h1>
        <p class="landing-slogan">你不是在上网，你是在被识别</p>
        ${
          state.savedResult
            ? `
              <div class="landing-actions">
                <button class="button button-primary button-large landing-cta" data-action="start-quiz">
                  开始被识别
                </button>
                <button class="button button-ghost button-large" data-action="view-last-result">
                  查看上次结果
                </button>
              </div>
            `
            : `
              <button class="button button-primary button-large landing-cta" data-action="start-quiz">
                开始被识别
              </button>
            `
        }
      </section>
    </main>
  `;
}

function renderQuiz(state) {
  const question = state.questions[state.currentQuestionIndex];
  const selectedTag = state.answers[state.currentQuestionIndex];
  const progress = ((state.currentQuestionIndex + 1) / state.questions.length) * 100;
  const answeredCount = state.answers.filter(Boolean).length;

  return `
    <main class="screen">
      <section class="quiz-wrap">
        <div class="quiz-topline">
          <button class="button button-ghost" data-action="go-home">回首页</button>
          <span class="quiz-brand">WBTI</span>
        </div>

        <div class="progress-shell" aria-label="识别进度">
          <div class="progress-bar">
            <span style="width: ${progress}%"></span>
          </div>
          <p class="progress-copy">识别进度 ${answeredCount} / ${state.questions.length}</p>
        </div>

        <article class="panel question-card">
          <p class="question-tag">第 ${formatQuestionNumber(
            state.currentQuestionIndex,
            state.questions.length
          )} 题</p>
          <h2 class="question-title">${escapeHtml(question.question)}</h2>
          <div class="option-list">
            ${question.options
              .map(
                (option, optionIndex) => `
                  <button
                    class="option-button ${selectedTag === option.tag ? "is-selected" : ""}"
                    data-action="answer"
                    data-option-tag="${escapeHtml(option.tag)}"
                  >
                    <span class="option-index">${String.fromCharCode(65 + optionIndex)}</span>
                    <span class="option-text">${escapeHtml(option.text)}</span>
                  </button>
                `
              )
              .join("")}
          </div>

          <div class="quiz-footer">
            <button
              class="button button-secondary"
              data-action="previous-question"
              ${state.currentQuestionIndex === 0 ? "disabled" : ""}
            >
              上一题
            </button>
            <p class="quiz-hint">每次只显示一题，点选后会自动进入下一题。</p>
          </div>
        </article>
      </section>
    </main>
  `;
}

function renderResult(state) {
  const result = state.result;
  const longDescription = Array.isArray(result.longDescription) ? result.longDescription : [];

  return `
    <main class="result-page">
      <section class="poster-stage">
        <div class="poster-stage-inner">
          <article class="panel poster-card">
            <span class="poster-badge">WBTI</span>
            <h1 class="poster-title">${escapeHtml(result.winner.name)}</h1>
            <p class="poster-summary">${escapeHtml(result.summary)}</p>

            <div class="poster-image-wrap">
              <img
                class="poster-image"
                src="${escapeHtml(result.winner.image || "/assets/placeholder-character.png")}"
                alt="${escapeHtml(result.winner.name)} 角色图"
                data-fallback="/assets/placeholder-character.png"
              />
            </div>
          </article>
        </div>
      </section>

      <section class="interpret-stage">
        <div class="interpret-shell">
          <p class="interpret-eyebrow">WBTI / 继续往下看</p>
          <h2 class="interpret-title">该人格的简单解读</h2>
          <div class="interpret-body">
            ${longDescription
              .map(
                (paragraph) => `
                  <p class="interpret-paragraph">${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>
                `
              )
              .join("")}
          </div>

          <div class="interpret-actions">
            <button class="button button-secondary" data-action="retake-quiz">再测一次</button>
            <button class="button button-ghost" data-action="go-home">回首页</button>
          </div>
        </div>
      </section>
    </main>
  `;
}

export function renderApp(state) {
  const content = state.loading
    ? renderLoading()
    : state.error
      ? renderError(state.error)
      : state.screen === "quiz"
        ? renderQuiz(state)
        : state.screen === "result"
          ? renderResult(state)
          : renderLanding(state);

  return `
    <div class="page-shell">
      <div class="page-noise"></div>
      ${content}
    </div>
  `;
}
