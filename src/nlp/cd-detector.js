// src/nlp/cd-detector.js
// Regex-based detection for obvious CDs. To be replaced by BERT/model later.

const cdPatterns = [
  { type: 'All-or-Nothing', regex: /(always|never|everyone|nobody|completely|totally)/i },
  { type: 'Should Statements', regex: /\bshould\b|\bout to\b|\bmust\b|\bhave to\b/i },
  { type: 'Labeling', regex: /(i[\s']*am|you[\s']*are)[\w\s]*(loser|idiot|stupid|worthless|failure)/i },
  { type: 'Catastrophizing', regex: /(disaster|ruined|hopeless|worst( case)?|awful|terrible)/i },
];

// sensitivity: 'low', 'medium', 'high'
function detectCDs(text, sensitivity = 'medium') {
  let patternsToCheck = cdPatterns;
  if (sensitivity === 'low') patternsToCheck = cdPatterns.filter((p,i)=>i<=1);
  if (sensitivity === 'high') patternsToCheck = cdPatterns; // (future: add more patterns)
  return patternsToCheck.reduce((found, pattern) => {
    if (pattern.regex.test(text)) found.push(pattern.type);
    return found;
  }, []);
}

export { detectCDs, cdPatterns };