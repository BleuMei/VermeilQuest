/* VERMEIL QUEST · dashboard.js */
import {
  db, getDoc_, setDoc_, updateDoc_, queryDocs, addDoc_,
  getSession, saveSession, requireRole, toast,
  checkAchievements, ACHIEVEMENTS, STREAK_XP,
  getLevel, getXPProgress, getRankTitle, progTag,
  doc, updateDoc, arrayUnion, increment
} from "./firebase.js";

let S = requireRole("student");
if (!S) throw new Error("not student");

const DAY_ICONS  = ["🔵","🔵","🔵","🔵","🟣","🟡","⭐"];
const DAY_LABELS = ["Day 1","Day 2","Day 3","Day 4","Day 5","Day 6","Day 7"];
const ORB_TIERS  = [
  { min:0,   cls:"",            icon:"🔮" },
  { min:8,   cls:"tier-purple", icon:"💜" },
  { min:30,  cls:"tier-gold",   icon:"✨" },
  { min:100, cls:"tier-red",    icon:"🔴" },
];

function todayStr() { return new Date().toDateString(); }
function setText(id, val) { const e=document.getElementById(id); if(e) e.textContent=val; }
function setHTML(id, val) { const e=document.getElementById(id); if(e) e.innerHTML=val; }

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await syncUser();
  renderProfile();
  renderOrb();
  renderStreakTrack();
  await Promise.all([loadQuests(), loadClasses(), loadSurveys(), loadVault(), loadAnnouncements(), loadNotifications(), updateDeptRank()]);
}

async function syncUser() {
  try {
    const remote = await getDoc_("students", S.id);
    if (remote) { Object.assign(S, remote); saveSession(S); }
    else await setDoc_("students", S.id, { id:S.id, name:S.name, role:"student", program:S.program||"", yearLevel:S.yearLevel||"", section:S.section||"", xp:0, level:1, streak:0, lastLogin:null, lastClaimDate:null, achievements:[], surveysAnswered:0, tasksCompleted:0 });
  } catch(e) { console.warn("offline:", e); }
}

function renderProfile() {
  const lvl  = getLevel(S.xp||0);
  const prog = getXPProgress(S.xp||0);
  const rank = getRankTitle(lvl);
  const init = (S.name||"?")[0].toUpperCase();
  setText("heroName",  S.name||"Unknown Hero");
  setText("heroProg",  `${S.program||"—"} · ${S.section||"—"} · Year ${S.yearLevel||"—"}`);
  setHTML("heroRank",  `<span style="color:${rank.color}">${rank.label} · Level ${lvl}</span>`);
  setText("statLevel", lvl);
  setText("statXP",    S.xp||0);
  setText("statStreak",S.streak||0);
  setText("xpProg",   `${prog} / 100 XP`);
  setText("xpNext",   `${100-prog} to Lv.${lvl+1}`);
  document.getElementById("xpFill").style.width = prog + "%";
  document.getElementById("heroAvatar").textContent   = init;
  document.getElementById("headerAvatar").textContent = init;
  setText("qsBadges",  (S.achievements||[]).length);
  setText("qsSurveys", S.surveysAnswered||0);
}

function getOrbTier(streak) {
  return [...ORB_TIERS].reverse().find(t => streak >= t.min) || ORB_TIERS[0];
}

function renderOrb() {
  const claimed = S.lastClaimDate === todayStr();
  const streak  = S.streak||0;
  const tier    = getOrbTier(streak);
  const pos     = streak===0 ? 0 : (streak%7);
  const todayXP = STREAK_XP[Math.min(pos===0&&streak>0 ? 6 : pos, 6)];

  ["mainOrb","modalOrb"].forEach(oid => {
    const orb = document.getElementById(oid);
    if (!orb) return;
    orb.className = "orb" + (oid==="modalOrb"?" "+"":""  );
    if (oid==="modalOrb") orb.style.cssText="width:90px;height:90px";
    ["tier-purple","tier-gold","tier-red","ready","claimed"].forEach(c=>orb.classList.remove(c));
    if (tier.cls) orb.classList.add(tier.cls);
    orb.classList.add(claimed ? "claimed" : "ready");
  });

  setText("orbIcon",  tier.icon);
  setText("mOrbIcon", tier.icon);
  setText("orbStreakNum", streak);
  setText("mStreakNum",   streak);

  if (claimed) {
    setText("orbHint",   "Already claimed today. Come back tomorrow!");
    setText("mStreakMsg","You've already claimed today's reward. See you tomorrow!");
    setText("mXPLabel",  "✓ Claimed today");
  } else {
    setText("orbHint",   `Tap the orb to claim +${todayXP} XP!`);
    setText("mXPLabel",  `+${todayXP} XP today`);
    setText("mStreakMsg", streak===0 ? "Start your streak! Log in every day for bigger rewards." : `You're on a ${streak}-day streak! Keep it going!`);
  }
}

