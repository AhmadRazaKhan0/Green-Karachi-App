export function detectCategory(text) {
  const t = text.toLowerCase();
  if (/react|css|html|js|javascript|typescript|vite|web|frontend|backend|api|portfolio|responsive/i.test(t)) return "Web Development";
  if (/figma|design|ui|ux|poster|logo|color|spacing|typography|banner/i.test(t)) return "Design";
  if (/interview|internship|job|career|resume|cv|salary|linkedin|behavioral/i.test(t)) return "Career";
  if (/data|python|pandas|excel|sql|chart|analysis|dashboard/i.test(t)) return "Data";
  if (/git|github|deploy|server|docker|cloud|linux|bash|devops/i.test(t)) return "DevOps";
  return "Community";
}

export function detectUrgency(text) {
  const t = text.toLowerCase();
  if (/urgent|asap|emergency|critical|deadline|today|tonight|tomorrow|immediately|quickly|right now/i.test(t)) return "High";
  if (/soon|this week|few days|help me|need help|struggling|confused/i.test(t)) return "Medium";
  return "Low";
}

export function suggestTags(title, description) {
  const text = (title + " " + description).toLowerCase();
  const tagMap = {
    "HTML/CSS": /html|css|style|layout|responsive/,
    "JavaScript": /javascript|js|script|dom|async/,
    "React": /react|component|hook|state|props/,
    "TypeScript": /typescript|ts|type/,
    "Figma": /figma|design|wireframe|prototype/,
    "Portfolio": /portfolio|project showcase|personal site/,
    "Responsive": /responsive|mobile|tablet|breakpoint/,
    "Interview Prep": /interview|behavioral|technical|question/,
    "Career": /career|job|internship|resume/,
    "Frontend": /frontend|front-end|browser/,
    "Poster": /poster|flyer|banner/,
    "Design Review": /feedback|review|critique|improve/,
    "Python": /python|pandas|numpy|flask|django/,
    "Git/GitHub": /git|github|commit|branch|pull request/,
  };
  return Object.entries(tagMap)
    .filter(([, re]) => re.test(text))
    .map(([tag]) => tag)
    .slice(0, 4);
}

export function rewriteRequest(title, description) {
  if (!description || description.length < 20) return null;
  return `${title} — ${description.charAt(0).toUpperCase() + description.slice(1).trim()}. Looking for targeted support from someone with relevant experience who can provide clear guidance and help move this forward.`;
}

export function suggestHelperSkills(skills) {
  const map = {
    "React": ["Frontend Development", "Component Design"],
    "Figma": ["UI Review", "Wireframing"],
    "HTML/CSS": ["Portfolio Review", "Responsive Layouts"],
    "JavaScript": ["JS Debugging", "API Integration"],
    "Python": ["Data Scripts", "Automation"],
    "Git/GitHub": ["Code Review", "Version Control Help"],
    "Career Guidance": ["Mock Interviews", "Resume Review"],
    "UI/UX": ["Design Critiques", "User Testing"],
  };
  const result = new Set();
  skills.forEach(s => (map[s] || []).forEach(v => result.add(v)));
  return [...result].slice(0, 5);
}

export function suggestNeedAreas(skills) {
  const all = ["Backend Development", "DevOps", "Data Analysis", "Mobile Development", "UI/UX", "Marketing", "Content Strategy"];
  return all.filter(a => !skills.some(s => a.toLowerCase().includes(s.toLowerCase()))).slice(0, 4);
}

export function getAISummary(req) {
  if (req.category === "Web Development") {
    return `Web Development request with ${req.urgency.toLowerCase()} urgency. Best suited for members with relevant expertise in ${req.tags.includes("Responsive") ? "responsive layouts," : ""} CSS, and frontend frameworks.`;
  }
  if (req.category === "Design") {
    return "A visual design critique request where feedback on hierarchy, spacing, and messaging would create the most value.";
  }
  if (req.category === "Career") {
    return `Career coaching request focused on confidence-building, behavioral answers, and entry-level ${req.tags.includes("Frontend") ? "frontend" : ""} interviews.`;
  }
  return "Community support request. Best matched with members who have contributed to similar areas before.";
}
