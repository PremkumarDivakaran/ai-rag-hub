/**
 * Typo correction with keyboard-distance aware suggestions.
 * Designed for short search queries and domain dictionaries.
 */

import {
  abbreviationMap,
  synonymMap,
  phraseMap,
  preservedStopWords,
  testCasePrefixes
} from './dictionaries.js';

const KEYBOARD_ROWS = [
  '1234567890',
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm'
];

const KEYBOARD_POSITIONS = buildKeyboardPositions();
const SAFE_COMMON_WORDS = new Set([
  'user', 'users', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'not', 'no',
  'able', 'unable', 'can', 'cannot', 'could', 'should', 'would', 'will',
  'to', 'from', 'for', 'in', 'on', 'at', 'with', 'without', 'into',
  'make', 'makes', 'making', 'made', 'payment', 'payments', 'pay', 'paying',
  'login', 'logins', 'service', 'app', 'application', 'error', 'failed', 'failure'
]);

function buildKeyboardPositions() {
  const positions = new Map();
  for (let row = 0; row < KEYBOARD_ROWS.length; row++) {
    const chars = KEYBOARD_ROWS[row];
    for (let col = 0; col < chars.length; col++) {
      positions.set(chars[col], { row, col });
    }
  }
  return positions;
}

function keyboardDistanceChar(a, b) {
  if (a === b) return 0;
  const pa = KEYBOARD_POSITIONS.get(a);
  const pb = KEYBOARD_POSITIONS.get(b);
  if (!pa || !pb) return 3;
  return Math.abs(pa.row - pb.row) + Math.abs(pa.col - pb.col);
}

function substitutionCost(a, b) {
  if (a === b) return 0;
  const kd = keyboardDistanceChar(a, b);
  if (kd <= 1) return 0.35;
  if (kd === 2) return 0.6;
  return 1;
}

function weightedEditDistance(a, b) {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  const m = s1.length;
  const n = s2.length;

  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const del = dp[i - 1][j] + 1;
      const ins = dp[i][j - 1] + 1;
      const sub = dp[i - 1][j - 1] + substitutionCost(s1[i - 1], s2[j - 1]);
      dp[i][j] = Math.min(del, ins, sub);
    }
  }
  return dp[m][n];
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function normalizeTerm(term) {
  return String(term || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shouldSkipCorrection(token) {
  if (!token || token.length < 3) return true;
  if (/\d/.test(token)) return true; // keep tokens like p1/tc_123 as-is
  if (token.includes('_') || token.includes('-')) return true;
  if (SAFE_COMMON_WORDS.has(token)) return true; // do not mutate common valid words
  return false;
}

function keyboardSimilarityConfidence(editDistance, tokenLength) {
  const norm = editDistance / Math.max(1, tokenLength);
  return Math.max(0, Math.min(1, 1 - norm));
}

export function buildDomainVocabulary(extraTerms = []) {
  const vocabulary = new Set();

  const addTerms = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(addTerms);
      return;
    }
    const text = normalizeTerm(value);
    if (!text) return;
    text.split(' ').filter(Boolean).forEach((t) => vocabulary.add(t));
    vocabulary.add(text);
  };

  Object.entries(abbreviationMap).forEach(([k, v]) => {
    addTerms(k);
    addTerms(v);
  });

  Object.entries(synonymMap).forEach(([k, arr]) => {
    addTerms(k);
    addTerms(arr);
  });

  Object.entries(phraseMap).forEach(([k, arr]) => {
    addTerms(k);
    addTerms(arr);
  });

  addTerms(preservedStopWords);
  addTerms(testCasePrefixes);
  addTerms(extraTerms);

  return vocabulary;
}

export function suggestTokenCorrections(token, options = {}) {
  const {
    vocabulary = buildDomainVocabulary(),
    maxSuggestions = 3,
    maxNormalizedDistance = 0.28,
    minConfidence = 0.72
  } = options;

  const cleanToken = normalizeTerm(token);
  if (!cleanToken || shouldSkipCorrection(cleanToken)) return [];
  if (vocabulary.has(cleanToken)) return [];

  const candidates = [];
  for (const candidate of vocabulary) {
    if (!candidate || candidate.includes(' ')) continue;
    if (Math.abs(candidate.length - cleanToken.length) > 2) continue;

    const dist = weightedEditDistance(cleanToken, candidate);
    const normDist = dist / Math.max(candidate.length, cleanToken.length);
    if (normDist > maxNormalizedDistance) continue;

    const kd = averageKeyboardDistance(cleanToken, candidate);
    const confidence = keyboardSimilarityConfidence(dist, cleanToken.length);
    if (confidence < minConfidence) continue;
    candidates.push({
      term: candidate,
      score: normDist + kd * 0.05,
      editDistance: Number(dist.toFixed(3)),
      normalizedDistance: Number(normDist.toFixed(3)),
      keyboardDistance: Number(kd.toFixed(3)),
      confidence: Number(confidence.toFixed(3))
    });
  }

  candidates.sort((a, b) => a.score - b.score);
  return candidates.slice(0, maxSuggestions);
}

function averageKeyboardDistance(token, candidate) {
  const len = Math.min(token.length, candidate.length);
  if (len === 0) return 3;
  let total = 0;
  for (let i = 0; i < len; i++) {
    total += keyboardDistanceChar(token[i], candidate[i]);
  }
  return total / len;
}

export function correctTextTypos(text, options = {}) {
  const {
    vocabulary = buildDomainVocabulary(),
    maxSuggestions = 3,
    applyCorrections = true
  } = options;

  const rawTokens = tokenize(text);
  const corrections = [];
  const correctedTokens = [];

  for (const token of rawTokens) {
    const suggestions = suggestTokenCorrections(token, {
      vocabulary,
      maxSuggestions
    });

    if (suggestions.length > 0) {
      const best = suggestions[0];
      corrections.push({
        original: token,
        corrected: best.term,
        suggestions
      });
      correctedTokens.push(applyCorrections ? best.term : token);
    } else {
      correctedTokens.push(token);
    }
  }

  return {
    original: text,
    corrected: correctedTokens.join(' ').trim(),
    corrections
  };
}

export function analyzeTypos(text, options = {}) {
  const {
    vocabulary = buildDomainVocabulary(),
    maxSuggestions = 3
  } = options;

  const tokens = tokenize(text);
  const suggestions = tokens
    .map((token) => ({
      token,
      suggestions: suggestTokenCorrections(token, { vocabulary, maxSuggestions })
    }))
    .filter((x) => x.suggestions.length > 0);

  return {
    original: text,
    tokens,
    suggestions
  };
}

export default {
  buildDomainVocabulary,
  suggestTokenCorrections,
  correctTextTypos,
  analyzeTypos
};