function renderStreakTrack() {
  const streak  = S.streak||0;
  const claimed = S.lastClaimDate===todayStr();
  const pos     = streak===0 ? 0 : ((streak-1)%7);
  const track   = document.getElementById("streakTrack");
  if (!track) return;
  track.innerHTML = DAY_LABELS.map((lbl,i) => {
    let state = i < pos ? "done" : i === pos && (claimed||streak===0) ? (claimed?"done":"active") : i===pos ? "active" : "locked";
    if (streak===0 && i===0) state="active";
    return `<div class="sday ${state}">
      <span class="sday-num">${lbl}</span>
      <span class="sday-ico">${state==="done"?"✅":DAY_ICONS[i]}</span>
      <span class="sday-xp">+${STREAK_XP[i]} XP</span>
    </div>`;
  }).join("");
}

window.claimReward = async function() {
  if (S.lastClaimDate===todayStr()) { toast("Already claimed today!","warn"); return; }
  const streak  = S.streak||0;
  const pos     = streak===0 ? 0 : (streak%7);
  const xpGain  = STREAK_XP[Math.min(pos===0&&streak>0?6:pos,6)];
  const prevLvl = getLevel(S.xp||0);
  const yest    = new Date(); yest.setDate(yest.getDate()-1);
  const wasYest = S.lastLogin===yest.toDateString();
  const newStreak= (streak>0&&wasYest) ? streak+1 : 1;
  const newXP    = (S.xp||0)+xpGain;
  const newLvl   = getLevel(newXP);
  const changes  = { xp:newXP, level:newLvl, streak:newStreak, lastLogin:todayStr(), lastClaimDate:todayStr() };
  try { await updateDoc(doc(db,"students",S.id), changes); } catch{}
  Object.assign(S, changes); saveSession(S);
  try { await addDoc_("students/"+S.id+"/xpLog", { amount:xpGain, reason:"daily-claim" }); } catch{}
  renderProfile(); renderOrb(); renderStreakTrack();
  spawnBurst(`+${xpGain} XP`);
  toast(`+${xpGain} XP · ${newStreak}-day streak 🔥`, "xp");
  if (newStreak>0 && newStreak%7===0) toast("🎉 7-day cycle complete! Streak continues!","gold",4000);
  if (newLvl>prevLvl) setTimeout(()=>showLevelUp(newLvl),700);
  const newAch = await checkAchievements(S);
  newAch.forEach((id,i)=>setTimeout(()=>showAchPop(id),(i+1)*1200));
  closeStreakModal();
};

async function loadQuests() {
  const tasks = await queryDocs("tasks",[["assignedTo","array-contains",S.id]],[["dueDate","asc"]],10);
  const pending = tasks.filter(t=>!(t.submittedBy||[]).includes(S.id));
  setText("qsPending", pending.length);
  const feed = document.getElementById("questFeed");
  if (!tasks.length) { feed.innerHTML=`<div class="empty"><div class="ei">⚔️</div><p>No quests yet. Your teacher will assign some soon.</p></div>`; return; }
  const icons = {task:"📋",quiz:"❓",lecture:"📖"};
  feed.innerHTML = tasks.slice(0,4).map(t => {
    const due  = t.dueDate?.seconds ? new Date(t.dueDate.seconds*1000) : new Date();
    const done = (t.submittedBy||[]).includes(S.id);
    const over = !done && due<new Date();
    return `<div class="quest-card ${done?"done":over?"overdue":""}" onclick="location.href='quest-detail.html?id=${t.id}'">
      <div class="quest-icon">${icons[t.type]||"📋"}</div>
      <div class="quest-body">
        <div class="quest-title">${t.title||"Untitled"}</div>
        <div class="quest-meta">${due.toLocaleDateString()} · ${t.type||"task"}</div>
      </div>
      <div class="quest-xp">+${t.maxXP||0} XP</div>
    </div>`;
  }).join("");
}

async function loadClasses() {
  const classes = await queryDocs("classes",[["students","array-contains",S.id]],[],20);
  const grid = document.getElementById("classGrid");
  if (!classes.length) return;
  grid.innerHTML = classes.map(c=>`
    <div class="class-card" onclick="location.href='class-view.html?id=${c.id}'">
      <div class="class-icon">📘</div>
      <div class="class-name">${c.name||"Class"}</div>
      <div class="class-teacher">👤 ${c.teacherName||"—"}</div>
      <div class="mt-4">${progTag(c.program||"")}</div>
    </div>`).join("");
}

