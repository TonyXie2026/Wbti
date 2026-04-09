import {
  calculateResult,
  createEmptyAnswers,
  formatSavedResult,
  summarizeTopTags
} from "./logic/quiz.js";
import { renderApp } from "./ui/templates.js";

const app = document.querySelector("#app");
const storageKey = "internet-persona-test:last-result";

const state = {
  loading: true,
  error: "",
  screen: "landing",
  questions: [],
  tags: [],
  answers: [],
  currentQuestionIndex: 0,
  result: null,
  savedResult: null,
  copyButtonText: "一键复制结果",
  topTags: []
};

async function loadJson(filePath) {
  const response = await fetch(filePath);

  if (!response.ok) {
    throw new Error(`无法读取 ${filePath}`);
  }

  return response.json();
}

function readSavedResult() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSavedResult(result) {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        tagId: result.winner.id,
        secondaryTagId: result.secondary.id,
        score: result.score,
        secondaryScore: result.secondaryScore,
        tieBreakApplied: result.tieBreakApplied,
        savedAt: new Date().toISOString()
      })
    );
  } catch {
    // Ignore storage failures so the quiz still works in restrictive contexts.
  }
}

function syncSavedResult() {
  state.savedResult = formatSavedResult(readSavedResult(), state.tags);
}

function resetQuiz() {
  state.answers = createEmptyAnswers(state.questions.length);
  state.currentQuestionIndex = 0;
  state.result = null;
  state.topTags = [];
  state.copyButtonText = "一键复制结果";
}

function bindImageFallbacks() {
  const images = app.querySelectorAll("img[data-fallback]");

  images.forEach((image) => {
    image.addEventListener(
      "error",
      () => {
        const fallback = image.dataset.fallback;

        if (!fallback || image.dataset.fallbackApplied === "true") {
          return;
        }

        image.dataset.fallbackApplied = "true";
        image.src = fallback;
      },
      { once: true }
    );
  });
}

function render() {
  app.innerHTML = renderApp(state);
  bindImageFallbacks();
}

function startQuiz() {
  if (state.result) {
    resetQuiz();
  }

  state.screen = "quiz";
  state.copyButtonText = "一键复制结果";
  render();
}

function showLanding() {
  state.screen = "landing";
  state.copyButtonText = "一键复制结果";
  render();
}

function showSavedResult() {
  if (!state.savedResult) {
    return;
  }

  state.result = state.savedResult;
  state.topTags = [
    { tag: state.savedResult.winner, score: state.savedResult.score },
    { tag: state.savedResult.secondary, score: state.savedResult.secondaryScore }
  ];
  state.screen = "result";
  state.copyButtonText = "一键复制结果";
  render();
}

function finishQuiz() {
  const result = calculateResult(state.answers, state.tags);
  const savedAt = new Date().toISOString();

  state.result = {
    ...result,
    savedAt
  };
  state.topTags = summarizeTopTags(result);
  state.screen = "result";
  state.copyButtonText = "一键复制结果";

  writeSavedResult(state.result);
  syncSavedResult();
  render();
}

function answerQuestion(tagId) {
  state.answers[state.currentQuestionIndex] = tagId;

  if (state.currentQuestionIndex >= state.questions.length - 1) {
    finishQuiz();
    return;
  }

  state.currentQuestionIndex += 1;
  render();
}

function previousQuestion() {
  if (state.currentQuestionIndex === 0) {
    return;
  }

  state.currentQuestionIndex -= 1;
  render();
}

async function copyResult() {
  if (!state.result) {
    return;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(state.result.shareText);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = state.result.shareText;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    state.copyButtonText = "已复制，直接发群就行";
  } catch {
    state.copyButtonText = "复制失败，请手动复制";
  }

  render();
}

function attachEvents() {
  app.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");

    if (!target) {
      return;
    }

    const { action, optionTag } = target.dataset;

    switch (action) {
      case "start-quiz":
        startQuiz();
        break;
      case "view-last-result":
        showSavedResult();
        break;
      case "answer":
        if (optionTag) {
          answerQuestion(optionTag);
        }
        break;
      case "previous-question":
        previousQuestion();
        break;
      case "retake-quiz":
        resetQuiz();
        startQuiz();
        break;
      case "copy-result":
        await copyResult();
        break;
      case "go-home":
        showLanding();
        break;
      default:
        break;
    }
  });
}

async function init() {
  try {
    const [tags, questions] = await Promise.all([
      loadJson("./src/data/tags.json"),
      loadJson("./src/data/questions.json")
    ]);

    state.tags = tags;
    state.questions = questions;
    state.answers = createEmptyAnswers(questions.length);
    state.loading = false;
    syncSavedResult();
  } catch (error) {
    state.loading = false;
    state.error = error instanceof Error ? error.message : "未知错误";
  }

  render();
}

attachEvents();
init();
