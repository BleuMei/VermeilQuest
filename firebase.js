/* ═══════════════════════════════════════════
   VERMEIL QUEST · firebase.js
   Central Firebase utility — import from here
   ═══════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit,
  getDocs, addDoc, serverTimestamp, increment,
  arrayUnion, arrayRemove, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ── Config ── */
const firebaseConfig = {
  apiKey:            "AIzaSyBMc36-Vg_Ger814ZWz_JHs7KG-csgGggA",
  authDomain:        "vermeil-quest.firebaseapp.com",
  projectId:         "vermeil-quest",
  storageBucket:     "vermeil-quest.firebasestorage.app",
  messagingSenderId: "943194791633",
  appId:             "1:943194791633:web:a3ddd0f3914f518171aff0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit,
  getDocs, addDoc, serverTimestamp, increment,
  arrayUnion, arrayRemove, onSnapshot
};

/* ═══════════════════════════════════════════
   SESSION
   ═══════════════════════════════════════════ */
export function getSession() {
  try { return JSON.parse(localStorage.getItem("vq_session")) || null; }
  catch { return null; }
}
export function saveSession(d) { localStorage.setItem("vq_session", JSON.stringify(d)); }
export function clearSession()  { localStorage.removeItem("vq_session"); }

export function requireRole(role) {
  const s = getSession();
  if (!s?.id) { location.href = "index.html"; return null; }
  if (role && s.role !== role) {
    const map = { admin:"admin-portal.html", teacher:"teacher-portal.html", student:"dashboard.html" };
    location.href = map[s.role] || "index.html";
    return null;
  }
  return s;
}

/* ═══════════════════════════════════════════
   CRUD HELPERS
   ═══════════════════════════════════════════ */
export async function getDoc_(col, id) {
  try {
    const s = await getDoc(doc(db, col, id));
    return s.exists() ? { id: s.id, ...s.data() } : null;
  } catch(e) { console.error(e); return null; }
}
export async function setDoc_(col, id, data) {
  try { await setDoc(doc(db, col, id), data, { merge:true }); return true; }
  catch(e) { console.error(e); return false; }
}
export async function updateDoc_(col, id, data) {
  try { await updateDoc(doc(db, col, id), data); return true; }
  catch(e) { console.error(e); return false; }
}
export async function deleteDoc_(col, id) {
  try { await deleteDoc(doc(db, col, id)); return true; }
  catch(e) { console.error(e); return false; }
}
export async function addDoc_(col, data) {
  try {
    const r = await addDoc(collection(db, col), { ...data, createdAt: serverTimestamp() });
    return r.id;
  } catch(e) { console.error(e); return null; }
}
export async function queryDocs(col, filters=[], sorts=[], lim=200) {
  try {
    const constraints = [
      ...filters.map(([f,op,v]) => where(f, op, v)),
      ...sorts.map(([f,d])     => orderBy(f, d||"asc")),
      limit(lim)
    ];
    const snap = await getDocs(query(collection(db, col), ...constraints));
    return snap.docs.map(d => ({ id:d.id, ...d.data() }));
  } catch(e) { console.error(e); return []; }
}

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */
export const XP_PER_LEVEL = 100;
export const STREAK_XP    = [10,15,20,25,30,40,60]; // Day 1-7

export const RANK_TITLES = [
  { max:3,  label:"Initiate",    color:"#94a3b8" },
  { max:6,  label:"Apprentice",  color:"#93c5fd" },
  { max:10, label:"Scholar",     color:"#60a5fa" },
  { max:15, label:"Adept",       color:"#818cf8" },
  { max:20, label:"Sage",        color:"#a78bfa" },
  { max:30, label:"Archmage",    color:"#c084fc" },
  { max:99, label:"Grandmaster", color:"#f59e0b" },
  { max:999,label:"Legendary",   color:"#ef4444" },
];
export function getRankTitle(lvl) {
  return RANK_TITLES.find(r => lvl <= r.max) || RANK_TITLES.at(-1);
}
export function getLevel(xp) { return Math.floor(xp / XP_PER_LEVEL) + 1; }
export function getXPProgress(xp) { return xp % XP_PER_LEVEL; }

