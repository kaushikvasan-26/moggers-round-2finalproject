/* ─────────────────────────────────────────────────────
   RoomRadar – SRM IST Free Room Finder  |  app.js
   ───────────────────────────────────────────────────── */

/* ══════════════════════════════════════════
   1. ROOM DEFINITIONS  (floor → rooms)
   ══════════════════════════════════════════ */
const ROOMS = [
  // Floor 1
  { id:"IST-108",  name:"IST 108",  floor:1, type:"Lab",       ac:false, capacity:40 },
  // Floor 2
  { id:"IST-201",  name:"IST 201",  floor:2, type:"Classroom", ac:false, capacity:60 },
  { id:"IST-211",  name:"IST 211",  floor:2, type:"Classroom", ac:true,  capacity:60 },
  { id:"IST-225",  name:"IST 225",  floor:2, type:"Classroom", ac:true,  capacity:60 },
  { id:"IST-227",  name:"IST 227",  floor:2, type:"Classroom", ac:true,  capacity:60 },
  // Floor 3
  { id:"IST-309",  name:"IST 309",  floor:3, type:"Lab",       ac:false, capacity:40 },
  // Floor 4
  { id:"IST-411",  name:"IST 411",  floor:4, type:"Classroom", ac:true,  capacity:60 },
  { id:"IST-416",  name:"IST 416",  floor:4, type:"Classroom", ac:true,  capacity:60 },
  // Floor 5
  { id:"IST-502",  name:"IST 502",  floor:5, type:"Classroom", ac:true,  capacity:60 },
  { id:"IST-510",  name:"IST 510",  floor:5, type:"Seminar",   ac:true,  capacity:80 },
  { id:"IST-518",  name:"IST 518",  floor:5, type:"Classroom", ac:true,  capacity:60 },
  { id:"IST-519",  name:"IST 519",  floor:5, type:"Classroom", ac:true,  capacity:60 },
  // Floor 6
  { id:"IST-602",  name:"IST 602",  floor:6, type:"Classroom", ac:true,  capacity:80 },
  { id:"IST-609",  name:"IST 609",  floor:6, type:"Classroom", ac:false, capacity:50 },
  { id:"IST-617",  name:"IST 617",  floor:6, type:"Lab",       ac:false, capacity:40 },
  { id:"IST-618",  name:"IST 618",  floor:6, type:"Lab",       ac:false, capacity:40 },
  { id:"IST-625",  name:"IST 625",  floor:6, type:"Seminar",   ac:true,  capacity:60 },
  { id:"IST-626",  name:"IST 626",  floor:6, type:"Classroom", ac:false, capacity:50 },
  // Floor 7
  { id:"IST-702",  name:"IST 702",  floor:7, type:"Classroom", ac:true,  capacity:60 },
  { id:"IST-710",  name:"IST 710",  floor:7, type:"Seminar",   ac:true,  capacity:80 },
  // G Block
  { id:"G-401",    name:"G-401",    floor:"G", type:"Lab",     ac:false, capacity:40 },
  { id:"G-602",    name:"G-602",    floor:"G", type:"Seminar",  ac:true,  capacity:60 },
  { id:"G-625",    name:"G-625",    floor:"G", type:"CDC Hall", ac:true,  capacity:100 },
  // H Block
  { id:"H-TB-106", name:"H-TB-106", floor:"H", type:"Lab",     ac:false, capacity:40 },
  // Workshop
  { id:"IST-020",  name:"IST 20/21",floor:"W", type:"Workshop", ac:false, capacity:60 },
];

/* ══════════════════════════════════════════
   2. PERIOD TIME DEFINITIONS
   ══════════════════════════════════════════ */
// Each entry: { start, end } in minutes from midnight
function t(h,m){ return h*60+m; }

// Standard 1st Year / early batch periods (09:00–17:05)
const P_STD = [
  { label:"P1",    start:t(9,0),   end:t(9,50)  },
  { label:"P2",    start:t(9,55),  end:t(10,45) },
  { label:"P3",    start:t(10,50), end:t(11,40) },
  { label:"P4",    start:t(11,45), end:t(12,35) },
  { label:"Lunch", start:t(12,35), end:t(13,30) },
  { label:"P56",   start:t(13,30), end:t(15,15) },
  { label:"P7",    start:t(15,20), end:t(16,10) },
  { label:"P8",    start:t(16,15), end:t(17,5)  },
];

// FN batch (Forenoon-based shifts with tea break)
const P_FN = [
  { label:"P1",    start:t(9,0),   end:t(9,50)  },
  { label:"P2",    start:t(9,50),  end:t(10,40) },
  { label:"Break", start:t(10,40), end:t(10,50) },
  { label:"P3",    start:t(10,50), end:t(11,40) },
  { label:"P4",    start:t(11,40), end:t(12,30) },
  { label:"P5",    start:t(12,30), end:t(13,20) },
  { label:"Lunch", start:t(13,20), end:t(14,10) },
  { label:"P67",   start:t(14,10), end:t(16,0)  },
  { label:"P89",   start:t(16,0),  end:t(16,50) },
];

// AN batch (Afternoon-heavy)
const P_AN = [
  { label:"P12",   start:t(9,0),   end:t(10,40) },
  { label:"P34",   start:t(10,50), end:t(12,30) },
  { label:"P5",    start:t(12,30), end:t(13,20) },
  { label:"Lunch", start:t(13,20), end:t(14,10) },
  { label:"P6",    start:t(14,10), end:t(15,0)  },
  { label:"Break", start:t(15,0),  end:t(15,10) },
  { label:"P7",    start:t(15,10), end:t(16,0)  },
  { label:"P89",   start:t(16,0),  end:t(16,50) },
];

/* ══════════════════════════════════════════
   3. TIMETABLE OCCUPANCY DATA
   Each entry: roomId, days (0=Mon…4=Fri),
   slotStart (mins), slotEnd (mins), class label
   ══════════════════════════════════════════ */

// Helper to expand multiple days
function occ(roomId, days, start, end, label){
  return days.map(d => ({ roomId, day:d, start, end, label }));
}
const D = { Mon:0, Tue:1, Wed:2, Thu:3, Fri:4 };
const ALL = [0,1,2,3,4];
const MTWThF = ALL;

