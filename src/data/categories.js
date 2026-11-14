// Static category config (labels, Urdu names, tag colours). `emoji` is only
// served by the API; the site draws icons instead (CategoryIcon.jsx).
// Order matters: the navbar shows the first 7.
//
// "Pakistan" replaced "Politics" (Nov 2026): Pakistani national news covers
// far more than politics, and no feed supplies a separate politics section.
export const categories = [
  { id: "pakistan",      label: "Pakistan",      urdu: "پاکستان",     emoji: "🇵🇰", color: "#E3F4E8", text: "#14532D" },
  { id: "world",         label: "World",         urdu: "دنیا",       emoji: "🌍", color: "#E6F1FB", text: "#0C447C" },
  { id: "business",      label: "Business",      urdu: "کاروبار",     emoji: "📈", color: "#FCEBEB", text: "#791F1F" },
  { id: "technology",    label: "Technology",    urdu: "ٹیکنالوجی",   emoji: "💻", color: "#EAF3DE", text: "#27500A" },
  { id: "sports",        label: "Sports",        urdu: "کھیل",       emoji: "🏏", color: "#FBEAF0", text: "#72243E" },
  { id: "health",        label: "Health",        urdu: "صحت",        emoji: "🏥", color: "#E1F5EE", text: "#085041" },
  { id: "science",       label: "Science",       urdu: "سائنس",      emoji: "🔬", color: "#EDE8FC", text: "#3B1D8A" },
  { id: "entertainment", label: "Entertainment", urdu: "تفریح",       emoji: "🎬", color: "#FFF3E0", text: "#7B4500" },
];

export const getCategory = id => categories.find(c => c.id === id);
