/* ============================================================
   SPARSH HQ — content.js
   Every word, metric and story in the building lives here.
   Edit this file to update the portfolio without touching code.
   ============================================================ */

const CONTENT = {

  profile: {
    name: "Sparsh Sinha",
    role: "Senior Software Engineer",
    company: "Sprinklr",
    prevRole: "SDE II",
    prevCompany: "Pocketpills",
    email: "sparshsinha.spavis@gmail.com",
    location: "Delhi, India",
    education: "B.Tech in Computer Engineering — Delhi Technological University (DTU), 2023 · 8.83 CGPA",
    tagline: "Every room ships software.",
  },

  links: {
    linkedin: "https://www.linkedin.com/in/sparshsinha25/",
    github: "https://github.com/benasus25",
    chatAppRepo: "https://github.com/benasus25/Chat-app-sparsh",
    chatAppLive: "https://chat-app-sparsh.herokuapp.com/",
    serverRepo: "https://github.com/benasus25/intra-organisational-server",
    resume: "assets/Sparsh_Sinha_Resume.pdf",
  },

  bigScreen: {
    stack: ["Java", "Spring Boot", "RabbitMQ", "PostgreSQL", "Redis", "Kafka", "Docker", "Camunda", "AWS"],
    learning: ["Distributed Systems", "Elasticsearch", "Storage Engines", "Kernel Internals"],
    experience: "3+ years of production backend engineering",
    currentRole: "Senior Software Engineer @ Sprinklr",
  },

  ticker: [
    "CURRENTLY BUILDING.",
    "CURRENTLY LEARNING.",
    "CURRENTLY BREAKING PRODUCTION.",
    "CURRENTLY FIXING PRODUCTION.",
    "12M+ USERS SERVED.",
    "1M+ MONTHLY DASHBOARD VISITS.",
    "SHIP. LEARN. REPEAT.",
  ],

  floors: [
    { idx: 0, name: "Reception & Lobby",     sub: "Welcome to Sparsh HQ",           icon: "◈" },
    { idx: 1, name: "Engineering Dept.",     sub: "Production systems, walkable",   icon: "⚙" },
    { idx: 2, name: "Projects Lab",          sub: "Personal builds & experiments",  icon: "⚗" },
    { idx: 3, name: "Education Wing",        sub: "DTU · Class of 2023",            icon: "🎓" },
    { idx: 4, name: "Achievements Gallery",  sub: "A museum of small victories",    icon: "🏆" },
    { idx: 5, name: "Open Source Lab",       sub: "Commits, branches & repos",      icon: "⎇" },
    { idx: 6, name: "Tech Arsenal",          sub: "The workshop",                   icon: "🛠" },
    { idx: 7, name: "Executive Office",      sub: "Ship. Learn. Repeat.",           icon: "☕" },
  ],

  /* ------------ Info panels (opened by exhibits / props) ------------ */
  panels: {

    directory: {
      title: "Building Directory",
      sub: "Sparsh HQ · 8 floors of career",
      body: "Use the elevator (or ask NOVA at reception) to travel anywhere. Every floor is walkable — use WASD / arrow keys, or click the floor to walk there.",
    },

    bigscreen: {
      title: "Sparsh Sinha",
      sub: "Senior Software Engineer @ Sprinklr",
      body: "Backend engineer who has shipped healthcare platforms, messaging engines and dashboards used by millions. Previously SDE II at Pocketpills, where he built the backend of a multi-tenant EMR SaaS end-to-end. B.Tech in Computer Engineering from DTU (8.83 CGPA).",
      chips: ["Java", "Spring Boot", "RabbitMQ", "PostgreSQL", "Redis", "Kafka", "Docker", "AWS", "Camunda"],
      metrics: [
        ["12M+", "users reached"],
        ["1M+", "monthly visits"],
        ["100+", "live widgets"],
        ["80%", "faster responses"],
      ],
    },

    questionnaire: {
      title: "Questionnaire Engine",
      sub: "Pocketpills · Spring · Graphs & Binary Trees",
      body: "A questionnaire engine and creation tool that automated clinic workflows by replacing manual, doctor-driven processes. Question flows are modelled as graphs and binary trees — patients answer, the tree walks itself, medical histories assemble, and medication suggestions surface for doctors. A real-time delivery module built on RabbitMQ, Camunda and Spring cut profile-completion TAT by 40%, while WebClient + CompletableFutures made high-volume simultaneous requests 80% faster.",
      chips: ["Spring", "RabbitMQ", "Camunda", "WebClient", "CompletableFuture", "Graph Algorithms"],
      metrics: [
        ["10+", "campaigns"],
        ["50+", "dynamic questions"],
        ["-40%", "completion TAT"],
        ["+80%", "response time"],
      ],
    },

    dashboard: {
      title: "Dashboard Command Center",
      sub: "Pocketpills · backend-driven UI",
      body: "A personalized, interactive, fully backend-driven dashboard with 100+ dynamic widgets. The server decides what every user sees — widgets are assembled, personalized and streamed per request. It attracts over 1 million monthly visits, drove a 25% boost in user engagement and reduced inbound support communications by 35%.",
      chips: ["Spring Boot", "PostgreSQL", "Redis", "Backend-driven UI"],
      metrics: [
        ["100+", "dynamic widgets"],
        ["1M+", "monthly visits"],
        ["+25%", "engagement"],
        ["-35%", "inbound comms"],
      ],
    },

    campaign: {
      title: "Campaign Mission Control",
      sub: "Pocketpills · FCM · Twilio · SendGrid",
      body: "A customizable campaign scheduling engine for personalized messaging across email, SMS and push. Over 1,000 targeted campaigns have left this room, delivered to a 12M+ user base across every channel. Watch the particles — each one is a notification finding its human.",
      chips: ["FCM", "Twilio", "SendGrid", "Spring Boot", "RabbitMQ", "Schedulers"],
      metrics: [
        ["1,000+", "campaigns"],
        ["12M+", "user base"],
        ["3", "channels"],
        ["24/7", "always sending"],
      ],
    },

    emr: {
      title: "EMR Platform",
      sub: "Pocketpills · multi-tenant healthcare SaaS",
      body: "The entire backend of a multi-tenant EMR (Electronic Medical Records) SaaS — built end-to-end by one engineer. Personalized dashboards, an AI-driven prescribing utility, and support for online and in-person consultations, powered by Spring Boot, PostgreSQL, RabbitMQ and MCP. Doctors consult, histories float in, and the AI suggests — a hospital that lives inside a JVM.",
      chips: ["Spring Boot", "PostgreSQL", "RabbitMQ", "MCP", "Multi-tenant", "AI prescribing"],
      metrics: [
        ["1", "engineer, entire backend"],
        ["2", "consult modes"],
        ["AI", "prescribing utility"],
        ["∞", "patience required"],
      ],
    },

    b2b: {
      title: "B2B Partner Portal",
      sub: "Pocketpills · Spring Boot + AWS S3",
      body: "A Spring Boot-powered portal where B2B partners upload census files straight into AWS S3 pipelines. It handles data collection for 100+ companies and supports a user base of over 2 million people.",
      chips: ["Spring Boot", "AWS S3", "Batch processing"],
      metrics: [
        ["100+", "companies"],
        ["2M+", "users supported"],
      ],
    },

    chatapp: {
      title: "Chat App",
      sub: "Personal project · MERN + Socket.io",
      body: "A full-stack chat application built with Node.js, Express and Socket.io — messages literally fly between users over live socket beams. Mustache handles the templating and the architecture was designed to scale both vertically and horizontally. Hosted on Heroku.",
      chips: ["Node.js", "Express", "Socket.io", "Mustache", "Heroku"],
      links: [["GitHub Repo", "chatAppRepo"], ["Live Site", "chatAppLive"]],
    },

    privateserver: {
      title: "Intra-Organisational Server",
      sub: "Personal project · Dart sockets + Flutter",
      body: "A highly secure, private and scalable communication channel built with raw socket programming in Dart. Every device authenticates before connecting to the main server; encrypted packets travel the fiber you can see in this room. The mobile front end is built in Flutter. Clearance required beyond this point.",
      chips: ["Dart", "Socket programming", "Flutter", "Auth"],
      links: [["GitHub Repo", "serverRepo"]],
    },

    weather: {
      title: "Weather Engine",
      sub: "Xtreme Technologies · voyage optimization",
      body: "Mission control for the seas. APIs built on Django REST Framework collect real-time and forecasted weather on schedule. A custom algorithm decrypts GRIB weather files and feeds real-time voyage optimization for ocean ships at over 94% accuracy — then encrypts the output into binary KRUP files using Python and C++. The backend (Django, JWTs, PostgreSQL) served 50k+ monthly visits.",
      chips: ["Django", "DRF", "Python", "C++", "PostgreSQL", "JWT", "GRIB"],
      metrics: [
        ["94%+", "optimization accuracy"],
        ["50k+", "monthly visits"],
      ],
    },

    dtu: {
      title: "Delhi Technological University",
      sub: "B.Tech, Computer Engineering · 2019–2023",
      body: "Four years of computer engineering, graduating with an 8.83 CGPA. Operating systems, computer networks, DBMS, algorithms — plus open mics as Joint Secretary of Sahitya DTU (the literary society, whose social media following he doubled from 600 to 1200+) and leading a 30+ member Enactus team building an IoT-enabled aquaponics system. Before that: 90.4% in CBSE Class XII at Abhinav Public School, Delhi.",
      chips: ["8.83 CGPA", "OS", "Networks", "DBMS", "DSA", "Sahitya DTU", "Enactus"],
    },

    library: {
      title: "The Library",
      sub: "Education Wing",
      body: "CLRS sits next to Tanenbaum. The Dragon Book glares at everyone. Somewhere in here is a shelf that behaves… strangely. Certain books, when pushed, appear to bend space.",
      chips: ["Algorithms", "Operating Systems", "Compilers", "Networks"],
    },

    codekaze: {
      title: "CodeKaze — Rank 315",
      sub: "Coding Ninjas · March 2022",
      body: "Secured All-India rank 315 among 2,00,000+ participants in CodeKaze, one of India's largest coding competitions. The trophy spins forever; the rating anxiety was temporary.",
      metrics: [["315", "all-India rank"], ["200k+", "participants"]],
    },

    hackathon: {
      title: "Hack with CW — Top 30",
      sub: "Hackathon · December 2020",
      body: "Finished in the top 30 among 800 competing teams. Powered by caffeine, ambition, and a demo that worked on the second try.",
      metrics: [["Top 30", "finish"], ["800", "teams"]],
    },

    enactus: {
      title: "Enactus DTU — IC² Competition",
      sub: "Core Member · 2020–2021",
      body: "Led a 30+ member team implementing an IoT and tech-research enabled aquaponic system, and was part of the team representing Milan as a startup in the IC² Business Plan Competition — finishing 5th nationally.",
      metrics: [["30+", "team members led"], ["5th", "nationally, IC²"]],
    },

    sahitya: {
      title: "Sahitya DTU — Joint Secretary",
      sub: "Literary Society · 2019–2022",
      body: "Doubled the society's social media presence from 600 to 1200+, and organized open mics, book launches and literary competitions across the Literary Circuit. Yes, engineers read books. Some even write them.",
      metrics: [["2×", "social reach"], ["1200+", "followers"]],
    },

    github: {
      title: "The GitHub Wall",
      sub: "github.com/benasus25",
      body: "Repositories floating in zero gravity, commit history running like subway lines. From percolation simulators to full chat apps — click a repo pod to peek inside, or visit the profile for the full map.",
      links: [["Open GitHub Profile", "github"]],
    },

    java: {
      title: "The Java Suit",
      sub: "Tech Arsenal · JVM exhibit",
      body: "Click and the entire JVM comes alive: heap allocating, garbage collector sweeping, threads scurrying between cores. Sparsh's daily driver — Spring Boot services, reactive WebClients, CompletableFutures tuned until p99 behaves.",
      chips: ["Java 17", "Spring Boot", "JVM tuning", "Concurrency"],
    },

    rabbitmq: {
      title: "RabbitMQ Control Panel",
      sub: "Tech Arsenal · message broker",
      body: "Messages physically travel through these pipes. Watch retries loop back, and failures drop into the Dead Letter Queue below — where messages go to think about what they've done. Sparsh has moved millions of real messages through queues like these.",
      chips: ["Exchanges", "Queues", "DLQ", "Retries", "Camunda handoffs"],
    },

    redis: {
      title: "Redis Chamber",
      sub: "Tech Arsenal · in-memory store",
      body: "Sub-millisecond crystal storage. Sessions, caches, hot dashboard data — if it needs to be fast, it lives here until the TTL reaper comes.",
      chips: ["Caching", "TTL", "Pub/Sub"],
    },

    docker: {
      title: "Container Yard",
      sub: "Tech Arsenal · Docker",
      body: "Containers stacked like shipping crates, because they are shipping crates. It works on his machine AND yours — that's the whole point.",
      chips: ["Docker", "Compose", "CI/CD"],
    },

    postgres: {
      title: "The Postgres Vault",
      sub: "Tech Arsenal · database",
      body: "The vault where truth is stored. ACID-compliant, heavily indexed, lovingly EXPLAIN-ANALYZEd. Please do not touch the production database. Seriously. Do not.",
      chips: ["PostgreSQL", "Indexing", "Query tuning", "MySQL too"],
    },

    linux: {
      title: "Linux Room",
      sub: "Tech Arsenal · terminal shrine",
      body: "A quiet room full of green text. grep, awk, systemd, and the eternal hum of a server that has been up for 400 days and must never be rebooted.",
      chips: ["Linux", "Bash", "Networking"],
    },

    goals: {
      title: "The Goals Whiteboard",
      sub: "Executive Office · what's next",
      body: "The roadmap, in dry-erase marker: AI systems. Distributed systems. Databases from the inside. Kernels. Search engines. Operating systems. Elasticsearch. Storage engines. Compilers. The whiteboard has never once been erased — only extended.",
      chips: ["AI", "Distributed Systems", "Databases", "Kernel", "Search Engines", "OS", "Elasticsearch", "Storage Engines", "Compilers"],
    },

    execdesk: {
      title: "The Desk",
      sub: "Executive Office",
      body: "Standing desk, mechanical keyboard (lubed switches, obviously), one coffee mug that has seen things. The rain outside is rendered in real time; the deadlines are real too.",
      chips: ["Mechanical keyboard", "Standing desk", "Rain", "Focus"],
    },

    guestbook: {
      title: "Guest Book",
      sub: "Reception",
      body: "Travelers who walked these halls before you.",
    },

    worldmap: {
      title: "Visitor Map",
      sub: "Reception · where guests come from",
      body: "Pings from everywhere visitors have arrived. Somewhere on this map, a recruiter is smiling.",
    },

    photowall: {
      title: "Photo Wall",
      sub: "Moments from the journey",
      body: "Hackathon nights, convocation day, the first green CI pipeline, the 3 AM production fix that worked. Every polaroid is a war story.",
    },

    aquarium: {
      title: "Digital Aquarium",
      sub: "Reception · 100% uptime fish",
      body: "These fish are rendered, fed and load-balanced in real time. No fish have ever been dropped, thanks to at-least-once delivery.",
    },

    coffee: {
      title: "HQ Coffee Bar",
      sub: "Floor 0 · mission critical infrastructure",
      body: "The true message broker of any engineering org. Throughput: 47 cups/day. Availability: five nines. The espresso machine hisses in perfect 4/4 time.",
    },

    deathstar: {
      title: "Death Star Core",
      sub: "Server Room · restricted",
      body: "The main server cluster. Fully operational. Do not present any thermal exhaust ports to visitors, and absolutely do not click the production database.",
      chips: ["Uptime 99.999%", "Fans at 100%", "Do not touch"],
    },

    arcreactor: {
      title: "Arc Reactor (Hidden)",
      sub: "You found it.",
      body: "Proof that Sparsh has a heart. Also proof that this building's power bill is zero. Output: 3 gigawatts, or roughly one JVM with default heap settings.",
    },

    dungeon: {
      title: "The Developer Dungeon",
      sub: "Sub-basement · does not appear on any map",
      body: "Where production bugs are kept after capture. The rubber ducks have heard everything and will tell no one. The Stack Overflow shrine accepts offerings of upvotes. Leave through the portal before something null-pointers you.",
      chips: ["Production bugs", "Rubber ducks", "Stack Overflow shrine"],
    },

    murph: {
      title: "The Interstellar Shelf",
      sub: "Library · gravity anomaly",
      body: "S-T-A-Y. The books on this shelf bend space when pushed. Somewhere behind them, a five-dimensional being is trying to send a message. It's probably about a merge conflict.",
    },

    chili: {
      title: "Conference Room C",
      sub: "The Office memorial",
      body: "A plaque marks the spot where Kevin spilled the chili. The trick is to undercook the onions. Everybody's going to get to know each other in the pot.",
    },

  },

  /* ------------ Repo pods on Floor 5 ------------ */
  repos: [
    { name: "chat-app-sparsh",             lang: "JavaScript", desc: "MERN + Socket.io real-time chat", stars: "★" },
    { name: "intra-organisational-server", lang: "Dart",       desc: "Private socket comms + Flutter",  stars: "★" },
    { name: "CodeFlowVisualizer",          lang: "JavaScript", desc: "Watch code execute, visually",     stars: "★" },
    { name: "InventoManage",               lang: "Java",       desc: "Inventory management system",      stars: "★" },
    { name: "Percolation",                 lang: "Java",       desc: "Union-find percolation sim",       stars: "★" },
    { name: "Spell-Checker",               lang: "C",          desc: "Trie-based spell checker",         stars: "★" },
    { name: "Exercise-Tracker",            lang: "Node",       desc: "REST API + Mongo tracker",         stars: "★" },
    { name: "Platformer",                  lang: "Lua",        desc: "2D platformer experiments",        stars: "★" },
    { name: "Twitter-Recommendation",      lang: "Python",     desc: "Graph-based recsys study",         stars: "★" },
    { name: "Spike-Dungeon",               lang: "Lua",        desc: "A dungeon. With spikes.",          stars: "★" },
  ],

  photos: [
    "Convocation day — DTU, 2023",
    "Hack with CW — hour 23 of 24",
    "First production deploy 🎉",
    "Sahitya DTU open mic night",
    "The aquaponics rig, v3",
    "CodeKaze leaderboard screenshot",
    "Team lunch after the big launch",
    "The 3 AM hotfix that held",
  ],

  /* ------------ NPC chatter pools ------------ */
  npcQuotes: {
    dev: [
      "It works on my machine.",
      "Tabs. Obviously tabs.",
      "Spaces. Like a civilized person.",
      "Have you tried turning the pod off and on again?",
      "The bug is in the OTHER microservice.",
      "I'll just push this one tiny fix directly to main…",
      "Wait. That was PROD?!",
      "LGTM 🚀 (I did not read it)",
      "It's not a memory leak, it's a memory surprise.",
      "Standup was 45 minutes today. FORTY. FIVE.",
      "The queue is draining! THE QUEUE IS DRAINING!",
      "Who set the retry count to infinity?",
      "p99 looks… spicy today.",
      "Just one more index. One more index will fix it.",
      "I don't always test my code, but when I do, I do it in production.",
    ],
    barista: [
      "One venti dark-roast dependency injection?",
      "The espresso machine has better uptime than staging.",
      "Oat milk? We deploy oat milk on Tuesdays.",
      "Careful, it's hot. Like the prod incident channel.",
    ],
    guard: [
      "Floor 6 is restricted after the… incident.",
      "Nothing gets past me. Except null pointers.",
      "I patrol in O(n). Every night.",
      "Seen anything suspicious? Like un-reviewed PRs?",
    ],
    janitor: [
      "So… who wrote this legacy code?",
      "I swept up three dangling pointers today.",
      "They never clean up their event listeners. I do.",
      "Somebody left a memory leak on floor 6 again.",
    ],
    recruiter: [
      "So he built the WHOLE backend? Alone?",
      "8.83 CGPA and he ships? Noted.",
      "I'm told the elevator music changes per floor. Fancy.",
    ],
    student: [
      "The library shelf did WHAT?",
      "8 AM lecture. Pray for me.",
      "I heard rank 315 out of two lakh people. TWO LAKH.",
    ],
    doctor: [
      "The AI suggested the right dosage again. Impressive.",
      "Patient histories load instantly now. Bless this backend.",
      "The questionnaire finished my paperwork for me.",
    ],
  },

  /* ------------ Guide (Sparsh.AI hologram) room lines ------------ */
  guideLines: {
    plaza:        ["Welcome. Yes, the rain is real. Well — really rendered.", "Go on, the doors are automatic. Very proud of the doors."],
    lobby:        ["This is reception. NOVA runs the place. I just haunt it.", "Try the coffee bar. The espresso machine has opinions."],
    lobbyScreen:  ["That's the live board. All of it is true, even the ticker."],
    questionnaire:["Watch the tree grow — every branch is a patient answering.", "We cut profile completion time by 40% in this room."],
    dashboard:    ["100+ widgets, all decided server-side. The frontend just obeys.", "A million visits a month walk through this room."],
    campaign:     ["Every particle leaving this room is a real notification's ghost.", "12 million people. Three channels. Zero chill."],
    emr:          ["An entire hospital backend. Built solo. I'm allowed to brag — I'm his hologram."],
    b2b:          ["Census files go in, S3 pipelines hum, 100+ companies stay happy."],
    chatapp:      ["Messages literally fly here. Socket.io does the flying."],
    privateserver:["Authenticated devices only. You count as authenticated. Probably."],
    weather:      ["94% accurate voyage optimization. The ships write thank-you notes."],
    education:    ["DTU. 8.83 CGPA. The coffee desk in the corner did half the work.", "Check the library. One shelf is… non-Euclidean."],
    gallery:      ["Museum rules: no flash photography, applause encouraged."],
    opensource:   ["Commit history like subway lines. Mind the gap between branches."],
    arsenal:      ["Careful in here. Everything is load-bearing.", "Whatever you do — do NOT click the production database."],
    deathstar:    ["That's no moon. That's the server cluster."],
    executive:    ["The top floor. Rain, keyboard, goals. This is where 'next' gets planned."],
    dungeon:      ["Oh no. How did you get in here? Well — say hi to the ducks."],
  },

  /* ------------ Receptionist (NOVA) chatbot ------------ */
  chat: {
    botName: "NOVA",
    botRole: "AI Receptionist",
    welcome: [
      "Welcome to Sparsh HQ. ✨",
      "This isn't a resume. It's an entire career you can walk through.",
      "Explore freely — WASD or arrow keys to walk, E to interact, or click anywhere to stroll. Or simply tell me what you're looking for.",
    ],
    suggestions: [
      "I want to hire Sparsh",
      "Show me Projects",
      "Take me to Engineering",
      "Where did Sparsh study?",
      "What makes him different?",
      "I want to contact him",
    ],
    intents: [
      {
        match: /(hire|hiring|job|recruit|opening|available|open to work)/i,
        reply: ["Excellent taste. 👔 Sparsh is a Senior Software Engineer at Sprinklr with 3+ years of shipping real production systems — EMR platforms, 12M-user messaging engines, dashboards with a million monthly visits.", "The fastest route: the guest book at reception, or email him directly. Shall I take you to the contact desk?"],
        action: { type: "suggest", items: ["I want to contact him", "Download his resume", "Show me his best work"] },
      },
      {
        match: /(contact|email|reach|touch|phone|call)/i,
        reply: ["You can reach Sparsh at sparshsinha.spavis@gmail.com — or leave a note in the guest book and the building will make sure he sees it."],
        action: { type: "contact" },
      },
      {
        match: /(resume|cv|download)/i,
        reply: ["Here's the paper version of this entire building. Considerably less rain, though."],
        action: { type: "resume" },
      },
      {
        match: /(best work|show me projects|projects|portfolio|built|labs?)/i,
        reply: ["Taking you to the Projects Lab on Floor 2 — chat apps with flying messages, a classified server facility, and NASA-grade weather mission control. Walk this way."],
        action: { type: "goto", floor: 2 },
      },
      {
        match: /(engineering|work experience|sprinklr|pocketpills|current job|professional)/i,
        reply: ["Floor 1 — the Engineering Department. Four production systems, each with its own office. The Questionnaire Engine's tree is growing as we speak."],
        action: { type: "goto", floor: 1 },
      },
      {
        match: /(study|education|college|university|dtu|degree|cgpa)/i,
        reply: ["Delhi Technological University, B.Tech in Computer Engineering, class of 2023, 8.83 CGPA. The Education Wing is on Floor 3 — Hogwarts meets MIT, minus the tuition."],
        action: { type: "goto", floor: 3 },
      },
      {
        match: /(different|special|why sparsh|unique|stand out|strengths?)/i,
        reply: ["Most engineers build features. Sparsh builds *systems* — an entire multi-tenant EMR backend solo, messaging for 12M+ users, dashboards serving a million visits a month.", "Also: 8.83 CGPA, rank 315 of 200,000 in CodeKaze, and he ran a literary society. He will name your variables beautifully."],
        action: { type: "suggest", items: ["Show me his best work", "I want to hire Sparsh", "Take me to the Achievements Gallery"] },
      },
      {
        match: /(achievement|award|trophy|gallery|codekaze|hackathon|rank)/i,
        reply: ["Floor 4 — the Achievements Gallery. Rank 315 among 2,00,000 in CodeKaze, top 30 of 800 teams at Hack with CW, and a 5th-place national finish at IC². Mind the confetti."],
        action: { type: "goto", floor: 4 },
      },
      {
        match: /(open source|github|repos?|commits?)/i,
        reply: ["Floor 5 — the Open Source Lab. Repositories float, commits run like subway lines. His GitHub is github.com/benasus25."],
        action: { type: "goto", floor: 5 },
      },
      {
        match: /(tech|stack|skills|arsenal|java|spring|rabbit|redis|docker|postgres|kafka)/i,
        reply: ["Floor 6 — the Tech Arsenal. Java suit, RabbitMQ control panel, Redis chamber, the Postgres vault. Please do not click the production database. People have died. In a video-game sense."],
        action: { type: "goto", floor: 6 },
      },
      {
        match: /(office|executive|goals|future|learning|roadmap)/i,
        reply: ["The Executive Office, Floor 7. Rain on the glass, a mechanical keyboard, and a whiteboard of futures: distributed systems, kernels, compilers, search engines."],
        action: { type: "goto", floor: 7 },
      },
      {
        match: /(lobby|reception|start|beginning)/i,
        reply: ["Back to reception it is. The fish missed you."],
        action: { type: "goto", floor: 0 },
      },
      {
        match: /(linkedin)/i,
        reply: ["Opening his LinkedIn — linkedin.com/in/sparshsinha25. Bring connection requests, not cold pitches. Actually, bring both."],
        action: { type: "link", key: "linkedin" },
      },
      {
        match: /(secret|easter ?egg|hidden|konami)/i,
        reply: ["Officially, there are no secrets in this building. Unofficially: emergency buttons hate being pressed ten times, old cheat codes still work everywhere, and one bookshelf in the library is structurally suspicious. You didn't hear this from me."],
      },
      {
        match: /(coffee|cafe|caffeine)/i,
        reply: ["The coffee bar is right here on Floor 0, by the lounge. The barista has strong opinions on pour-over and stronger opinions on microservices."],
      },
      {
        match: /(who are you|nova|what are you)/i,
        reply: ["I'm NOVA — Sparsh's AI receptionist. I run the front desk, the elevators, and the emotional support of everyone who has ever touched the production database."],
      },
      {
        match: /(hello|hi |hey|namaste|hola)/i,
        reply: ["Hello! Welcome to Sparsh HQ. Ask me anything — or ask me to take you somewhere. The building loves showing off."],
      },
      {
        match: /(thank|thanks|great|awesome|cool|nice|amazing|love)/i,
        reply: ["Entirely my pleasure. The building preens when complimented — you may notice the lights glow a little warmer now."],
      },
      {
        match: /(bye|exit|leave|goodbye)/i,
        reply: ["Heading out? Walk to the lobby doors whenever you're ready — I have one small thing to ask before you go. 🌙"],
      },
    ],
    fallback: [
      "Hmm — that one's above my pay grade (I'm paid in gratitude and electricity). Try asking about projects, engineering, education, or say 'hire Sparsh'.",
      "I know this building better than I know that question. Want a tour instead? Say 'show me projects' or 'take me to engineering'.",
      "My neural net says '¯\\_(ツ)_/¯'. But I CAN take you to any floor, show achievements, or get you Sparsh's resume.",
    ],
  },

  /* ------------ Ending sequence ------------ */
  ending: {
    stop: [
      "Before you head out…",
      "Every great collaboration begins with a conversation.",
      "I'd genuinely love to know who visited.",
    ],
    thanks: "Thank you. The doors of Sparsh HQ are always open.",
    finale: ["Every room tells a story.", "Thanks for exploring mine."],
  },

  konamiToast: "RETRO MODE ENGAGED — the building remembers 1988.",
  hrToast: "HR has been notified.",
};
