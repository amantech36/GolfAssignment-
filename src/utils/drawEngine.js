// ============================================================
// drawEngine.js
// Utility functions for the draw system
// ============================================================

/**
 * Generate random winning numbers (lottery-style)
 * @param {number} count - How many numbers to draw (default 5)
 * @param {number} min - Minimum value (default 1)
 * @param {number} max - Maximum value (default 45, matching Stableford range)
 * @returns {number[]} Sorted array of unique random numbers
 */
export function generateRandomNumbers(count = 5, min = 1, max = 45) {
  const numbers = new Set()
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * (max - min + 1)) + min)
  }
  return [...numbers].sort((a, b) => a - b)
}

/**
 * Generate algorithmic winning numbers weighted by score frequency
 * @param {number[]} allScores - Array of all user scores
 * @param {string} mode - 'frequent' or 'rare' weighting
 * @param {number} count - How many numbers to draw
 * @returns {number[]} Sorted array of weighted random numbers
 */
export function generateAlgorithmicNumbers(allScores, mode = "frequent", count = 5) {
  if (!allScores.length) return generateRandomNumbers(count)

  // Count frequency of each score
  const freq = {}
  for (let s of allScores) {
    freq[s] = (freq[s] || 0) + 1
  }

  // Build weighted pool
  const pool = []
  for (let score = 1; score <= 45; score++) {
    const f = freq[score] || 0
    // More frequent scores get more weight in 'frequent' mode, less in 'rare'
    const weight = mode === "frequent" ? Math.max(f, 1) : Math.max(10 - f, 1)
    for (let i = 0; i < weight; i++) pool.push(score)
  }

  // Pick unique numbers from weighted pool
  const numbers = new Set()
  let attempts = 0
  while (numbers.size < count && attempts < 1000) {
    numbers.add(pool[Math.floor(Math.random() * pool.length)])
    attempts++
  }

  // Fill remaining with random if needed
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * 45) + 1)
  }

  return [...numbers].sort((a, b) => a - b)
}

/**
 * Check how many numbers match between user scores and winning numbers
 * @param {number[]} userScores - User's 5 scores
 * @param {number[]} winningNumbers - The 5 winning numbers
 * @returns {number} Number of matches (0-5)
 */
export function countMatches(userScores, winningNumbers) {
  const winSet = new Set(winningNumbers)
  return userScores.filter((s) => winSet.has(s)).length
}

/**
 * Determine match type from match count
 * @param {number} matches
 * @returns {string|null} '5-match', '4-match', '3-match', or null
 */
export function getMatchType(matches) {
  if (matches >= 5) return "5-match"
  if (matches === 4) return "4-match"
  if (matches === 3) return "3-match"
  return null
}

/**
 * Calculate prize pool breakdown
 * @param {number} activeSubscribers - Number of active subscribers
 * @param {number} subscriptionFee - Monthly fee per subscriber
 * @param {number} prizePoolPercent - Percentage of fee going to prize pool
 * @returns {{ total: number, fiveMatch: number, fourMatch: number, threeMatch: number }}
 */
export function calculatePrizePool(activeSubscribers, subscriptionFee = 20, prizePoolPercent = 0.5) {
  const total = activeSubscribers * subscriptionFee * prizePoolPercent
  return {
    total: Math.round(total * 100) / 100,
    fiveMatch: Math.round(total * 0.4 * 100) / 100,
    fourMatch: Math.round(total * 0.35 * 100) / 100,
    threeMatch: Math.round(total * 0.25 * 100) / 100,
  }
}
