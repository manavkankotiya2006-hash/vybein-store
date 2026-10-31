/*
  VYBEIN product catalogue.
  Edit names, descriptions, notes, image paths, and prices here.
  Keep IDs unique; product.html reads the ID from its URL.
*/
const PRODUCTS = [
  {
    id: "1",
    name: "Midnight Bloom",
    price: 899,
    profile: "Floral",
    mood: "A soft floral, made for after-dark plans.",
    notes: ["Blackcurrant", "Jasmine", "Warm musk"],
    description: "A modern floral that opens bright, softens into petals, and settles close to the skin. Made for evenings that unfold slowly.",
    image: "images/midnight-bloom.svg",
    badge: "BESTSELLER"
  },
  {
    id: "2",
    name: "Amber Veil",
    price: 899,
    profile: "Warm",
    mood: "A golden, enveloping amber trail.",
    notes: ["Saffron", "Amber", "Vanilla woods"],
    description: "Warm amber and smooth woods create a quietly confident scent with a little glow. An easy signature for cooler nights.",
    image: "images/amber-veil.svg",
    badge: "WARM & SPICED"
  },
  {
    id: "3",
    name: "Citrus Muse",
    price: 899,
    profile: "Fresh",
    mood: "Bright citrus with a clean, airy finish.",
    notes: ["Bergamot", "Neroli", "White musk"],
    description: "A fresh, sunlit opening with a clean finish. Citrus Muse brings an effortless lift to everyday rituals.",
    image: "images/citrus-muse.svg",
    badge: "FRESH PICK"
  },
  {
    id: "4",
    name: "Velvet Oud",
    price: 899,
    profile: "Woody",
    mood: "Smoky woods, softened with velvet warmth.",
    notes: ["Cardamom", "Oud accord", "Cedar"],
    description: "A smooth woody profile with a little spice and a deep, polished finish. Distinctive without trying too hard.",
    image: "images/velvet-oud.svg",
    badge: "DEEP & WOODY"
  },
  {
    id: "5",
    name: "Santal Skin",
    price: 899,
    profile: "Woody",
    mood: "Soft sandalwood that feels like your own.",
    notes: ["Pink pepper", "Sandalwood", "Skin musk"],
    description: "Comforting sandalwood meets a light, skin-close musk. A subtle everyday scent with an intimate finish.",
    image: "images/santal-skin.svg",
    badge: "SKIN SCENT"
  },
  {
    id: "6",
    name: "Rose Afterglow",
    price: 899,
    profile: "Floral",
    mood: "A modern rose with a warm, gentle glow.",
    notes: ["Pink pepper", "Rose petals", "Cashmere woods"],
    description: "Rose petals with a fresh, modern edge, warmed by soft woods. Romantic, but never too sweet.",
    image: "images/rose-afterglow.svg",
    badge: "MODERN FLORAL"
  },
  {
    id: "7",
    name: "Musk Theory",
    price: 899,
    profile: "Musk",
    mood: "Clean musk with a quiet point of view.",
    notes: ["Iris", "Soft musk", "Pale woods"],
    description: "A clean, understated musk that stays close and layers beautifully. Your own scent, with a little more intention.",
    image: "images/musk-theory.svg",
    badge: "EASY TO WEAR"
  },
  {
    id: "8",
    name: "Golden Hour",
    price: 899,
    profile: "Warm",
    mood: "A mellow, sun-warmed scent for every day.",
    notes: ["Mandarin", "Tonka", "Amber woods"],
    description: "The last warmth of the day in a bottle: bright mandarin, mellow tonka, and a soft amber-wood base.",
    image: "images/golden-hour.svg",
    badge: "SUNLIT & SOFT"
  }
];

// Shared settings. Replace the UPI placeholder when your details are ready.
const STORE_CONFIG = {
  name: "VYBEIN",
  whatsappNumber: "916352349485",
  upiId: "your-upi-id@bank",
  currency: "INR",
  price: 899
};