const OCCUPANCY = [
  /* ── IST 602 ── I ECE-A (Mon-Fri, mostly P1-P4) */
  ...occ("IST-602",[D.Mon],  t(9,0),  t(9,50),  "I ECE-A (E)"),
  ...occ("IST-602",[D.Mon],  t(9,55), t(10,45), "I ECE-A (E)"),
  ...occ("IST-602",[D.Mon],  t(10,50),t(11,40), "I ECE-A (B)"),
  ...occ("IST-602",[D.Mon],  t(11,45),t(12,35), "I ECE-A (A)"),
  ...occ("IST-602",[D.Tue],  t(9,0),  t(9,50),  "I ECE-A (C)"),
  ...occ("IST-602",[D.Tue],  t(9,55), t(10,45), "I ECE-A (B)"),
  ...occ("IST-602",[D.Tue],  t(10,50),t(11,40), "I ECE-A (A)"),
  ...occ("IST-602",[D.Tue],  t(11,45),t(12,35), "I ECE-A (D)"),
  ...occ("IST-602",[D.Wed],  t(9,0),  t(9,50),  "I ECE-A (B)"),
  ...occ("IST-602",[D.Wed],  t(9,55), t(10,45), "I ECE-A (E)"),
  ...occ("IST-602",[D.Wed],  t(10,50),t(11,40), "I ECE-A (D)"),
  ...occ("IST-602",[D.Thu],  t(9,55), t(10,45), "I ECE-A German"),
  ...occ("IST-602",[D.Thu],  t(11,45),t(12,35), "I ECE-A (A)"),
  ...occ("IST-602",[D.Fri],  t(9,0),  t(9,50),  "I ECE-A (D)"),
  ...occ("IST-602",[D.Fri],  t(9,55), t(10,45), "I ECE-A (A)"),
  ...occ("IST-602",[D.Fri],  t(10,50),t(11,40), "I ECE-A (C)"),
  ...occ("IST-602",[D.Fri],  t(11,45),t(12,35), "I ECE-A (B)"),
  ...occ("IST-602",[D.Fri],  t(13,30),t(14,20), "I ECE-A (F)"),
  // I ECE-B & EEE also uses IST-602
  ...occ("IST-602",[D.Mon],  t(14,30),t(15,15), "I ECE-B (E)"),
  ...occ("IST-602",[D.Mon],  t(15,20),t(16,10), "I ECE-B (E)"),
  ...occ("IST-602",[D.Mon],  t(16,15),t(17,5),  "I ECE-B (A)"),
  ...occ("IST-602",[D.Tue],  t(13,30),t(14,20), "I ECE-B (C)"),
  ...occ("IST-602",[D.Tue],  t(14,25),t(15,15), "I ECE-B (B)"),
  ...occ("IST-602",[D.Tue],  t(15,20),t(16,10), "I ECE-B (A)"),
  ...occ("IST-602",[D.Wed],  t(13,30),t(14,20), "I ECE-B (B)"),
  ...occ("IST-602",[D.Wed],  t(14,25),t(15,15), "I ECE-B (E)"),
  ...occ("IST-602",[D.Wed],  t(15,20),t(16,10), "I ECE-B (D)"),
  ...occ("IST-602",[D.Thu],  t(15,20),t(16,10), "I ECE-B German"),
  ...occ("IST-602",[D.Thu],  t(16,15),t(17,5),  "I ECE-B (D)"),
  ...occ("IST-602",[D.Fri],  t(16,15),t(17,5),  "I ECE-B (A)"),
  // II BME FN uses IST-602
  ...occ("IST-602",[D.Mon],  t(9,0),  t(9,50),  "II BME (E)"),
  ...occ("IST-602",[D.Mon],  t(9,50), t(10,40), "II BME (C)"),

  /* ── IST 502 – I ECE-DS ── */
  ...occ("IST-502",[D.Mon],  t(13,30),t(14,20), "I ECE-DS (E)"),
  ...occ("IST-502",[D.Mon],  t(14,25),t(15,15), "I ECE-DS (E)"),
  ...occ("IST-502",[D.Mon],  t(15,20),t(16,10), "I ECE-DS (B)"),
  ...occ("IST-502",[D.Mon],  t(16,15),t(17,5),  "I ECE-DS (A)"),
  ...occ("IST-502",[D.Tue],  t(13,30),t(14,20), "I ECE-DS (C)"),
  ...occ("IST-502",[D.Tue],  t(14,25),t(15,15), "I ECE-DS (B)"),
  ...occ("IST-502",[D.Tue],  t(15,20),t(16,10), "I ECE-DS (A)"),
  ...occ("IST-502",[D.Tue],  t(16,15),t(17,5),  "I ECE-DS (D)"),
  ...occ("IST-502",[D.Wed],  t(14,25),t(15,15), "I ECE-DS (B)"),
  ...occ("IST-502",[D.Wed],  t(15,20),t(16,10), "I ECE-DS (E)"),
  ...occ("IST-502",[D.Wed],  t(16,15),t(17,5),  "I ECE-DS (D)"),
  ...occ("IST-502",[D.Thu],  t(13,30),t(14,20), "I ECE-DS German"),
  ...occ("IST-502",[D.Thu],  t(15,20),t(16,10), "I ECE-DS (C)"),
  ...occ("IST-502",[D.Thu],  t(16,15),t(17,5),  "I ECE-DS (B)"),

  /* ── IST 702 – I Biotech-B & Biomed ── */
  ...occ("IST-702",[D.Mon],  t(13,30),t(14,20), "I Biotech (E)"),
  ...occ("IST-702",[D.Mon],  t(14,25),t(15,15), "I Biotech (E)"),
  ...occ("IST-702",[D.Mon],  t(15,20),t(16,10), "I Biotech (A)"),
  ...occ("IST-702",[D.Mon],  t(16,15),t(17,5),  "I Biotech (B)"),
  ...occ("IST-702",[D.Tue],  t(14,25),t(15,15), "I Biotech (B)"),
  ...occ("IST-702",[D.Tue],  t(15,20),t(16,10), "I Biotech (A)"),
  ...occ("IST-702",[D.Tue],  t(16,15),t(17,5),  "I Biotech (D)"),
  ...occ("IST-702",[D.Wed],  t(13,30),t(14,20), "I Biotech (D)"),
  ...occ("IST-702",[D.Wed],  t(14,25),t(15,15), "I Biotech (B)"),
  ...occ("IST-702",[D.Wed],  t(15,20),t(16,10), "I Biotech (E)"),
  ...occ("IST-702",[D.Wed],  t(16,15),t(17,5),  "I Biotech (D)"),
  ...occ("IST-702",[D.Thu],  t(13,30),t(14,20), "I Biotech (B)"),
  ...occ("IST-702",[D.Fri],  t(9,0),  t(9,50),  "I Biotech (A)"),
  ...occ("IST-702",[D.Fri],  t(9,55), t(10,45), "I Biotech (F)"),
  ...occ("IST-702",[D.Fri],  t(13,30),t(14,20), "I Biotech Japanese"),
  ...occ("IST-702",[D.Thu],  t(15,20),t(16,10), "I Biotech Japanese"),

  /* ── IST 416 – II Year DS-A (FN) ── */
  ...occ("IST-416",[D.Mon],  t(9,0),  t(9,50),  "II DS-A (E)"),
  ...occ("IST-416",[D.Mon],  t(9,50), t(10,40), "II DS-A (A)"),
  ...occ("IST-416",[D.Mon],  t(10,50),t(11,40), "II DS-A (I)"),
  ...occ("IST-416",[D.Tue],  t(9,0),  t(9,50),  "II DS-A (C)"),
  ...occ("IST-416",[D.Tue],  t(9,50), t(10,40), "II DS-A (A)"),
  ...occ("IST-416",[D.Tue],  t(10,50),t(11,40), "II DS-A (E)"),
  ...occ("IST-416",[D.Tue],  t(11,40),t(12,30), "II DS-A (D)"),
  ...occ("IST-416",[D.Wed],  t(9,0),  t(9,50),  "II DS-A (A)"),
  ...occ("IST-416",[D.Wed],  t(9,50), t(10,40), "II DS-A (B)"),
  ...occ("IST-416",[D.Wed],  t(10,50),t(11,40), "II DS-A (C)"),
  ...occ("IST-416",[D.Wed],  t(11,40),t(12,30), "II DS-A (D)"),
  ...occ("IST-416",[D.Thu],  t(9,0),  t(9,50),  "II DS-A (B)"),
  ...occ("IST-416",[D.Thu],  t(9,50), t(10,40), "II DS-A (C)"),
  ...occ("IST-416",[D.Thu],  t(10,50),t(11,40), "II DS-A (A)"),
  ...occ("IST-416",[D.Thu],  t(11,40),t(12,30), "II DS-A (F)"),
  ...occ("IST-416",[D.Fri],  t(9,0),  t(9,50),  "II DS-A (D)"),
  ...occ("IST-416",[D.Fri],  t(9,50), t(10,40), "II DS-A (B)"),
  ...occ("IST-416",[D.Fri],  t(10,50),t(11,40), "II DS-A (E)"),
  ...occ("IST-416",[D.Fri],  t(11,40),t(12,30), "II DS-A (C)"),

  /* ── IST 411 – II Year DS-B (AN) ── */
  ...occ("IST-411",[D.Mon],  t(10,50),t(12,30), "II DS-B (D)"),
  ...occ("IST-411",[D.Mon],  t(12,30),t(13,20), "II DS-B (B)"),
  ...occ("IST-411",[D.Mon],  t(14,10),t(15,0),  "II DS-B (C)"),
  ...occ("IST-411",[D.Mon],  t(15,10),t(16,0),  "II DS-B (I)"),
  ...occ("IST-411",[D.Tue],  t(10,50),t(12,30), "II DS-B (C)"),
  ...occ("IST-411",[D.Tue],  t(12,30),t(13,20), "II DS-B (D)"),
  ...occ("IST-411",[D.Tue],  t(14,10),t(15,0),  "II DS-B (E)"),
  ...occ("IST-411",[D.Tue],  t(15,10),t(16,0),  "II DS-B (A)"),
  ...occ("IST-411",[D.Wed],  t(14,10),t(15,0),  "II DS-B (E)"),
  ...occ("IST-411",[D.Wed],  t(15,10),t(16,0),  "II DS-B (A)"),
  ...occ("IST-411",[D.Wed],  t(16,0), t(16,50), "II DS-B (D)"),
  ...occ("IST-411",[D.Thu],  t(12,30),t(13,20), "II DS-B (A)"),
  ...occ("IST-411",[D.Thu],  t(14,10),t(15,0),  "II DS-B (C)"),
  ...occ("IST-411",[D.Thu],  t(15,10),t(16,0),  "II DS-B (B)"),
  ...occ("IST-411",[D.Thu],  t(16,0), t(16,50), "II DS-B (E)"),
  ...occ("IST-411",[D.Fri],  t(12,30),t(13,20), "II DS-B (F)"),
  ...occ("IST-411",[D.Fri],  t(14,10),t(15,0),  "II DS-B (A)"),
  ...occ("IST-411",[D.Fri],  t(15,10),t(16,0),  "II DS-B (B)"),
  ...occ("IST-411",[D.Fri],  t(16,0), t(16,50), "II DS-B (C)"),

  /* ── IST 211 – III Year BME (AN) ── */
  ...occ("IST-211",[D.Mon],  t(14,10),t(15,0),  "III BME (E)"),
  ...occ("IST-211",[D.Mon],  t(15,10),t(16,0),  "III BME (B)"),
  ...occ("IST-211",[D.Mon],  t(16,0), t(16,50), "III BME (H)"),
  ...occ("IST-211",[D.Tue],  t(14,10),t(15,0),  "III BME (C)"),
  ...occ("IST-211",[D.Tue],  t(15,10),t(16,0),  "III BME (D)"),
  ...occ("IST-211",[D.Tue],  t(16,0), t(16,50), "III BME (A)"),
  ...occ("IST-211",[D.Wed],  t(14,10),t(15,0),  "III BME (C)"),
  ...occ("IST-211",[D.Wed],  t(15,10),t(16,0),  "III BME (A)"),
  ...occ("IST-211",[D.Wed],  t(16,0), t(16,50), "III BME (F)"),
  ...occ("IST-211",[D.Thu],  t(14,10),t(15,0),  "III BME (A)"),
  ...occ("IST-211",[D.Thu],  t(15,10),t(16,0),  "III BME (C)"),
  ...occ("IST-211",[D.Thu],  t(16,0), t(16,50), "III BME (E)"),
  ...occ("IST-211",[D.Fri],  t(14,10),t(15,0),  "III BME (F)"),
  ...occ("IST-211",[D.Fri],  t(15,10),t(16,0),  "III BME (A)"),
  ...occ("IST-211",[D.Fri],  t(16,0), t(16,50), "III BME (D)"),

  /* ── IST 518 – III ECE-A (FN) & III ECE-B (AN) ── */
  // FN
  ...occ("IST-518",[D.Mon],  t(9,0),  t(9,50),  "III ECE-A (E)"),
  ...occ("IST-518",[D.Mon],  t(9,50), t(10,40), "III ECE-A (B)"),
  ...occ("IST-518",[D.Mon],  t(10,50),t(11,40), "III ECE-A (B)"),
  ...occ("IST-518",[D.Mon],  t(11,40),t(12,30), "III ECE-A (A)"),
  ...occ("IST-518",[D.Tue],  t(9,0),  t(9,50),  "III ECE-A (H)"),
  ...occ("IST-518",[D.Tue],  t(9,50), t(10,40), "III ECE-A (D)"),
  ...occ("IST-518",[D.Tue],  t(10,50),t(11,40), "III ECE-A (B)"),
  ...occ("IST-518",[D.Wed],  t(9,0),  t(9,50),  "III ECE-A (C)"),
  ...occ("IST-518",[D.Wed],  t(9,50), t(10,40), "III ECE-A (A)"),
  ...occ("IST-518",[D.Wed],  t(10,50),t(11,40), "III ECE-A (D)"),
  ...occ("IST-518",[D.Wed],  t(11,40),t(12,30), "III ECE-A (F)"),
  ...occ("IST-518",[D.Thu],  t(9,0),  t(9,50),  "III ECE-A (A)"),
  ...occ("IST-518",[D.Thu],  t(9,50), t(10,40), "III ECE-A (E)"),
  ...occ("IST-518",[D.Thu],  t(10,50),t(11,40), "III ECE-A (C)"),
  ...occ("IST-518",[D.Thu],  t(11,40),t(12,30), "III ECE-A (F)"),
  ...occ("IST-518",[D.Fri],  t(9,0),  t(9,50),  "III ECE-A (D)"),
  ...occ("IST-518",[D.Fri],  t(9,50), t(10,40), "III ECE-A (A)"),
  ...occ("IST-518",[D.Fri],  t(10,50),t(11,40), "III ECE-A (E)"),
  ...occ("IST-518",[D.Fri],  t(11,40),t(12,30), "III ECE-A (C)"),
  // AN
  ...occ("IST-518",[D.Mon],  t(14,10),t(15,0),  "III ECE-B (E)"),
  ...occ("IST-518",[D.Mon],  t(15,10),t(16,0),  "III ECE-B (B)"),
  ...occ("IST-518",[D.Mon],  t(16,0), t(16,50), "III ECE-B (A)"),
  ...occ("IST-518",[D.Tue],  t(14,10),t(15,0),  "III ECE-B (F)"),
  ...occ("IST-518",[D.Tue],  t(15,10),t(16,0),  "III ECE-B (B)"),
  ...occ("IST-518",[D.Tue],  t(16,0), t(16,50), "III ECE-B (D)"),
  ...occ("IST-518",[D.Wed],  t(15,10),t(16,0),  "III ECE-B (B)"),
  ...occ("IST-518",[D.Wed],  t(16,0), t(16,50), "III ECE-B (A)"),
  ...occ("IST-518",[D.Thu],  t(14,10),t(15,0),  "III ECE-B (A)"),
  ...occ("IST-518",[D.Thu],  t(15,10),t(16,0),  "III ECE-B (C)"),
  ...occ("IST-518",[D.Thu],  t(16,0), t(16,50), "III ECE-B (E)"),
  ...occ("IST-518",[D.Fri],  t(14,10),t(15,0),  "III ECE-B (C)"),
  ...occ("IST-518",[D.Fri],  t(15,10),t(16,0),  "III ECE-B (A)"),
  ...occ("IST-518",[D.Fri],  t(16,0), t(16,50), "III ECE-B (E)"),

  /* ── IST 519 – III ECE-DS (FN) ── */
  ...occ("IST-519",[D.Mon],  t(9,0),  t(9,50),  "III ECE-DS (E)"),
  ...occ("IST-519",[D.Mon],  t(9,50), t(10,40), "III ECE-DS (B)"),
  ...occ("IST-519",[D.Mon],  t(10,50),t(11,40), "III ECE-DS (C)"),
  ...occ("IST-519",[D.Mon],  t(11,40),t(12,30), "III ECE-DS (A)"),
  ...occ("IST-519",[D.Tue],  t(9,0),  t(9,50),  "III ECE-DS (C)"),
  ...occ("IST-519",[D.Tue],  t(9,50), t(10,40), "III ECE-DS (B)"),
  ...occ("IST-519",[D.Tue],  t(10,50),t(11,40), "III ECE-DS (D)"),
  ...occ("IST-519",[D.Tue],  t(11,40),t(12,30), "III ECE-DS (F)"),
  ...occ("IST-519",[D.Wed],  t(9,0),  t(9,50),  "III ECE-DS (H)"),
  ...occ("IST-519",[D.Wed],  t(9,50), t(10,40), "III ECE-DS (B)"),
  ...occ("IST-519",[D.Wed],  t(10,50),t(11,40), "III ECE-DS (A)"),
  ...occ("IST-519",[D.Wed],  t(11,40),t(12,30), "III ECE-DS (C)"),
  ...occ("IST-519",[D.Thu],  t(9,0),  t(9,50),  "III ECE-DS (A)"),
  ...occ("IST-519",[D.Thu],  t(9,50), t(10,40), "III ECE-DS (D)"),
  ...occ("IST-519",[D.Thu],  t(10,50),t(11,40), "III ECE-DS (E)"),
  ...occ("IST-519",[D.Thu],  t(11,40),t(12,30), "III ECE-DS (F)"),
  ...occ("IST-519",[D.Fri],  t(9,0),  t(9,50),  "III ECE-DS (D)"),
  ...occ("IST-519",[D.Fri],  t(9,50), t(10,40), "III ECE-DS (A)"),
  ...occ("IST-519",[D.Fri],  t(10,50),t(11,40), "III ECE-DS (E)"),

  /* ── IST 225 – IV ECE-A ── */
  ...occ("IST-225",[D.Mon],  t(9,0),  t(9,50),  "IV ECE-A (C)"),
  ...occ("IST-225",[D.Mon],  t(10,50),t(11,40), "IV ECE-A (A)"),
  ...occ("IST-225",[D.Mon],  t(11,40),t(12,30), "IV ECE-A (D)"),
  ...occ("IST-225",[D.Tue],  t(9,0),  t(9,50),  "IV ECE-A (C)"),
  ...occ("IST-225",[D.Tue],  t(9,50), t(10,40), "IV ECE-A (D)"),
  ...occ("IST-225",[D.Tue],  t(10,50),t(11,40), "IV ECE-A (B)"),
  ...occ("IST-225",[D.Tue],  t(11,40),t(12,30), "IV ECE-A (F)"),
  ...occ("IST-225",[D.Wed],  t(9,0),  t(9,50),  "IV ECE-A (B)"),
  ...occ("IST-225",[D.Wed],  t(10,50),t(11,40), "IV ECE-A (E)"),
  ...occ("IST-225",[D.Wed],  t(11,40),t(12,30), "IV ECE-A (F)"),
  ...occ("IST-225",[D.Thu],  t(9,50), t(10,40), "IV ECE-A (A)"),
  ...occ("IST-225",[D.Thu],  t(10,50),t(11,40), "IV ECE-A (E)"),
  ...occ("IST-225",[D.Thu],  t(11,40),t(12,30), "IV ECE-A (B)"),
  ...occ("IST-225",[D.Fri],  t(9,0),  t(9,50),  "IV ECE-A (C)"),
  ...occ("IST-225",[D.Fri],  t(9,50), t(10,40), "IV ECE-A (A)"),
  ...occ("IST-225",[D.Fri],  t(10,50),t(11,40), "IV ECE-A (D)"),
  ...occ("IST-225",[D.Fri],  t(11,40),t(12,30), "IV ECE-A (E)"),

  /* ── IST 227 – IV ECE-B ── */
  ...occ("IST-227",[D.Mon],  t(9,0),  t(9,50),  "IV ECE-B (C)"),
  ...occ("IST-227",[D.Mon],  t(9,50), t(10,40), "IV ECE-B (A)"),
  ...occ("IST-227",[D.Mon],  t(10,50),t(11,40), "IV ECE-B (E)"),
  ...occ("IST-227",[D.Mon],  t(11,40),t(12,30), "IV ECE-B (F)"),
  ...occ("IST-227",[D.Tue],  t(9,0),  t(9,50),  "IV ECE-B (C)"),
  ...occ("IST-227",[D.Tue],  t(9,50), t(10,40), "IV ECE-B (E)"),
  ...occ("IST-227",[D.Tue],  t(10,50),t(11,40), "IV ECE-B (F)"),
  ...occ("IST-227",[D.Tue],  t(11,40),t(12,30), "IV ECE-B (B)"),
  ...occ("IST-227",[D.Wed],  t(9,0),  t(9,50),  "IV ECE-B (C)"),
  ...occ("IST-227",[D.Wed],  t(9,50), t(10,40), "IV ECE-B (D)"),
  ...occ("IST-227",[D.Wed],  t(10,50),t(11,40), "IV ECE-B (A)"),
  ...occ("IST-227",[D.Wed],  t(11,40),t(12,30), "IV ECE-B (B)"),
  ...occ("IST-227",[D.Thu],  t(9,0),  t(9,50),  "IV ECE-B (D)"),
  ...occ("IST-227",[D.Thu],  t(9,50), t(10,40), "IV ECE-B (B)"),
  ...occ("IST-227",[D.Thu],  t(11,40),t(12,30), "IV ECE-B (A)"),
  ...occ("IST-227",[D.Fri],  t(9,0),  t(9,50),  "IV ECE-B (E)"),
  ...occ("IST-227",[D.Fri],  t(9,50), t(10,40), "IV ECE-B (D)"),
  ...occ("IST-227",[D.Fri],  t(10,50),t(11,40), "IV ECE-B (F)"),

  /* ── Lab rooms – shared usage ── */
  ...occ("IST-618",[D.Wed],  t(13,30),t(15,15), "I ECE-A PPS Lab"),
  ...occ("IST-617",[D.Mon],  t(9,0),  t(10,40), "I ECE-DS PCB Lab"),
  ...occ("IST-617",[D.Thu],  t(9,0),  t(10,40), "II DS-A Lab"),
  ...occ("IST-108",[D.Mon],  t(10,50),t(12,30), "III BME MPMC Lab"),
  ...occ("IST-108",[D.Tue],  t(9,0),  t(10,40), "III BME BIO DSP Lab"),
  ...occ("IST-108",[D.Wed],  t(9,50), t(10,40), "IV ECE-A Lab"),
  ...occ("IST-108",[D.Thu],  t(10,50),t(12,30), "IV ECE-B Lab"),

  /* ── IST 510 – CDC room ── */
  ...occ("IST-510",[D.Wed],  t(9,0),  t(10,40), "I ECE-B CDC"),
  ...occ("IST-510",[D.Thu],  t(13,30),t(14,20), "I ECE-A CDC"),

  /* ── IST 710 – Seminar ── */
  ...occ("IST-710",[D.Mon],  t(15,20),t(16,10), "I ECE-A (F)"),
  ...occ("IST-710",[D.Mon],  t(9,0),  t(9,50),  "I ECE-B (F/G)"),
  ...occ("IST-710",[D.Mon],  t(13,30),t(14,20), "I ECE-DS (F)"),

  /* ── G-625 – CDC / Aptitude ── */
  ...occ("G-625",  [D.Mon],  t(14,10),t(16,0),  "III ECE-A CDC"),
  ...occ("G-625",  [D.Mon],  t(9,0),  t(10,40), "III BME CDC"),
  ...occ("G-625",  [D.Tue],  t(9,0),  t(10,40), "III BME CDC"),

  /* ── H-TB-106 – Lab ── */
  ...occ("H-TB-106",[D.Tue], t(14,10),t(16,0),  "II BME Lab"),
  ...occ("H-TB-106",[D.Wed], t(14,10),t(16,0),  "II BME/DS-A Lab"),
  ...occ("H-TB-106",[D.Thu], t(10,50),t(12,30), "II DS-B Lab"),

  /* ── IST-020 (Workshop) ── */
  ...occ("IST-020",[D.Tue],  t(13,30),t(15,15), "I ECE-A Workshop"),
  ...occ("IST-020",[D.Mon],  t(9,0),  t(10,40), "I ECE-B Workshop"),
  ...occ("IST-020",[D.Fri],  t(13,30),t(16,50), "I ECE-DS Workshop"),

  /* ── G-401 – Lab ── */
  ...occ("G-401",  [D.Wed],  t(9,0),  t(10,40), "II DS-B Lab"),
  ...occ("G-401",  [D.Thu],  t(9,0),  t(10,40), "II DS-B Lab"),

  /* ── IST-309 ── */
  ...occ("IST-309",[D.Mon],  t(14,10),t(16,0),  "II DS-A Lab"),
  ...occ("IST-309",[D.Mon],  t(9,0),  t(10,40), "II DS-B Lab"),
  ...occ("IST-309",[D.Tue],  t(9,0),  t(10,40), "II DS-B Lab"),
];

