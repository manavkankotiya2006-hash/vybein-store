/*
  VYBEIN product catalogue.
  Edit names, descriptions, notes, image paths, and prices here.
  Keep IDs unique; product.html reads the ID from its URL.
*/
const PRODUCTS = [
  {
    id: "1",
    name: "L-KHM",
    inspiredBy: "Khamrah",
    price: 899,
    originalPrice: 1299,
    volume: "50 ml",
    category: "Warm & Spiced",
    mood: "A rich, irresistible warmth made for unforgettable nights.",
    notes: ["Cinnamon", "Dates", "Vanilla", "Amberwood"],
    description: "An indulgent blend of warm spices, sweet gourmand notes, and smooth vanilla. Deep, inviting, and beautifully comforting, this fragrance leaves a memorable trail wherever the night takes you.",
    image: "images/products/L-KHM-main.webp",
    secondaryImage: "images/products/L-KHM-alt.webp",
    labelImage: null,
    badge: "Bestseller"
  },
  {
    id: "2",
    name: "C-AVT",
    inspiredBy: "Creed Aventus",
    price: 899,
    originalPrice: 1299,
    volume: "50 ml",
    category: "Fruity & Woody",
    mood: "Confidence has its own signature.",
    notes: ["Pineapple", "Bergamot", "Birch", "Musk"],
    description: "A bold blend of bright fruits and refined woods, creating a confident and sophisticated character. Fresh at first, smoky in its depth, and effortlessly memorable.",
    image: "images/products/C-AVT-main.webp",
    secondaryImage: "images/products/C-AVT-alt.webp",
    labelImage: null,
    badge: "Iconic Fragrance"
  },
  {
    id: "3",
    name: "AJ-AW",
    inspiredBy: "Amber Wood",
    price: 899,
    originalPrice: 1299,
    volume: "50 ml",
    category: "Warm & Woody",
    mood: "A golden warmth that speaks without words.",
    notes: ["Amber", "Woody accords", "Musk", "Spices"],
    description: "A sophisticated combination of warm amber, smooth woods, and sensual musk. Rich yet balanced, this fragrance wraps you in an elegant trail that feels timeless.",
    image: "images/products/AJ-AW-main.webp",
    secondaryImage: "images/products/AJ-AW-alt.webp",
    labelImage: null,
    badge: "Rich & Elegant"
  },
  {
    id: "4",
    name: "TF-OW",
    inspiredBy: "Oud Wood",
    price: 899,
    originalPrice: 1299,
    volume: "50 ml",
    category: "Woody & Spiced",
    mood: "Dark woods. Quiet luxury. Timeless presence.",
    notes: ["Oud", "Sandalwood", "Cardamom", "Vanilla"],
    description: "An elegant woody composition built around precious oud, aromatic spices, and creamy sandalwood. Smooth, mysterious, and refined, it brings understated luxury to every occasion.",
    image: "images/products/TF-OW-main.webp",
    secondaryImage: "images/products/TF-OW-alt.webp",
    labelImage: null,
    badge: "Luxury Collection"
  },
  {
    id: "5",
    name: "R-HWS",
    inspiredBy: "Hawas",
    price: 899,
    originalPrice: 1299,
    volume: "50 ml",
    category: "Fresh & Aquatic",
    mood: "A refreshing rush with an unforgettable finish.",
    notes: ["Bergamot", "Apple", "Aquatic accords", "Ambergris"],
    description: "An energetic blend of crisp fruits, refreshing aquatic notes, and warm amber undertones. Clean, vibrant, and effortlessly attractive, this fragrance is made for everyday confidence.",
    image: "images/products/R-HWS-main.webp",
    secondaryImage: "images/products/R-HWS-alt.webp",
    labelImage: null,
    badge: "Fresh Favourite"
  },
  {
    id: "6",
    name: "V-ERS",
    inspiredBy: "Eros",
    price: 899,
    originalPrice: 1299,
    volume: "50 ml",
    category: "Fresh & Sweet",
    mood: "Made to attract. Remembered for its presence.",
    notes: ["Mint", "Green Apple", "Tonka Bean", "Vanilla"],
    description: "A striking combination of fresh mint, juicy fruit, and warm vanilla. Playful yet powerful, this fragrance balances freshness and sensual sweetness with a confident finish.",
    image: "images/products/V-ERS-main.webp",
    secondaryImage: "images/products/V-ERS-alt.webp",
    labelImage: null,
    badge: "Bold & Magnetic"
  },
  {
    id: "7",
    name: "D-SVG",
    inspiredBy: "Sauvage",
    price: 899,
    originalPrice: 1299,
    volume: "50 ml",
    category: "Fresh & Spicy",
    mood: "Wild freshness with a powerful signature.",
    notes: ["Bergamot", "Pepper", "Lavender", "Ambroxan"],
    description: "A crisp burst of fresh citrus meets aromatic spices and a deep woody-amber finish. Bold, modern, and versatile, it creates a distinctive presence from day to night.",
    // Real product photo: the printed label is already on the bottle, so no
    // separate label artwork is overlaid (see productArtwork in main.js).
    image: "images/products/D-SVG-main.webp",
    secondaryImage: "images/products/D-SVG-alt.webp",
    labelImage: null,
    badge: "Signature Scent"
  },
  {
    id: "8",
    name: "A-SWY",
    inspiredBy: "Stronger With You",
    price: 899,
    originalPrice: 1299,
    volume: "50 ml",
    category: "Warm & Gourmand",
    mood: "A warm embrace that stays long after goodbye.",
    notes: ["Cardamom", "Pink Pepper", "Vanilla", "Chestnut accord"],
    description: "A captivating blend of aromatic spices, creamy sweetness, and warm chestnut-inspired notes. Smooth, comforting, and addictive, this fragrance is perfect for memorable evenings.",
    image: "images/products/A-SWY-main.webp",
    secondaryImage: "images/products/A-SWY-alt.webp",
    labelImage: null,
    badge: "Addictive Warmth"
  }
];

// Shared settings. Replace the UPI placeholder when your details are ready.
const STORE_CONFIG = {
  name: "VYBEIN",
  whatsappNumber: "916352349485",
  upiId: "your-upi-id@bank",
  currency: "INR",
  price: 899,
  originalPrice: 1299,
  // Turn this off after Diwali to hide the banner and disable the offer everywhere.
  diwaliOffer: {
    active: true,
    buyQuantity: 2
  }
};
