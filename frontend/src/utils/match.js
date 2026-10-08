export function skillMatch(jobSkills = [], mySkills = []) {
  if (!jobSkills.length) return null
  const mine = new Set(mySkills.map((s) => s.trim().toLowerCase()))
  const hit = jobSkills.filter((s) => mine.has(s.trim().toLowerCase()))
  return { pct: Math.round((hit.length / jobSkills.length) * 100), hit, missing: jobSkills.filter((s) => !hit.includes(s)) }
}