/* Lunch/break windows for display */
const BREAK_WINDOWS = [
  { start: t(12,35), end: t(13,30), label:"Lunch Break" },
  { start: t(10,40), end: t(10,50), label:"Tea Break" },
  { start: t(15,0),  end: t(15,10), label:"Tea Break" },
];
const COLLEGE_START = t(9,0);
const COLLEGE_END   = t(17,5);

/* ══════════════════════════════════════════
   4. STATE
   ══════════════════════════════════════════ */
let currentDay  = null;  // 0=Mon … 4=Fri
let currentMins = null;  // minutes from midnight
let activeFilter = "all";
let aiHighlighted = new Set();
let geminiApiKey = localStorage.getItem("srm_gemini_key") || "";
let viewMode = "3d"; // "3d" or "grid"
let active3DFloor = "all";
let activeModalRoomId = null;
let countdownTimerInterval = null;

/* ══════════════════════════════════════════
   5. TIME UTILITIES
   ══════════════════════════════════════════ */
function nowMins(){
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
function todayIndex(){
  const d = new Date().getDay(); // 0=Sun
  return d === 0 || d === 6 ? -1 : d - 1; // -1 for weekend
}
function formatTime(mins){
  const h = Math.floor(mins/60), m = mins%60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h > 12 ? h-12 : h === 0 ? 12 : h;
  return `${hh}:${String(m).padStart(2,"0")} ${ampm}`;
}
const DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

/* ══════════════════════════════════════════
   6. ROOM STATUS CALCULATOR
   ══════════════════════════════════════════ */
function getRoomStatus(roomId, day, mins){
  if(day < 0 || day > 4) return { status:"free", label:"Weekend" };
  if(mins < COLLEGE_START || mins > COLLEGE_END) return { status:"free", label:"Outside hours" };

  // Check break windows
  for(const bw of BREAK_WINDOWS){
    if(mins >= bw.start && mins < bw.end)
      return { status:"break", label: bw.label };
  }

  // Check occupancy
  const entries = OCCUPANCY.filter(e => e.roomId === roomId && e.day === day && mins >= e.start && mins < e.end);
  if(entries.length){
    const label = entries[0].label;
    // Find next free slot
    const sameDay = OCCUPANCY.filter(e => e.roomId === roomId && e.day === day && e.start > mins).sort((a,b)=>a.start-b.start);
    let freeAt = entries[0].end;
    for(const e of sameDay){
      if(e.start <= freeAt) freeAt = Math.max(freeAt, e.end);
      else break;
    }
    return { status:"busy", label, freeAt };
  }

  // Find when it next gets occupied
  const upcoming = OCCUPANCY.filter(e => e.roomId === roomId && e.day === day && e.start > mins).sort((a,b)=>a.start-b.start);
  const freeUntil = upcoming.length ? upcoming[0].start : COLLEGE_END;
  return { status:"free", label:"Available", freeUntil };
}

function countFreeRooms(day, mins){
  return ROOMS.filter(r => getRoomStatus(r.id, day, mins).status === "free").length;
}

/* ══════════════════════════════════════════
   7. CLOCK
   ══════════════════════════════════════════ */
function updateClock(){
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h > 12 ? h-12 : h === 0 ? 12 : h;
  document.getElementById("clock-time").textContent = `${hh}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")} ${ampm}`;
  document.getElementById("clock-day").textContent = DAY_NAMES[now.getDay() === 0 ? 6 : now.getDay()-1] ?? "Today";
}

/* ══════════════════════════════════════════
   8. RENDER FLOOR GRID
   ══════════════════════════════════════════ */
const FLOOR_LABELS = {
  1:"Floor 1 — Basement Labs",
  2:"Floor 2",
  3:"Floor 3",
  4:"Floor 4",
  5:"Floor 5",
  6:"Floor 6",
  7:"Floor 7",
  G:"G Block",
  H:"H Block",
  W:"Workshop Block"
};

function renderView(){
  const dayLabel = currentDay >= 0 ? DAY_NAMES[currentDay] : "Today";
  document.getElementById("floor-subtitle").textContent =
    `${dayLabel} · ${formatTime(currentMins)}`;

  const freeCount = countFreeRooms(currentDay, currentMins);
  document.getElementById("free-count-num").textContent = freeCount;

  if(viewMode === "3d"){
    document.getElementById("map-3d-view-wrapper").classList.remove("hidden");
    document.getElementById("floor-grid").classList.add("hidden");
    render3DMap();
  } else {
    document.getElementById("map-3d-view-wrapper").classList.add("hidden");
    document.getElementById("floor-grid").classList.remove("hidden");
    renderFloorGrid();
  }
}

function render3DMap(){
  const stack = document.getElementById("map-3d-building-stack");
  stack.innerHTML = "";

  const floors = [...new Set(ROOMS.map(r => r.floor))];

  for(const floor of floors){
    if(active3DFloor !== "all" && String(floor) !== String(active3DFloor)) continue;

    const floorRooms = ROOMS.filter(r => r.floor === floor);
    const statuses = floorRooms.map(r => ({ room:r, st: getRoomStatus(r.id, currentDay, currentMins) }));

    const visible = statuses.filter(({st}) => {
      if(activeFilter === "free") return st.status === "free";
      if(activeFilter === "busy") return st.status === "busy";
      return true;
    });

    if(!visible.length && active3DFloor === "all") continue;

    const freeCount = statuses.filter(({st}) => st.status === "free").length;

    const slab = document.createElement("div");
    slab.className = "map-3d-floor-slab";
    slab.style.setProperty("--floor-idx", floor === "G"? 0 : floor === "H"? -1 : floor === "W"? -2 : floor);

    const floorTitle = FLOOR_LABELS[floor] || `Floor ${floor}`;
    slab.innerHTML = `
      <div class="map-3d-floor-header">
        <span class="map-3d-floor-title">${floorTitle}</span>
        <span class="map-3d-floor-stat">${freeCount}/${statuses.length} Free</span>
      </div>
      <div class="map-3d-rooms-grid"></div>
    `;

    const roomsGrid = slab.querySelector(".map-3d-rooms-grid");

    if(!visible.length){
      roomsGrid.innerHTML = `<div class="no-rooms-msg" style="padding:10px;">No rooms matching filter.</div>`;
    } else {
      for(const {room, st} of visible){
        const cube = document.createElement("div");
        cube.className = `room-3d-cube st-${st.status}`;
        if(aiHighlighted.has(room.id)) cube.classList.add("ai-highlight");

        let statusText = st.status === "free" ? "FREE NOW" : st.status === "busy" ? "OCCUPIED" : "BREAK";
        let timeSub = st.status === "free" 
          ? (st.freeUntil && st.freeUntil < COLLEGE_END ? `Until ${formatTime(st.freeUntil)}` : "Rest of Day")
          : (st.freeAt ? `Free at ${formatTime(st.freeAt)}` : st.label);

        cube.innerHTML = `
          <div class="room-3d-name">${room.name}</div>
          <div class="room-3d-tag">${statusText}</div>
          <div class="room-3d-time">${timeSub}</div>
        `;

        cube.onclick = (e) => {
          e.stopPropagation();
          openRoomModal(room.id);
        };
        roomsGrid.appendChild(cube);
      }
    }

    stack.appendChild(slab);
  }
}

function renderFloorGrid(){
  const grid = document.getElementById("floor-grid");
  const floors = [...new Set(ROOMS.map(r => r.floor))];
  grid.innerHTML = "";

  for(const floor of floors){
    const floorRooms = ROOMS.filter(r => r.floor === floor);
    const statuses = floorRooms.map(r => ({ room:r, st: getRoomStatus(r.id, currentDay, currentMins) }));

    const visible = statuses.filter(({st}) => {
      if(activeFilter === "free") return st.status === "free";
      if(activeFilter === "busy") return st.status === "busy";
      return true;
    });
    if(!visible.length) continue;

    const freeInFloor = statuses.filter(({st}) => st.status === "free").length;
    const totalInFloor = statuses.length;

    const block = document.createElement("div");
    block.className = "floor-block";
    block.id = `floor-${floor}`;

    const labelDiv = document.createElement("div");
    labelDiv.className = "floor-label";
    labelDiv.innerHTML = `
      <span class="floor-title">${FLOOR_LABELS[floor] || `Floor ${floor}`}</span>
      <span class="floor-count-pill ${freeInFloor === 0 ? "busy-pill" : ""}">${freeInFloor}/${totalInFloor} free</span>
    `;

    const rowDiv = document.createElement("div");
    rowDiv.className = "rooms-row";

    if(visible.length === 0){
      rowDiv.innerHTML = `<div class="no-rooms-msg">No rooms match the current filter.</div>`;
    } else {
      for(const {room, st} of visible){
        rowDiv.appendChild(buildRoomCard(room, st));
      }
    }

    block.appendChild(labelDiv);
    block.appendChild(rowDiv);
    grid.appendChild(block);
  }
}

function buildRoomCard(room, st){
  const card = document.createElement("div");
  card.className = `room-card ${st.status}`;
  card.id = `room-${room.id}`;
  card.style.cursor = "pointer";
  if(aiHighlighted.has(room.id)) card.classList.add("ai-highlight");

  let badge = "", detail = "", extra = "";
  if(st.status === "free"){
    badge = `<span class="room-status-badge badge-free">Free</span>`;
    detail = `${room.type} · Cap: ${room.capacity}${room.ac ? " · ❄️ AC" : ""}`;
    if(st.freeUntil && st.freeUntil < COLLEGE_END)
      extra = `<div class="room-free-until">Free until ${formatTime(st.freeUntil)}</div>`;
    else
      extra = `<div class="room-free-until">Free rest of day</div>`;
  } else if(st.status === "busy"){
    badge = `<span class="room-status-badge badge-busy">Occupied</span>`;
    detail = `${room.type} · ${room.ac ? "❄️ AC" : "No AC"}`;
    extra = `<div class="room-class">📚 ${st.label}${st.freeAt ? ` · Free at ${formatTime(st.freeAt)}` : ""}</div>`;
  } else {
    badge = `<span class="room-status-badge badge-break">Break</span>`;
    detail = `${room.type} · ${room.ac ? "❄️ AC" : "No AC"}`;
    extra = `<div class="room-class">☕ ${st.label}</div>`;
  }

  card.innerHTML = `
    <div class="room-glow"></div>
    <div class="room-card-top">
      <div class="room-name">${room.name}</div>
      ${badge}
    </div>
    <div class="room-detail">${detail}</div>
    ${extra}
  `;

  card.onclick = () => openRoomModal(room.id);
  return card;
}

/* ══════════════════════════════════════════
   ROOM MODAL & COUNTDOWN TIMER & CALL THE SQUAD
   ══════════════════════════════════════════ */
function openRoomModal(roomId){
  const room = ROOMS.find(r => r.id === roomId);
  if(!room) return;
  activeModalRoomId = roomId;

  const st = getRoomStatus(roomId, currentDay, currentMins);

  // Set Modal Header
  document.getElementById("modal-room-name").textContent = room.name;
  const floorName = room.floor === 'G' ? 'G Block' : room.floor === 'H' ? 'H Block' : room.floor === 'W' ? 'Workshop Block' : `Floor ${room.floor}`;
  document.getElementById("modal-room-meta").textContent = `${floorName} · ${room.type} · Cap: ${room.capacity} · ${room.ac ? '❄️ Air Conditioned' : 'Non-AC'}`;

  const badgeEl = document.getElementById("modal-status-badge");
  badgeEl.className = `modal-status-badge ${st.status}`;
  badgeEl.textContent = st.status === "free" ? "FREE NOW" : st.status === "busy" ? "OCCUPIED" : "BREAK WINDOW";

  // Calculate target end time in minutes from midnight
  let targetMin = COLLEGE_END;
  let countdownTitle = "TIME REMAINING UNTIL NEXT CLASS";
  let countdownSub = "";

  if(st.status === "free"){
    targetMin = st.freeUntil ? st.freeUntil : COLLEGE_END;
    countdownTitle = "TIME REMAINING UNTIL NEXT CLASS";
    countdownSub = targetMin < COLLEGE_END ? `Free until ${formatTime(targetMin)}` : "Free rest of the day!";
  } else if(st.status === "busy"){
    targetMin = st.freeAt ? st.freeAt : COLLEGE_END;
    countdownTitle = "TIME REMAINING IN CURRENT CLASS";
    countdownSub = `Occupied by: ${st.label} (Free at ${formatTime(targetMin)})`;
  } else {
    const bw = BREAK_WINDOWS.find(b => currentMins >= b.start && currentMins < b.end);
    targetMin = bw ? bw.end : COLLEGE_END;
    countdownTitle = "TIME REMAINING IN BREAK WINDOW";
    countdownSub = `Break Window (${st.label})`;
  }

  document.getElementById("countdown-label").textContent = countdownTitle;
  document.getElementById("countdown-subtext").textContent = countdownSub;

  // Start live second-by-second countdown
  startCountdown(targetMin);

  // Call the Squad WhatsApp invite
  setupSquadFeature(room, st, targetMin);

  // Render Schedule Preview
  renderSchedulePreview(room);

  // Show Modal Backdrop
  document.getElementById("room-modal-backdrop").classList.remove("hidden");
}

function startCountdown(targetMin){
  if(countdownTimerInterval) clearInterval(countdownTimerInterval);

  function updateDigits(){
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Math.floor(targetMin/60), targetMin%60, 0);
    const simulatedNow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Math.floor(currentMins/60), currentMins%60, now.getSeconds());

    let diffSecs = Math.floor((targetDate.getTime() - simulatedNow.getTime()) / 1000);
    if(diffSecs <= 0) diffSecs = 0;

    const hrs = Math.floor(diffSecs / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);
    const secs = diffSecs % 60;

    document.getElementById("cd-hours").textContent = String(hrs).padStart(2,"0");
    document.getElementById("cd-mins").textContent = String(mins).padStart(2,"0");
    document.getElementById("cd-secs").textContent = String(secs).padStart(2,"0");
  }

  updateDigits();
  countdownTimerInterval = setInterval(updateDigits, 1000);
}

