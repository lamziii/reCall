// Default vocabulary bias for Albanian + English meetings. Providers that accept custom
// vocabulary (Speechmatics additional_vocab, OpenAI prompt) use this to get common Albanian
// names, places, businesses and tech terms right — the words a generic model most often mangles.
// Extend freely; keep it a plain list so any provider can adapt it to its own format.

export const ALBANIAN_VOCABULARY: string[] = [
  // Greetings & everyday conversational phrases — the short words a generic model most often
  // mishears as English during rapid code-switching ("përshëndetje" → "personal data").
  "përshëndetje", "faleminderit", "mirëdita", "mirëmëngjes", "mirëmbrëma", "mirupafshim",
  "mirë se vini", "mirë se erdhët", "si jeni", "si je", "po", "jo", "dakord", "në rregull",
  "ju lutem", "të lutem", "sot", "nesër", "dje", "javën tjetër", "tani", "më vonë",
  // Common meeting vocabulary
  "mbledhje", "takim", "detyrë", "vendim", "projekt", "afati", "përfundim", "diskutim",
  "pyetje", "përgjigje", "punë", "ekip", "klient", "kompani", "prezantim", "dokument",
  "email", "telefon", "buxhet", "faturë", "marrëveshje", "investitor",
  // People — common Albanian given names
  "Ardit", "Arben", "Besnik", "Blerim", "Endrit", "Fatmir", "Genti", "Ilir", "Kreshnik", "Lorik",
  "Agon", "Drilon", "Gëzim", "Valon", "Rron", "Ermal", "Blend",
  "Albana", "Arta", "Besa", "Drita", "Elira", "Flutura", "Jeta", "Teuta", "Vjosa", "Rina", "Erza", "Donika",
  // Surnames
  "Krasniqi", "Berisha", "Gashi", "Hoxha", "Shala", "Rexhepi", "Kelmendi", "Dervishi", "Bytyqi", "Morina",
  // Places
  "Tiranë", "Prishtinë", "Prishtina", "Prizren", "Pejë", "Gjakovë", "Ferizaj", "Mitrovicë", "Durrës", "Vlorë", "Shkodër",
  "Gjilan", "Podujevë", "Vushtrri", "Kosovë", "Shqip", "Shqipëri", "Dukagjin", "Rrafshi",
  // Business / product / tech that recurs in Albanian startup meetings
  "Recall", "majaLab", "eDiaspora", "Veiz", "Mikulovci",
  "sprint", "roadmap", "backend", "frontend", "deploy", "Firebase", "Firestore",
  "onboarding", "dashboard", "review", "transkript", "afat",
];

// Known non-Albanian spellings of Albanian places/brands that a generic model emits, mapped to the
// Albanian form. Applied ONLY when the transcript is predominantly Albanian (see language-metrics.ts):
// a whole-word, case-insensitive swap — never a translation and never an invented word. Keys are
// lowercase; extend freely.
export const ALBANIAN_SPELLING_PREFERENCES: Record<string, string> = {
  kosovo: "Kosovë",
  pristina: "Prishtinë",
  vushteri: "Vushtrri",
  mitrovica: "Mitrovicë",
  peja: "Pejë",
  gjilani: "Gjilan",
};
