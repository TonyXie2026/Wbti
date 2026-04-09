function stripEndingPunctuation(text) {
  return String(text || "").replace(/[。！？!?]+$/u, "");
}

function buildSummary(primary, secondary) {
  const primaryPart = stripEndingPunctuation(primary.shortDesc);

  if (!secondary || secondary.id === primary.id || !secondary.blendHint) {
    return primaryPart;
  }

  return `${primaryPart}，${stripEndingPunctuation(secondary.blendHint)}`;
}

function buildResultProfile(primary, secondary) {
  return {
    summary: buildSummary(primary, secondary),
    longDescription: Array.isArray(primary.longDesc) ? primary.longDesc : [],
    shareText: `我在 WBTI 测出来是：${primary.name}\n你在网上是什么东西？`
  };
}

export function calculateResult(answers, tags) {
  const tagOrder = new Map(tags.map((tag, index) => [tag.id, index]));
  const scoreMap = new Map(tags.map((tag) => [tag.id, 0]));
  const lastHitMap = new Map(tags.map((tag) => [tag.id, -1]));

  answers.forEach((tagId, questionIndex) => {
    if (!tagId || !scoreMap.has(tagId)) {
      return;
    }

    scoreMap.set(tagId, (scoreMap.get(tagId) || 0) + 1);
    lastHitMap.set(tagId, questionIndex);
  });

  const rankedAll = tags
    .map((tag) => ({
      tag,
      score: scoreMap.get(tag.id) || 0,
      lastHitIndex: lastHitMap.get(tag.id) ?? -1
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.lastHitIndex !== left.lastHitIndex) {
        return right.lastHitIndex - left.lastHitIndex;
      }

      return (tagOrder.get(left.tag.id) || 0) - (tagOrder.get(right.tag.id) || 0);
    });

  const ranked = rankedAll.filter((item) => item.score > 0);
  const winnerEntry = rankedAll[0] || { tag: tags[0], score: 0 };
  const secondaryEntry = rankedAll[1] || winnerEntry;
  const winnerTieCount = rankedAll.filter((item) => item.score === winnerEntry.score).length;
  const secondaryTieCount = rankedAll.filter((item) => item.score === secondaryEntry.score).length;
  const profile = buildResultProfile(winnerEntry.tag, secondaryEntry.tag);

  return {
    winner: winnerEntry.tag,
    secondary: secondaryEntry.tag,
    score: winnerEntry.score,
    secondaryScore: secondaryEntry.score,
    tieBreakApplied: winnerTieCount > 1 || secondaryTieCount > 1,
    ranked,
    ...profile
  };
}

export function formatSavedResult(savedResult, tags) {
  if (!savedResult || !savedResult.tagId || !savedResult.secondaryTagId) {
    return null;
  }

  const winner = tags.find((item) => item.id === savedResult.tagId);
  const secondary = tags.find((item) => item.id === savedResult.secondaryTagId);

  if (!winner || !secondary) {
    return null;
  }

  return {
    winner,
    secondary,
    score: savedResult.score ?? 0,
    secondaryScore: savedResult.secondaryScore ?? 0,
    tieBreakApplied: Boolean(savedResult.tieBreakApplied),
    savedAt: savedResult.savedAt || null,
    ranked: [],
    ...buildResultProfile(winner, secondary)
  };
}

export function summarizeTopTags(result, limit = 2) {
  return result.ranked.slice(0, limit);
}

export function createEmptyAnswers(total) {
  return Array.from({ length: total }, () => null);
}