function setupSquadFeature(room, st, targetMin){
  const freeUntilStr = st.status === "free" 
    ? (targetMin < COLLEGE_END ? formatTime(targetMin) : "5:05 PM")
    : (st.freeAt ? formatTime(st.freeAt) : "soon");

  const squadMsg = `📍 Heading to ${room.name}. It's free until ${freeUntilStr}. Come fast!`;
  document.getElementById("squad-preview-text").textContent = `"${squadMsg}"`;

  // WhatsApp Link
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(squadMsg)}`;
  document.getElementById("squad-wa-btn").href = waUrl;

  // Copy button handler
  document.getElementById("squad-copy-btn").onclick = () => {
    navigator.clipboard.writeText(squadMsg).then(() => {
      showToast("Invite copied to clipboard! 🚀");
    }).catch(() => {
      showToast("Invite copied!");
    });
  };

  // Web Share API
  const shareBtn = document.getElementById("squad-share-btn");
  if(navigator.share){
    shareBtn.classList.remove("hidden");
    shareBtn.onclick = () => {
      navigator.share({
        title: `RoomRadar - ${room.name}`,
        text: squadMsg,
        url: window.location.href
      }).catch(()=>{});
    };
  } else {
    shareBtn.classList.add("hidden");
  }
}

function renderSchedulePreview(room){
  const list = document.getElementById("schedule-slots-list");
  list.innerHTML = "";

  const daySlots = OCCUPANCY.filter(e => e.roomId === room.id && e.day === currentDay).sort((a,b)=>a.start-b.start);

  if(!daySlots.length){
    list.innerHTML = `<div class="schedule-slot-item"><span>No classes scheduled today 🎉</span></div>`;
    return;
  }

  for(const slot of daySlots){
    const isActive = currentMins >= slot.start && currentMins < slot.end;
    const item = document.createElement("div");
    item.className = `schedule-slot-item ${isActive ? 'active-slot' : ''}`;
    item.innerHTML = `
      <span>${formatTime(slot.start)} – ${formatTime(slot.end)}</span>
      <strong>${slot.label}</strong>
    `;
    list.appendChild(item);
  }
}

function closeRoomModal(){
  document.getElementById("room-modal-backdrop").classList.add("hidden");
  if(countdownTimerInterval){
    clearInterval(countdownTimerInterval);
    countdownTimerInterval = null;
  }
}

function showToast(msg){
  const toast = document.getElementById("toast-notification");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}


/* ══════════════════════════════════════════
   9. AI ROOM FINDER
   ══════════════════════════════════════════ */
function buildAIContext(){
  // Snapshot current room statuses for AI
  const lines = ROOMS.map(room => {
    const st = getRoomStatus(room.id, currentDay, currentMins);
    const statusStr = st.status === "free"
      ? `FREE (free until ${st.freeUntil ? formatTime(st.freeUntil) : "end of day"})`
      : st.status === "busy"
      ? `OCCUPIED by ${st.label}${st.freeAt ? `, free at ${formatTime(st.freeAt)}` : ""}`
      : `BREAK (${st.label})`;
    return `- ${room.name} | Floor ${room.floor} | ${room.type} | Capacity ${room.capacity} | AC: ${room.ac?"Yes":"No"} | Status: ${statusStr}`;
  });
  return lines.join("\n");
}

async function runAISearch(query){
  if(!geminiApiKey){
    document.getElementById("api-warning").classList.remove("hidden");
    return;
  }
  document.getElementById("api-warning").classList.add("hidden");
  document.getElementById("ai-response").classList.add("hidden");
  document.getElementById("ai-loading").classList.remove("hidden");

  const dayLabel = currentDay >= 0 ? DAY_NAMES[currentDay] : "Unknown";
  const context = buildAIContext();

  const systemPrompt = `You are RoomRadar, a helpful assistant for SRM IST Trichy students looking for free classrooms.
