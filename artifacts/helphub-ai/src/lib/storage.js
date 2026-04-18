const USERS_KEY = "helplytics_users";
const REQUESTS_KEY = "helplytics_requests";
const MESSAGES_KEY = "helplytics_messages";
const NOTIFICATIONS_KEY = "helplytics_notifications";
const CURRENT_USER_KEY = "helplytics_current_user";
const SEED_DONE_KEY = "helplytics_seeded";

const defaultUsers = [
  {
    id: "user_1",
    name: "Ayesha Khan",
    skills: ["Figma", "UI/UX", "HTML/CSS", "Career Guidance"],
    location: "Karachi",
    role: "Both",
    trustScore: 100,
    contributions: 35,
    badges: ["Design Ally", "Fast Responder", "Top Mentor"],
    interests: ["Hackathons", "UI/UX", "Community Building"],
    initials: "AK",
    avatarColor: "#e55a4e",
  },
  {
    id: "user_2",
    name: "Hassan Ali",
    skills: ["JavaScript", "React", "Git/GitHub"],
    location: "Lahore",
    role: "Can Help",
    trustScore: 88,
    contributions: 24,
    badges: ["Code Rescuer", "Bug Hunter"],
    interests: ["Open Source", "DevTools", "Hackathons"],
    initials: "HA",
    avatarColor: "#3b4a5c",
  },
  {
    id: "user_3",
    name: "Sara Noor",
    skills: ["Python", "Data Analysis", "Figma"],
    location: "Remote",
    role: "Need Help",
    trustScore: 74,
    contributions: 11,
    badges: ["Community Voice"],
    interests: ["Data Science", "Design", "Mentorship"],
    initials: "SN",
    avatarColor: "#e5813e",
  },
];

const defaultRequests = [
  {
    id: "req_1",
    title: "Need help",
    description: "helpn needed",
    category: "Web Development",
    urgency: "High",
    status: "Solved",
    tags: [],
    authorId: "user_1",
    helpers: ["user_2"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "req_2",
    title: "Need help making my portfolio responsive before demo day",
    description: "My HTML/CSS portfolio breaks on tablets and I need layout guidance before tomorrow evening.",
    category: "Web Development",
    urgency: "High",
    status: "Solved",
    tags: ["HTML/CSS", "Responsive", "Portfolio"],
    authorId: "user_3",
    helpers: ["user_2"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "req_3",
    title: "Looking for Figma feedback on a volunteer event poster",
    description: "I have a draft poster for a campus community event and want sharper hierarchy, spacing, and CTA copy.",
    category: "Design",
    urgency: "Medium",
    status: "Open",
    tags: ["Figma", "Poster", "Design Review"],
    authorId: "user_1",
    helpers: ["user_2"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "req_4",
    title: "Need mock interview support for internship applications",
    description: "Applying to frontend internships and need someone to practice behavioral and technical interview questions with me.",
    category: "Career",
    urgency: "Low",
    status: "Solved",
    tags: ["Interview Prep", "Career", "Frontend"],
    authorId: "user_3",
    helpers: ["user_1", "user_2"],
    createdAt: new Date().toISOString(),
  },
];

const defaultMessages = [
  {
    id: "msg_1",
    fromId: "user_1",
    toId: "user_3",
    text: "I checked your portfolio request. Share the breakpoint screenshots and I can suggest fixes.",
    timestamp: "09:45 AM",
  },
  {
    id: "msg_2",
    fromId: "user_2",
    toId: "user_1",
    text: "Your event poster concept is solid. I would tighten the CTA and reduce the background texture.",
    timestamp: "11:10 AM",
  },
];

const defaultNotifications = [
  { id: "n1", title: '"Need help" was marked as solved', subtitle: "Status", type: "Status", read: false, timestamp: "Just now" },
  { id: "n2", title: 'Ayesha Khan offered help on "Need help"', subtitle: "Match", type: "Match", read: false, timestamp: "Just now" },
  { id: "n3", title: 'Your request "Need help" is now live in the community feed', subtitle: "Request", type: "Request", read: false, timestamp: "Just now" },
  { id: "n4", title: '"Need help making my portfolio responsive before demo day" was marked as solved', subtitle: "Status", type: "Status", read: false, timestamp: "Just now" },
  { id: "n5", title: '"Need help making my portfolio responsive before demo day" was marked as solved', subtitle: "Status", type: "Status", read: false, timestamp: "Just now" },
  { id: "n6", title: '"Need help making my portfolio responsive before demo day" was marked as solved', subtitle: "Status", type: "Status", read: false, timestamp: "Just now" },
  { id: "n7", title: "New helper matched to your responsive portfolio request", subtitle: "Match", type: "Match", read: false, timestamp: "12 min ago" },
  { id: "n8", title: "Your trust score increased after a solved request", subtitle: "Reputation", type: "Reputation", read: false, timestamp: "1 hr ago" },
  { id: "n9", title: "AI Center detected rising demand for interview prep", subtitle: "Insight", type: "Insight", read: true, timestamp: "Today" },
];

export function initStorage() {
  if (localStorage.getItem(SEED_DONE_KEY)) return;
  localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(defaultRequests));
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(defaultMessages));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(defaultNotifications));
  localStorage.setItem(SEED_DONE_KEY, "1");
}

export function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
}
export function getUserById(id) {
  return getUsers().find(u => u.id === id) || null;
}
export function saveUser(user) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) users[idx] = user; else users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getRequests() {
  try { return JSON.parse(localStorage.getItem(REQUESTS_KEY) || "[]"); } catch { return []; }
}
export function getRequestById(id) {
  return getRequests().find(r => r.id === id) || null;
}
export function saveRequest(req) {
  const reqs = getRequests();
  const idx = reqs.findIndex(r => r.id === req.id);
  if (idx >= 0) reqs[idx] = req; else reqs.push(req);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(reqs));
}

export function getMessages() {
  try { return JSON.parse(localStorage.getItem(MESSAGES_KEY) || "[]"); } catch { return []; }
}
export function addMessage(msg) {
  const msgs = getMessages();
  msgs.push(msg);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
}

export function getNotifications() {
  try { return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]"); } catch { return []; }
}
export function addNotification(notif) {
  const ns = getNotifications();
  ns.unshift(notif);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(ns));
}
export function markAllRead() {
  const ns = getNotifications().map(n => ({ ...n, read: true }));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(ns));
}

export function getCurrentUser() {
  try {
    const id = localStorage.getItem(CURRENT_USER_KEY);
    if (!id) return null;
    return getUserById(id);
  } catch { return null; }
}
export function setCurrentUser(id) {
  localStorage.setItem(CURRENT_USER_KEY, id);
}
export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}
