export function detectUrgency(text: string): "High" | "Medium" | "Low" {
  const lower = text.toLowerCase();
  if (/urgent|asap|immediately|deadline|tomorrow|tonight|emergency|critical|right now/.test(lower)) return "High";
  if (/soon|this week|few days|quickly|help needed|important/.test(lower)) return "Medium";
  return "Low";
}

export function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/html|css|javascript|react|vue|angular|frontend|backend|web|node|api|responsive|layout/.test(lower)) return "Web Development";
  if (/figma|design|ui|ux|poster|graphic|logo|prototype|wireframe|sketch/.test(lower)) return "Design";
  if (/python|data|analysis|pandas|machine learning|ml|ai|jupyter|statistics|excel/.test(lower)) return "Data Science";
  if (/interview|career|job|internship|resume|cv|linkedin|networking|salary|offer/.test(lower)) return "Career";
  if (/git|github|devops|docker|kubernetes|deployment|server|linux|bash|terminal/.test(lower)) return "DevOps";
  return "Community";
}

export function suggestTags(text: string): string[] {
  const tagMap: Record<string, string[]> = {
    "HTML/CSS": ["html", "css", "styling", "layout"],
    JavaScript: ["javascript", "js", "vanilla"],
    React: ["react", "reactjs", "hooks", "component"],
    Responsive: ["responsive", "mobile", "tablet", "breakpoint", "media query"],
    Portfolio: ["portfolio", "showcase"],
    Figma: ["figma", "design tool"],
    "Design Review": ["design review", "feedback", "critique"],
    Poster: ["poster", "graphic", "visual"],
    "Interview Prep": ["interview", "mock interview", "behavioral"],
    Career: ["career", "job", "internship"],
    Frontend: ["frontend", "front-end"],
    "Web Development": ["web", "website", "webpage"],
    Python: ["python", "py"],
    "Data Analysis": ["data", "analysis", "analytics"],
    Git: ["git", "github", "version control"],
  };

  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [tag, keywords] of Object.entries(tagMap)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      found.push(tag);
    }
  }
  return found.slice(0, 5);
}

export function rewriteRequest(title: string, description: string): string {
  if (!description || description.length < 10) {
    return "Start describing the challenge to generate a stronger version.";
  }
  const category = detectCategory(description);
  const urgency = detectUrgency(description);
  return `I need help with a ${category.toLowerCase()} challenge: ${description.trim()} This is a ${urgency.toLowerCase()} priority request and I would appreciate guidance from someone with relevant experience.`;
}

export function suggestHelperSkills(skills: string[]): string[] {
  const helpMap: Record<string, string[]> = {
    Figma: ["Design Review", "UI Feedback", "Prototyping"],
    "UI/UX": ["User Research", "Wireframing", "Usability Review"],
    "HTML/CSS": ["Responsive Layouts", "CSS Debugging", "Web Styling"],
    JavaScript: ["Code Review", "Debugging", "Frontend Logic"],
    React: ["Component Architecture", "State Management", "React Hooks"],
    "Git/GitHub": ["Version Control Help", "PR Reviews", "Branch Management"],
    Python: ["Script Writing", "Data Analysis", "Automation"],
    "Career Guidance": ["Mock Interviews", "Resume Review", "Career Planning"],
    "Data Analysis": ["Data Visualization", "Statistical Review", "Dataset Cleaning"],
  };

  const suggestions = new Set<string>();
  for (const skill of skills) {
    const mapped = helpMap[skill];
    if (mapped) mapped.forEach((s) => suggestions.add(s));
  }
  return Array.from(suggestions).slice(0, 5);
}

export function suggestNeedAreas(skills: string[]): string[] {
  const needMap: Record<string, string[]> = {
    Figma: ["Backend Development", "Database Design", "Deployment"],
    "HTML/CSS": ["JavaScript Logic", "Backend APIs", "Performance Optimization"],
    JavaScript: ["System Design", "Cloud Architecture", "Testing"],
    React: ["DevOps", "Database Management", "Mobile Development"],
    Python: ["Frontend Development", "UI Design", "User Research"],
    "Career Guidance": ["Technical Skill Depth", "System Design", "Coding Interviews"],
  };

  const suggestions = new Set<string>();
  for (const skill of skills) {
    const mapped = needMap[skill];
    if (mapped) mapped.forEach((s) => suggestions.add(s));
  }
  return Array.from(suggestions).slice(0, 4);
}

export function getAIInsights(requests: { category: string; urgency: string }[]) {
  const categoryCounts: Record<string, number> = {};
  let highCount = 0;

  for (const r of requests) {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    if (r.urgency === "High") highCount++;
  }

  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Web Development";
  return { topCategory, highUrgencyCount: highCount };
}