async function loadSurveys() {
  const surveys = await queryDocs("surveys",[["active","==",true]],[["createdAt","desc"]],3);
  const el = document.getElementById("surveyPreview");
  if (!surveys.length) return;
  el.innerHTML = surveys.map(sv=>{
    const done=(sv.answeredBy||[]).includes(S.id);
    return `<div class="survey-card">
      <div style="font-size:24px">📋</div>
      <div style="flex:1;min-width:0">
        <div class="font-display" style="font-size:13px;color:var(--text-2)">${sv.title||"Survey"}</div>
        <div class="text-muted mt-4">By ${sv.creatorName||"—"} · +${sv.xpReward||10} XP</div>
      </div>
      ${done?`<span class="badge b-green">✓</span>`:`<button class="btn btn-primary btn-sm" onclick="answerSurvey('${sv.id}','${sv.formLink||"#"}')">Answer</button>`}
    </div>`;
  }).join("");
}

window.answerSurvey = async function(id, link) {
  try {
    await updateDoc(doc(db,"surveys",id), { answeredBy: arrayUnion(S.id) });
    await updateDoc(doc(db,"students",S.id), { surveysAnswered: increment(1), xp: increment(10) });
    S.surveysAnswered=(S.surveysAnswered||0)+1; S.xp=(S.xp||0)+10; saveSession(S);
    toast("+10 XP · Survey recorded! 📋","xp");
    window.open(link,"_blank");
    loadSurveys(); renderProfile();
  } catch { toast("Error recording survey","error"); }
};

async function loadVault() {
  const courses = await queryDocs("courses",[["featured","==",true]],[],4);
  const el = document.getElementById("vaultGrid");
  if (!courses.length) return;
  el.innerHTML = courses.map(c=>`
    <a class="vault-card" href="${c.url||"#"}" target="_blank" rel="noopener">
      <div class="vault-icon">📖</div>
      <div style="flex:1;min-width:0">
        <div class="font-display" style="font-size:13px;color:var(--blue-200)">${c.title||"Course"}</div>
        <div class="text-muted mt-4">${c.provider||"External"}</div>
        <div class="text-muted" style="font-size:11px;margin-top:2px">${c.description||""}</div>
      </div>
    </a>`).join("");
}

async function loadAnnouncements() {
  const anns = await queryDocs("announcements",[["classId","==",null]],[["createdAt","desc"]],5);
  const el = document.getElementById("announcements");
  if (!anns.length) return;
  el.innerHTML = anns.map(a=>`
    <div class="card card-body" style="margin-bottom:8px">
      <div class="flex items-center justify-between mb-8">
        <div class="font-display" style="font-size:13px;color:var(--blue-200)">${a.title||"Announcement"}</div>
        ${a.pinned?`<span class="badge b-gold">📌 Pinned</span>`:""}
      </div>
      <p style="font-size:13px;color:var(--text-2);line-height:1.55">${a.body||""}</p>
      <div class="text-muted mt-8">${a.authorRole||"admin"}</div>
    </div>`).join("");
}

async function loadNotifications() {
  const notifs = await queryDocs("notifications",[["userId","==",S.id],["read","==",false]],[["createdAt","desc"]],20);
  const dot=document.getElementById("notifDot"), drop=document.getElementById("notifDrop");
  notifs.length ? dot.classList.remove("hidden") : dot.classList.add("hidden");
  const icons={task:"📋",grade:"⭐",achievement:"🏅",announcement:"📣"};
  drop.innerHTML = notifs.length
    ? notifs.map(n=>`<div class="notif-item unread" onclick="markNotif('${n.id}')"><div style="font-size:18px">${icons[n.type]||"💬"}</div><div><div class="notif-msg">${n.message||""}</div></div></div>`).join("")
    : `<div class="empty" style="padding:24px"><p>No new notifications</p></div>`;
}

window.markNotif = async function(id) {
  try { await updateDoc(doc(db,"notifications",id),{read:true}); loadNotifications(); } catch{}
};
window.toggleNotif = function() { document.getElementById("notifDrop").classList.toggle("hidden"); };
document.addEventListener("click", e=>{
  if (!document.getElementById("notifBtn")?.contains(e.target)) document.getElementById("notifDrop")?.classList.add("hidden");
});

async function updateDeptRank() {
  try {
    const all  = await queryDocs("students",[],[["xp","desc"]],200);
    const rank = all.findIndex(s=>s.id===S.id)+1;
    setText("statRank", rank>0?`#${rank}`:"—");
    if (rank>0&&rank<=10) { S.bestRank=Math.min(S.bestRank||999,rank); saveSession(S); }
  } catch{}
}

window.openStreakModal  = ()=>document.getElementById("streakOverlay").classList.add("open");
window.closeStreakModal = ()=>document.getElementById("streakOverlay").classList.remove("open");
document.getElementById("streakOverlay")?.addEventListener("click",e=>{ if(e.target.id==="streakOverlay") closeStreakModal(); });

function showLevelUp(lvl) {
  const rank=getRankTitle(lvl);
  setText("lvlupNum",lvl); setText("lvlupTitle",rank.label);
  document.getElementById("lvlupOverlay").classList.remove("hidden");
}
function showAchPop(id) {
  const a=ACHIEVEMENTS[id]; if(!a) return;
  const pop=document.createElement("div");
  pop.className="ach-pop";
  pop.innerHTML=`<div class="ach-pop-ico">${a.icon}</div><div class="ach-pop-text"><strong>Achievement Unlocked!</strong><span>${a.title} — ${a.desc}</span></div>`;
  document.body.appendChild(pop);
  setTimeout(()=>{ pop.style.opacity="0"; pop.style.transform="translateX(-50%) translateY(20px)"; pop.style.transition=".4s"; setTimeout(()=>pop.remove(),450); },4500);
}
function spawnBurst(txt) {
  const el=document.createElement("div"); el.className="xp-burst"; el.textContent=txt; el.style.top="45%";
  document.body.appendChild(el); setTimeout(()=>el.remove(),1500);
}
