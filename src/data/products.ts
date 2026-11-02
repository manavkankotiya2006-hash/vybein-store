/*
  VYBEIN catalogue and store settings — the single place to edit products,
  prices, contact details and the seasonal offer. Every page reads from here.
*/

export type Mood = "fresh" | "warm" | "fruity" | "woody";

export interface Product {
  /** Legacy numeric id, kept so old product.html?id=N links still resolve. */
  id: string;
  /** Label code, also used for image and label-texture filenames. */
  code: string;
  slug: string;
  inspiredBy: string;
  price: number;
  originalPrice: number;
  volume: string;
  category: string;
  mood: string;
  notes: string[];
  description: string;
  badge: string;
  moods: Mood[];
}

export const STORE = {
  name: "VYBEIN",
  site: "https://vybein.shop",
  whatsappNumber: "916352349485",
  whatsappDisplay: "+91 63523 49485",
  instagram: "https://www.instagram.com/vybeinperfumes/",
  instagramHandle: "@vybeinperfumes",
  // Leave empty until the real UPI ID is ready; the bag hides it while empty.
  upiId: "",
  price: 899,
  originalPrice: 1299,
  concentration: "30% oil concentration",
  diwaliOffer: {
    active: true,
    buyQuantity: 2,
    // Optional ISO date such as "2026-11-15T23:59:59+05:30". After it passes the
    // banners hide and the discount stops, without needing to edit `active`.
    endsAt: null as string | null
  }
};