Current time: ${formatTime(currentMins)} on ${dayLabel}.
College hours: 9:00 AM – 5:05 PM.

Here is the live room availability data:
${context}

The user is asking: "${query}"

Your job:
1. Parse the user's natural language request (they may ask for floor, AC, duration, capacity, room type, etc.)
2. Recommend specific rooms from the list above that best match their needs AND are currently FREE or will be free soon.
3. For each recommended room, briefly explain why it fits (floor, AC, free duration).
4. Format your response clearly with room names wrapped in ** (e.g., **IST 518**).
5. If no rooms match, suggest the closest alternatives.
6. Keep the response concise and helpful (max 200 words).`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          contents:[{ parts:[{ text: systemPrompt }] }],
          generationConfig:{ temperature:0.4, maxOutputTokens:512 }
        })
      }
    );
    const data = await res.json();
    if(data.error) throw new Error(data.error.message);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";

    // Extract room IDs mentioned
    aiHighlighted.clear();
    ROOMS.forEach(r => {
      if(text.includes(r.name)) aiHighlighted.add(r.id);
    });

    // Format response: bold room names
    const formatted = text
      .replace(/\*\*(IST\s?\d+[^\*]*)\*\*/g, '<strong class="room-tag">$1</strong>')
      .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, "<br/>");

    document.getElementById("ai-response-body").innerHTML = formatted;
    document.getElementById("ai-response").classList.remove("hidden");

    // Re-render to show highlights
    renderView();

    // Scroll to first highlighted room
    const firstHighlighted = document.querySelector(".ai-highlight");
    if(firstHighlighted) firstHighlighted.scrollIntoView({ behavior:"smooth", block:"center" });

  } catch(err) {
    document.getElementById("ai-response-body").textContent = `Error: ${err.message}. Check your API key and try again.`;
    document.getElementById("ai-response").classList.remove("hidden");
  } finally {
    document.getElementById("ai-loading").classList.add("hidden");
  }
}

/* ══════════════════════════════════════════
   10. INIT & EVENT LISTENERS
   ══════════════════════════════════════════ */
function initTime(){
  const di = todayIndex();
  currentDay = di >= 0 ? di : 0;
  currentMins = nowMins();

  // Set selector defaults
  document.getElementById("time-day").value = String(currentDay < 0 ? 0 : currentDay);
  const hh = Math.floor(currentMins/60), mm = currentMins%60;
  document.getElementById("time-input").value = `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
}

