// Static source config. Used synchronously by the navbar/footer/badges and
// also seeded into MongoDB by the server so both sides share one definition.
export const sources = [
  { id: "bbc",       name: "BBC World",    short: "BBC", country: "🇬🇧", url: "https://www.bbc.com/news",    articles: 1240, color: "#E6F1FB", textColor: "#0C447C" },
  { id: "reuters",   name: "Reuters",      short: "RT",  country: "🌐", url: "https://www.reuters.com",     articles: 1089, color: "#FAEEDA", textColor: "#633806" },
  { id: "aljazeera", name: "Al Jazeera",   short: "AJ",  country: "🇶🇦", url: "https://www.aljazeera.com",   articles: 874,  color: "#EAF3DE", textColor: "#27500A" },
  { id: "guardian",  name: "The Guardian", short: "GD",  country: "🇬🇧", url: "https://www.theguardian.com", articles: 762,  color: "#E1F5EE", textColor: "#085041" },
  { id: "ap",        name: "AP News",      short: "AP",  country: "🇺🇸", url: "https://apnews.com",          articles: 634,  color: "#FCEBEB", textColor: "#791F1F" },
  { id: "bloomberg", name: "Bloomberg",    short: "BL",  country: "🇺🇸", url: "https://www.bloomberg.com",   articles: 521,  color: "#F3EDFC", textColor: "#4A1D7C" },
  { id: "dw",        name: "DW News",      short: "DW",  country: "🇩🇪", url: "https://www.dw.com",          articles: 412,  color: "#FFF3E0", textColor: "#7B4500" },
  { id: "dawn",      name: "Dawn",         short: "DN",  country: "🇵🇰", url: "https://www.dawn.com",        articles: 389,  color: "#E8F4F8", textColor: "#0A4B6E" },
];

export const getSource = id => sources.find(s => s.id === id);
