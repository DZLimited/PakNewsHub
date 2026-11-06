// Static category config (labels, Urdu names, tag colours, card emoji).
export const categories = [
  { id: "world",         label: "World",         urdu: "دنیا",       emoji: "🌍", color: "#E6F1FB", text: "#0C447C" },
  { id: "politics",      label: "Politics",      urdu: "سیاست",      emoji: "🏛️", color: "#FAEEDA", text: "#633806" },
  { id: "business",      label: "Business",      urdu: "کاروبار",     emoji: "📈", color: "#FCEBEB", text: "#791F1F" },
  { id: "technology",    label: "Technology",    urdu: "ٹیکنالوجی",   emoji: "💻", color: "#EAF3DE", text: "#27500A" },
  { id: "sports",        label: "Sports",        urdu: "کھیل",       emoji: "🏏", color: "#FBEAF0", text: "#72243E" },
  { id: "health",        label: "Health",        urdu: "صحت",        emoji: "🏥", color: "#E1F5EE", text: "#085041" },
  { id: "science",       label: "Science",       urdu: "سائنس",      emoji: "🔬", color: "#EDE8FC", text: "#3B1D8A" },
  { id: "entertainment", label: "Entertainment", urdu: "تفریح",       emoji: "🎬", color: "#FFF3E0", text: "#7B4500" },
];

export const getCategory = id => categories.find(c => c.id === id);