function applyTimeOverride(){
  const dayVal = parseInt(document.getElementById("time-day").value);
  const timeVal = document.getElementById("time-input").value;
  const [hStr,mStr] = timeVal.split(":");
  currentDay = dayVal;
  currentMins = parseInt(hStr)*60 + parseInt(mStr);
  renderView();
}

// Clock tick
setInterval(updateClock, 1000);
updateClock();

// Time override selectors
document.getElementById("time-day").addEventListener("change", applyTimeOverride);
document.getElementById("time-input").addEventListener("change", applyTimeOverride);

// Use Now button
document.getElementById("use-now-btn").addEventListener("click", () => {
  const di = todayIndex();
  currentDay = di >= 0 ? di : 0;
  currentMins = nowMins();
  document.getElementById("time-day").value = String(currentDay);
  const hh = Math.floor(currentMins/60), mm = currentMins%60;
  document.getElementById("time-input").value = `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
  renderView();
});

// View Toggle buttons (3D vs Grid)
document.getElementById("view-mode-3d").addEventListener("click", () => {
  document.getElementById("view-mode-3d").classList.add("active");
  document.getElementById("view-mode-grid").classList.remove("active");
  viewMode = "3d";
  renderView();
});

document.getElementById("view-mode-grid").addEventListener("click", () => {
  document.getElementById("view-mode-grid").classList.add("active");
  document.getElementById("view-mode-3d").classList.remove("active");
  viewMode = "grid";
  renderView();
});

// 3D Perspective controls
document.getElementById("cam-reset").addEventListener("click", () => {
  document.getElementById("cam-reset").classList.add("active");
  document.getElementById("cam-flat").classList.remove("active");
  document.getElementById("map-3d-stage-viewport").classList.remove("flat-mode");
});

document.getElementById("cam-flat").addEventListener("click", () => {
  document.getElementById("cam-flat").classList.add("active");
  document.getElementById("cam-reset").classList.remove("active");
  document.getElementById("map-3d-stage-viewport").classList.add("flat-mode");
});

// Floor selector pills
document.querySelectorAll(".floor-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".floor-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    active3DFloor = pill.dataset.floor;
    renderView();
  });
});

// Filter buttons (All, Free, Occupied)
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    renderView();
  });
});

// Room Inspector Modal Close Handlers
document.getElementById("modal-close-btn").addEventListener("click", closeRoomModal);
document.getElementById("room-modal-backdrop").addEventListener("click", e => {
  if(e.target === document.getElementById("room-modal-backdrop")) closeRoomModal();
});
document.addEventListener("keydown", e => {
  if(e.key === "Escape") closeRoomModal();
});

// API key toggle
document.getElementById("api-key-toggle").addEventListener("click", () => {
  document.getElementById("api-key-row").classList.toggle("hidden");
});
document.getElementById("api-key-save").addEventListener("click", () => {
  geminiApiKey = document.getElementById("api-key-input").value.trim();
  localStorage.setItem("srm_gemini_key", geminiApiKey);
  document.getElementById("api-key-row").classList.add("hidden");
  document.getElementById("api-key-toggle").textContent = "✓ Key Saved";
  setTimeout(() => { document.getElementById("api-key-toggle").innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.5 10.5a4 4 0 100-8 4 4 0 000 8zM10.5 10.5L14 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg> API Key`; }, 2000);
});