export const PROGRAM_META = {
  IT:  { color:"#93c5fd", bg:"rgba(59,130,246,0.15)",  border:"rgba(96,165,250,0.35)",  full:"Information Technology" },
  CS:  { color:"#5eead4", bg:"rgba(20,184,166,0.15)",  border:"rgba(45,212,191,0.35)",  full:"Computer Science" },
  CoE: { color:"#fcd34d", bg:"rgba(245,158,11,0.15)",  border:"rgba(251,191,36,0.35)",  full:"Computer Engineering" },
  ECE: { color:"#d8b4fe", bg:"rgba(168,85,247,0.15)",  border:"rgba(196,132,251,0.35)", full:"Electronics Engineering" },
};
export function progTag(p) {
  const m = PROGRAM_META[p] || {};
  return `<span class="prog-tag" style="background:${m.bg||"rgba(255,255,255,0.08)"};border-color:${m.border||"rgba(255,255,255,0.2)"};color:${m.color||"#cbd5e1"}">${p||"—"}</span>`;
}

export const ACHIEVEMENTS = {
  "streak-7":    { icon:"🔥", title:"Faithful",          desc:"7-day streak",           rarity:"common",    hidden:false },
  "streak-30":   { icon:"💫", title:"Devoted",           desc:"30-day streak",          rarity:"rare",      hidden:false },
  "streak-100":  { icon:"⭐", title:"Legendary Flame",   desc:"100-day streak",         rarity:"legendary", hidden:true  },
  "survey-10":   { icon:"📋", title:"Voice of the People",desc:"Answer 10 surveys",     rarity:"common",    hidden:false },
  "survey-50":   { icon:"🔬", title:"Researcher",        desc:"Answer 50 surveys",      rarity:"rare",      hidden:false },
  "tasks-10":    { icon:"⚔️", title:"Diligent",          desc:"Complete 10 tasks",      rarity:"common",    hidden:false },
  "perfect-score":{ icon:"💎",title:"Perfect Cast",      desc:"Score 100% on a quiz",   rarity:"rare",      hidden:false },
  "rank-top1":   { icon:"👑", title:"Gold Crest",        desc:"Reach #1 on any board",  rarity:"legendary", hidden:false },
  "rank-top3":   { icon:"🥈", title:"Silver Crest",      desc:"Reach top 3",            rarity:"rare",      hidden:false },
  "rank-top10":  { icon:"🏅", title:"Bronze Crest",      desc:"Reach top 10",           rarity:"common",    hidden:false },
  "night-owl":   { icon:"🦉", title:"Night Owl",         desc:"Login between midnight and 1am", rarity:"legendary", hidden:true },
};

export async function checkAchievements(session) {
  const earned  = session.achievements || [];
  const newOnes = [];
  const s       = session;
  const checks  = {
    "streak-7":     () => s.streak >= 7,
    "streak-30":    () => s.streak >= 30,
    "streak-100":   () => s.streak >= 100,
    "survey-10":    () => (s.surveysAnswered||0) >= 10,
    "survey-50":    () => (s.surveysAnswered||0) >= 50,
    "tasks-10":     () => (s.tasksCompleted||0) >= 10,
    "rank-top1":    () => (s.bestRank||999) <= 1,
    "rank-top3":    () => (s.bestRank||999) <= 3,
    "rank-top10":   () => (s.bestRank||999) <= 10,
    "night-owl":    () => { const h=new Date().getHours(); return h===0; },
  };
  for (const [id, fn] of Object.entries(checks)) {
    if (!earned.includes(id) && fn()) newOnes.push(id);
  }
  if (newOnes.length) {
    const updated = [...earned, ...newOnes];
    await updateDoc_("students", session.id, { achievements: updated });
    session.achievements = updated;
    saveSession(session);
  }
  return newOnes;
}

/* ═══════════════════════════════════════════
   TOAST (global)
   ═══════════════════════════════════════════ */
export function toast(msg, type="info", ms=3200) {
  const icons = { info:"💬", xp:"⚡", success:"✅", error:"❌", gold:"🌟", achievement:"🏅", warn:"⚠️" };
  let c = document.getElementById("toastBox");
  if (!c) {
    c = Object.assign(document.createElement("div"), { id:"toastBox" });
    c.style.cssText = "position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;width:min(400px,92vw)";
    document.body.appendChild(c);
  }
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span style="font-size:18px;flex-shrink:0">${icons[type]||"💬"}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add("toast-out"); setTimeout(()=>t.remove(),400); }, ms);
}
