export interface User {
  id: string;
  name: string;
  skills: string[];
  location: string;
  role: "Need Help" | "Can Help" | "Both";
  trustScore: number;
  contributions: number;
  badges: string[];
  interests: string[];
  initials: string;
  avatarColor: string;
}

export interface Request {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: "High" | "Medium" | "Low";
  status: "Open" | "Solved";
  tags: string[];
  authorId: string;
  helpers: string[];
  createdAt: string;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  subtitle: string;
  type: "Status" | "Match" | "Request" | "Reputation" | "Insight";
  read: boolean;
  timestamp: string;
}

const USERS_KEY = "helplytics_users";
const REQUESTS_KEY = "helplytics_requests";
const MESSAGES_KEY = "helplytics_messages";
const NOTIFICATIONS_KEY = "helplytics_notifications";
const CURRENT_USER_KEY = "helplytics_current_user";

const SEED_DONE_KEY = "helplytics_seeded";

const defaultUsers: User[] = [
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
    avatarColor: "#10b981",
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
    interests: ["Open Source", "React", "DevOps"],
    initials: "HA",
    avatarColor: "#f97316",
  },
  {
    id: "user_3",
    name: "Sara Noor",
    skills: ["Python", "Data Analysis"],
    location: "Remote",
    role: "Need Help",
    trustScore: 74,
    contributions: 11,
    badges: ["Community Voice"],
    interests: ["Data Science", "ML", "Community"],
    initials: "SN",
    avatarColor: "#8b5cf6",
  },
];

const defaultRequests: Request[] = [
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
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "req_2",
    title: "Need help making my portfolio responsive before demo day",
    description:
      "My HTML/CSS portfolio breaks on tablets and I need layout guidance before tomorrow evening.",
    category: "Web Development",
    urgency: "High",
    status: "Solved",
    tags: ["HTML/CSS", "Responsive", "Portfolio"],
    authorId: "user_3",
    helpers: ["user_1"],
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: "req_3",
    title: "Looking for Figma feedback on a volunteer event poster",
    description:
      "I have a draft poster for a campus community event and want sharper hierarchy, spacing, and CTA copy.",
    category: "Design",
    urgency: "Medium",
    status: "Open",
    tags: ["Figma", "Poster", "Design Review"],
    authorId: "user_1",
    helpers: ["user_2"],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "req_4",
    title: "Need mock interview support for internship applications",
    description:
      "Applying to frontend internships and need someone to practice behavioral and technical interview questions with me.",
    category: "Career",
    urgency: "Low",
    status: "Solved",
    tags: ["Interview Prep", "Career", "Frontend"],
    authorId: "user_3",
    helpers: ["user_1", "user_2"],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

const defaultMessages: Message[] = [
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

const defaultNotifications: Notification[] = [
  {
    id: "notif_1",
    title: '"Need help" was marked as solved',
    subtitle: "Status",
    type: "Status",
    read: false,
    timestamp: "Just now",
  },
  {
    id: "notif_2",
    title: 'Ayesha Khan offered help on "Need help"',
    subtitle: "Match",
    type: "Match",
    read: false,
    timestamp: "Just now",
  },
  {
    id: "notif_3",
    title: 'Your request "Need help" is now live in the community feed',
    subtitle: "Request",
    type: "Request",
    read: false,
    timestamp: "Just now",
  },
  {
    id: "notif_4",
    title: '"Need help making my portfolio responsive before demo day" was marked as solved',
    subtitle: "Status",
    type: "Status",
    read: false,
    timestamp: "Just now",
  },
  {
    id: "notif_5",
    title: "New helper matched to your responsive portfolio request",
    subtitle: "Match",
    type: "Match",
    read: false,
    timestamp: "12 min ago",
  },
  {
    id: "notif_6",
    title: "Your trust score increased after a solved request",
    subtitle: "Reputation",
    type: "Reputation",
    read: false,
    timestamp: "1 hr ago",
  },
  {
    id: "notif_7",
    title: "AI Center detected rising demand for interview prep",
    subtitle: "Insight",
    type: "Insight",
    read: true,
    timestamp: "Today",
  },
  {
    id: "notif_8",
    title: "Hassan Ali joined as a helper on your Figma poster request",
    subtitle: "Match",
    type: "Match",
    read: true,
    timestamp: "Today",
  },
  {
    id: "notif_9",
    title: "Community milestone: 69 requests solved this month",
    subtitle: "Insight",
    type: "Insight",
    read: true,
    timestamp: "Yesterday",
  },
];

export function initStorage() {
  if (localStorage.getItem(SEED_DONE_KEY)) return;
  localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(defaultRequests));
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(defaultMessages));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(defaultNotifications));
  localStorage.setItem(SEED_DONE_KEY, "true");
}

export function getUsers(): User[] {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

export function saveUser(user: User) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): User | null {
  const id = localStorage.getItem(CURRENT_USER_KEY);
  if (!id) return null;
  return getUserById(id) || null;
}

export function setCurrentUser(userId: string) {
  localStorage.setItem(CURRENT_USER_KEY, userId);
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getRequests(): Request[] {
  return JSON.parse(localStorage.getItem(REQUESTS_KEY) || "[]");
}

export function getRequestById(id: string): Request | undefined {
  return getRequests().find((r) => r.id === id);
}

export function saveRequest(req: Request) {
  const requests = getRequests();
  const idx = requests.findIndex((r) => r.id === req.id);
  if (idx >= 0) requests[idx] = req;
  else requests.push(req);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

export function getMessages(): Message[] {
  return JSON.parse(localStorage.getItem(MESSAGES_KEY) || "[]");
}

export function addMessage(msg: Message) {
  const messages = getMessages();
  messages.push(msg);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export function getNotifications(): Notification[] {
  return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
}

export function markNotificationRead(id: string) {
  const notifs = getNotifications();
  const notif = notifs.find((n) => n.id === id);
  if (notif) notif.read = true;
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
}

export function addNotification(notif: Notification) {
  const notifs = getNotifications();
  notifs.unshift(notif);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
}