// Pre-fill saved key
if(geminiApiKey) document.getElementById("api-key-input").value = geminiApiKey;

// AI search
document.getElementById("ai-send-btn").addEventListener("click", () => {
  const q = document.getElementById("ai-query").value.trim();
  if(q) runAISearch(q);
});
document.getElementById("ai-query").addEventListener("keydown", e => {
  if(e.key === "Enter"){
    const q = document.getElementById("ai-query").value.trim();
    if(q) runAISearch(q);
  }
});

// AI chips
document.querySelectorAll(".ai-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.getElementById("ai-query").value = chip.dataset.query;
    runAISearch(chip.dataset.query);
  });
});

// Clear AI response
document.getElementById("ai-clear-btn").addEventListener("click", () => {
  document.getElementById("ai-response").classList.add("hidden");
  document.getElementById("ai-query").value = "";
  aiHighlighted.clear();
  renderView();
});

// Live clock refresh (every 30s re-renders if using "now" mode)
let lastAutoMin = -1;
setInterval(() => {
  const di = todayIndex();
  const nm = nowMins();
  const inputTime = document.getElementById("time-input").value;
  const [ih, im] = inputTime.split(":").map(Number);
  const inputMins = ih*60+im;
  if(Math.abs(inputMins - nm) <= 1 && di === currentDay){
    if(nm !== lastAutoMin){
      lastAutoMin = nm;
      currentMins = nm;
      renderView();
    }
  }
}, 30000);

// Boot
initTime();
renderView();