export const PRODUCTS: Product[] = [
  {
    id: "1",
    code: "L-KHM",
    slug: "l-khm",
    inspiredBy: "Khamrah",
    price: 899,
    originalPrice: 1299,
    volume: "50 ml",
    category: "Warm & Spiced",
    mood: "A rich, irresistible warmth made for unforgettable nights.",
    notes: ["Cinnamon", "Dates", "Vanilla", "Amberwood"],
    description: "An indulgent blend of warm spices, sweet gourmand notes, and smooth vanilla. Deep, inviting, and beautifully comforting, this fragrance leaves a memorable trail wherever the night takes you.",
    badge: "Bestseller",
    moods: ["warm"]
  },
  {
    id: "2",
    code: "C-AVT",
    slug: "c-avt",
    inspiredBy: "Creed Aventus",
    price: 899,
    originalPrice: 1299,
    volume: "50 ml",
    category: "Fruity & Woody",
    mood: "Confidence has its own signature.",
    notes: ["Pineapple", "Bergamot", "Birch", "Musk"],
    description: "A bold blend of bright fruits and refined woods, creating a confident and sophisticated character. Fresh at first, smoky in its depth, and effortlessly memorable.",
    badge: "Iconic Fragrance",
    moods: ["fruity", "woody"]
  },
  {
    id: "3",
    code: "AJ-AW",
    slug: "aj-aw",
    inspiredBy: "Amber Wood",
    price: 899,
    originalPrice: 1299,
    volume: "50 ml",
    category: "Warm & Woody",
    mood: "A golden warmth that speaks without words.",
    notes: ["Amber", "Woody accords", "Musk", "Spices"],
    description: "A sophisticated combination of warm amber, smooth woods, and sensual musk. Rich yet balanced, this fragrance wraps you in an elegant trail that feels timeless.",
    badge: "Rich & Elegant",
    moods: ["warm", "woody"]
  },
  {
    id: "4",
    code: "TF-OW",
    slug: "tf-ow",
    inspiredBy: "Oud Wood",
    price: 899,
    originalPrice: 1299,
    volume: "50 ml",
    category: "Woody & Spiced",
    mood: "Dark woods. Quiet luxury. Timeless presence.",
    notes: ["Oud", "Sandalwood", "Cardamom", "Vanilla"],
    description: "An elegant woody composition built around precious oud, aromatic spices, and creamy sandalwood. Smooth, mysterious, and refined, it brings understated luxury to every occasion.",
    badge: "Luxury Collection",
    moods: ["woody"]
  },
  {
    id: "5",
    code: "R-HWS",
    slug: "r-hws",
    inspiredBy: "Hawas",
    price: 899,
    originalPrice: 1299,
    volume: "50 ml",
    category: "Fresh & Aquatic",
    mood: "A refreshing rush with an unforgettable finish.",
    notes: ["Bergamot", "Apple", "Aquatic accords", "Ambergris"],
    description: "An energetic blend of crisp fruits, refreshing aquatic notes, and warm amber undertones. Clean, vibrant, and effortlessly attractive, this fragrance is made for everyday confidence.",
    badge: "Fresh Favourite",
    moods: ["fresh", "fruity"]
  },
  {
    id: "6",
    code: "V-ERS",
    slug: "v-ers",
    inspiredBy: "Eros",
    price: 899,
    originalPrice: 1299,
    volume: "50 ml",
    category: "Fresh & Sweet",
    mood: "Made to attract. Remembered for its presence.",
    notes: ["Mint", "Green Apple", "Tonka Bean", "Vanilla"],
    description: "A striking combination of fresh mint, juicy fruit, and warm vanilla. Playful yet powerful, this fragrance balances freshness and sensual sweetness with a confident finish.",
    badge: "Bold & Magnetic",
    moods: ["fresh", "fruity"]
  },
  {
    id: "7",
    code: "D-SVG",
    slug: "d-svg",
    inspiredBy: "Sauvage",
    price: 899,
    originalPrice: 1299,
    volume: "50 ml",
    category: "Fresh & Spicy",
    mood: "Wild freshness with a powerful signature.",
    notes: ["Bergamot", "Pepper", "Lavender", "Ambroxan"],
    description: "A crisp burst of fresh citrus meets aromatic spices and a deep woody-amber finish. Bold, modern, and versatile, it creates a distinctive presence from day to night.",
    badge: "Signature Scent",
    moods: ["fresh"]
  },
  {
    id: "8",
    code: "A-SWY",
    slug: "a-swy",
    inspiredBy: "Stronger With You",
    price: 899,
    originalPrice: 1299,
    volume: "50 ml",
    category: "Warm & Gourmand",
    mood: "A warm embrace that stays long after goodbye.",
    notes: ["Cardamom", "Pink Pepper", "Vanilla", "Chestnut accord"],
    description: "A captivating blend of aromatic spices, creamy sweetness, and warm chestnut-inspired notes. Smooth, comforting, and addictive, this fragrance is perfect for memorable evenings.",
    badge: "Addictive Warmth",
    moods: ["warm"]
  }
];

export const MOODS: { key: Mood; label: string; hint: string }[] = [
  { key: "fresh", label: "Fresh", hint: "Bright, clean and uplifting" },
  { key: "warm", label: "Warm", hint: "Spiced, smooth and comforting" },
  { key: "fruity", label: "Fruity", hint: "Juicy, vibrant and expressive" },
  { key: "woody", label: "Woody", hint: "Rich, deep and quietly elegant" }
];

// Shop filters match on the product category, as before the redesign.
export const SHOP_FILTERS: { key: string; label: string; terms: string[] }[] = [
  { key: "all", label: "All", terms: [] },
  { key: "fresh", label: "Fresh", terms: ["fresh", "aquatic"] },
  { key: "warm", label: "Warm", terms: ["warm", "gourmand"] },
  { key: "woody", label: "Woody", terms: ["woody"] },
  { key: "spiced", label: "Spiced", terms: ["spiced", "spicy"] },
  { key: "sweet", label: "Sweet", terms: ["sweet", "gourmand"] }
];

export const productNumber = (product: Product) => String(PRODUCTS.indexOf(product) + 1).padStart(2, "0");
export const findProduct = (id: string) => PRODUCTS.find((product) => product.id === String(id));
export const productUrl = (product: Product) => `/perfumes/${product.slug}`;
export const whatsappLink = (text: string) => `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(text)}`;
