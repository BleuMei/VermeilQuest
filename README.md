# Vermeil Quest — ECT Academy Interface
## Complete File List

### Core Files
| File | Purpose |
|------|---------|
| `firebase.js` | Central Firebase utility — import from here only |
| `styles.css` | Global design system — all pages use this |

### Authentication
| File | Purpose |
|------|---------|
| `index.html` | Login page — routes to correct portal by role |

### Student Portal
| File | Purpose |
|------|---------|
| `dashboard.html` | Main student home — orb, XP, quests, classes |
| `dashboard.js` | Dashboard logic — streak, XP, Firebase sync |
| `quests.html` | All assigned tasks and quizzes |
| `quest-detail.html` | Individual quest view + submission |
| `leaderboard.html` | Rankings — dept / program / year / section |
| `surveys.html` | Browse and create research surveys |
| `profile.html` | Student profile — badges, XP log, classes |
| `settings.html` | Password change, notification preferences |
| `class-view.html` | Student view of a single class |
| `onboarding.html` | First-time walkthrough (5 steps) |

### Teacher Portal
| File | Purpose |
|------|---------|
| `teacher-portal.html` | Teacher hub — overview, roster, tasks, grading |
| `teacher-class.html` | Detailed single-class management |

### Admin Portal
| File | Purpose |
|------|---------|
| `admin-portal.html` | Full system management — users, analytics, audit |

---

## Firebase Collections Required

Seed these manually in Firebase Console before first use:

### `admins` (1 document)
```
id: "ADMIN-001"
name: "Your Name"
role: "admin"
password: "yourpassword"
```

### `students` (seed 10–15 for demo)
```
id: "2024-00001"        ← document ID
name: "Student Name"
role: "student"
password: "2024-00001"  ← defaults to ID
program: "IT"           ← IT / CS / CoE / ECE
yearLevel: 2
section: "IT-2A"
email: "student@school.edu"
xp: 0
level: 1
streak: 0
lastLogin: null
lastClaimDate: null
achievements: []
surveysAnswered: 0
tasksCompleted: 0
```

### `teachers` (seed 2–3 for demo)
```
id: "T-2024-001"        ← document ID
name: "Teacher Name"
role: "teacher"
password: "T-2024-001"
email: "teacher@school.edu"
classes: []
```

### `achievements` (seed all 11)
Create these document IDs with the following fields:
- `streak-7`  → icon:🔥 title:Faithful desc:7-day streak rarity:common hidden:false
- `streak-30` → icon:💫 title:Devoted desc:30-day streak rarity:rare hidden:false
- `streak-100`→ icon:⭐ title:Legendary Flame desc:100-day streak rarity:legendary hidden:true
- `survey-10` → icon:📋 title:Voice of the People desc:Answer 10 surveys rarity:common hidden:false
- `survey-50` → icon:🔬 title:Researcher desc:Answer 50 surveys rarity:rare hidden:false
- `tasks-10`  → icon:⚔️ title:Diligent desc:Complete 10 tasks rarity:common hidden:false
- `perfect-score` → icon:💎 title:Perfect Cast desc:Score 100% on a quiz rarity:rare hidden:false
- `rank-top1` → icon:👑 title:Gold Crest desc:Reach #1 on any board rarity:legendary hidden:false
- `rank-top3` → icon:🥈 title:Silver Crest desc:Reach top 3 rarity:rare hidden:false
- `rank-top10`→ icon:🏅 title:Bronze Crest desc:Reach top 10 rarity:common hidden:false
- `night-owl` → icon:🦉 title:Night Owl desc:Login between midnight and 1am rarity:legendary hidden:true

### Firestore Security Rules
Set these in Firebase Console → Firestore → Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

## Login Flow
1. User enters ID + password on `index.html`
2. System checks `admins` → `teachers` → `students` collections
3. Redirects to correct portal based on role
4. Default password = ID number (changeable in Settings)

## XP System
- Every 100 XP = 1 level
- Daily streak rewards: 10 / 15 / 20 / 25 / 30 / 40 / 60 XP (Day 1–7)
- After Day 7: cycle resets to Day 1 reward, streak counter keeps climbing
- Streak breaks if you miss a day

## Orb Tiers
- 🔮 Blue (streak 0–7) — default
- 💜 Purple (streak 8–29)
- ✨ Gold (streak 30–99)
- 🔴 Red-flame (streak 100+)

## Deployment
Upload all files to any static host (Vercel, Netlify, GitHub Pages).
No build step needed — pure HTML/CSS/JS with Firebase CDN imports.
