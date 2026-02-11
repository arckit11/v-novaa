export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    category: string;
    image: string;
    rating: number;
    reviews: number;
    features: string[];
    sizes?: string[];
}

export const categories = [
    'All', 'Gym', 'Yoga', 'Running', 'Wearables', 'Audio', 'Computing', 'Recovery', 'Cardio'
];

export const products: Product[] = [
    // ===== GYM =====
    {
        id: "g1", name: "TitanGrip Adjustable Dumbbells", price: 349.99,
        description: "Replaces 15 sets of weights. Quick-adjust dial system from 5 to 52.5 lbs per hand.",
        category: "Gym",
        image: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=800&auto=format&fit=crop&q=60",
        rating: 4.9, reviews: 187, features: ["5-52.5 lbs", "Quick-Adjust Dial", "Anti-Slip Grip", "Compact"]
    },
    {
        id: "g2", name: "IronForge Kettlebell Pro", price: 79.99,
        description: "Competition-grade cast iron kettlebell with color-coded weight bands and wide handle.",
        category: "Gym",
        image: "https://images.unsplash.com/photo-1517344884509-a4c3e1527cbb?w=800&auto=format&fit=crop&q=60",
        rating: 4.7, reviews: 134, features: ["Cast Iron", "Color-Coded", "Wide Handle", "Flat Base"]
    },
    {
        id: "g3", name: "PowerRack Home Station", price: 699.99,
        description: "Full-size power rack with pull-up bar, safety spotters, and plate storage. Fits standard garage.",
        category: "Gym",
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=60",
        rating: 4.8, reviews: 92, features: ["Pull-Up Bar", "Safety Spotters", "Plate Storage", "700lb Capacity"]
    },
    {
        id: "g4", name: "GripForce Workout Gloves", price: 29.99,
        description: "Premium leather gym gloves with wrist wrap support. Breathable mesh back panel.",
        category: "Gym",
        image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=60",
        rating: 4.5, reviews: 328,
        features: ["Leather Palm", "Wrist Wrap", "Breathable Mesh", "Anti-Slip"],
        sizes: ["S", "M", "L", "XL"]
    },
    {
        id: "g5", name: "EliteForm Weight Belt", price: 59.99,
        description: "Genuine leather lifting belt with double-prong buckle. 4-inch width for maximum support.",
        category: "Gym",
        image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format&fit=crop&q=60",
        rating: 4.8, reviews: 215,
        features: ["Genuine Leather", "Double-Prong", "4-Inch Width", "Break-In Ready"],
        sizes: ["S", "M", "L", "XL", "XXL"]
    },
    // ===== YOGA =====
    {
        id: "y1", name: "ProFlex Yoga Mat", price: 89.99,
        description: "Premium non-slip yoga mat with alignment lines. Extra thick 6mm eco-friendly TPE.",
        category: "Yoga",
        image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop&q=60",
        rating: 4.8, reviews: 312, features: ["Non-Slip", "Alignment Guides", "6mm Thick", "Eco TPE"]
    },
    {
        id: "y2", name: "ZenBlock Cork Yoga Blocks", price: 34.99,
        description: "Set of 2 natural cork yoga blocks. Sustainable, firm grip, and lightweight.",
        category: "Yoga",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=60",
        rating: 4.6, reviews: 189, features: ["Natural Cork", "Set of 2", "Non-Slip", "Lightweight"]
    },
    {
        id: "y3", name: "FlowFit Yoga Leggings", price: 68.99,
        description: "High-waist compression leggings with hidden pocket. 4-way stretch fabric, squat-proof.",
        category: "Yoga",
        image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&auto=format&fit=crop&q=60",
        rating: 4.7, reviews: 456,
        features: ["High-Waist", "4-Way Stretch", "Hidden Pocket", "Squat-Proof"],
        sizes: ["XS", "S", "M", "L", "XL"]
    },
    {
        id: "y4", name: "MindfulMat Meditation Cushion", price: 49.99,
        description: "Buckwheat-filled zafu cushion with removable cover. Promotes proper spine alignment.",
        category: "Yoga",
        image: "https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800&auto=format&fit=crop&q=60",
        rating: 4.5, reviews: 167, features: ["Buckwheat Fill", "Removable Cover", "Spine Alignment", "Washable"]
    },
    // ===== RUNNING =====
    {
        id: "r1", name: "AeroStride Running Shoes", price: 179.99,
        description: "Carbon-plate midsole with elite energy return. Ultra-breathable knit upper.",
        category: "Running",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=60",
        rating: 4.7, reviews: 423,
        features: ["Carbon Plate", "Breathable Knit", "Energy Return", "210g"],
        sizes: ["7", "8", "9", "10", "11", "12"]
    },
    {
        id: "r2", name: "SwiftDry Running Shorts", price: 44.99,
        description: "Lightweight 5-inch shorts with built-in liner and zipper pocket. Moisture-wicking fabric.",
        category: "Running",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=60",
        rating: 4.6, reviews: 287,
        features: ["Built-In Liner", "Zipper Pocket", "Moisture-Wicking", "Reflective"],
        sizes: ["XS", "S", "M", "L", "XL"]
    },
    {
        id: "r3", name: "NightRunner Reflective Jacket", price: 129.99,
        description: "360° reflective running jacket. Waterproof, windproof, and packable into its own pocket.",
        category: "Running",
        image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=60",
        rating: 4.8, reviews: 198,
        features: ["360° Reflective", "Waterproof", "Windproof", "Packable"],
        sizes: ["S", "M", "L", "XL"]
    },
    {
        id: "r4", name: "HydroRun Belt", price: 34.99,
        description: "Bounce-free running belt with two 300ml soft flasks. Fits phones up to 6.7 inches.",
        category: "Running",
        image: "https://images.unsplash.com/photo-1461896836934-bd45ba3a846f?w=800&auto=format&fit=crop&q=60",
        rating: 4.4, reviews: 156, features: ["Bounce-Free", "2x 300ml Flasks", "Phone Pocket", "Adjustable"]
    },
    // ===== WEARABLES =====
    {
        id: "w1", name: "Nova Watch Pro", price: 399.99,
        description: "Medical-grade health tracking. ECG, SpO2, sleep, and workout metrics with always-on display.",
        category: "Wearables",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60",
        rating: 4.9, reviews: 89, features: ["ECG", "Always-On Display", "Water Resistant 50m", "7-Day Battery"]
    },
    {
        id: "w2", name: "PulseBand Fitness Tracker", price: 129.99,
        description: "Slim fitness band with heart rate, sleep tracking, and 14-day battery. Swim-proof.",
        category: "Wearables",
        image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&auto=format&fit=crop&q=60",
        rating: 4.6, reviews: 342, features: ["Heart Rate", "Sleep Tracking", "14-Day Battery", "Swim-Proof"]
    },
    {
        id: "w3", name: "RingFit Smart Ring", price: 249.99,
        description: "Titanium smart ring that tracks sleep, HRV, activity, and body temperature. Ultra-light 4g.",
        category: "Wearables",
        image: "https://images.unsplash.com/photo-1603561596112-0a132b757442?w=800&auto=format&fit=crop&q=60",
        rating: 4.5, reviews: 78,
        features: ["Titanium", "HRV Tracking", "Temp Sensor", "4g Ultra-Light"],
        sizes: ["6", "7", "8", "9", "10", "11"]
    },
    // ===== AUDIO =====
    {
        id: "a1", name: "Nova X-1 Wireless Headphones", price: 299.99,
        description: "Flagship noise-cancelling headphones with 40-hour battery and spatial audio.",
        category: "Audio",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60",
        rating: 4.8, reviews: 124, features: ["ANC", "40h Battery", "Spatial Audio", "Multipoint"]
    },
    {
        id: "a2", name: "Nova Buds Pro", price: 199.99,
        description: "True wireless earbuds with adaptive ANC and transparency mode. IPX5 sweat-proof.",
        category: "Audio",
        image: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=800&auto=format&fit=crop&q=60",
        rating: 4.7, reviews: 267, features: ["Adaptive ANC", "IPX5", "8h + 24h Case", "Wireless Charging"]
    },
    // ===== COMPUTING =====
    {
        id: "c1", name: "Nova Book Air", price: 1299.99,
        description: "Our thinnest laptop ever. N1 chip, Liquid Retina display, silent fanless design.",
        category: "Computing",
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=60",
        rating: 4.7, reviews: 256, features: ["N1 Chip", "Liquid Retina", "Fanless", "18h Battery"]
    },
    {
        id: "c2", name: "Nova Vision Pro", price: 3499.00,
        description: "Spatial computing headset with 4K Micro-OLED, eye tracking, and hand gesture control.",
        category: "Computing",
        image: "https://images.unsplash.com/photo-1626379961369-7f28d8cbca01?w=800&auto=format&fit=crop&q=60",
        rating: 4.6, reviews: 42, features: ["4K Micro-OLED", "Eye Tracking", "Hand Gestures", "Passthrough"]
    },
    // ===== RECOVERY =====
    {
        id: "rc1", name: "ZenFlow Foam Roller", price: 39.99,
        description: "Dual-zone texture deep tissue roller. High-density EVA for trigger point relief.",
        category: "Recovery",
        image: "https://images.unsplash.com/photo-1620188526357-df97e28e42c6?w=800&auto=format&fit=crop&q=60",
        rating: 4.5, reviews: 267, features: ["Dual-Zone", "High-Density EVA", "Trigger Points", "45cm"]
    },
    {
        id: "rc2", name: "ThermaGun Massage Gun", price: 199.99,
        description: "Percussion massage device with 5 speed settings and 4 interchangeable heads. Ultra-quiet.",
        category: "Recovery",
        image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=60",
        rating: 4.8, reviews: 412, features: ["5 Speeds", "4 Heads", "Ultra-Quiet", "3h Battery"]
    },
    // ===== CARDIO =====
    {
        id: "cd1", name: "PulseFit Smart Jump Rope", price: 69.99,
        description: "Built-in sensors count jumps, calories, and duration. Syncs with your phone.",
        category: "Cardio",
        image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop&q=60",
        rating: 4.4, reviews: 198, features: ["Digital Counter", "Calorie Tracking", "Adjustable", "App Sync"]
    },
    {
        id: "cd2", name: "FlexPower Resistance Bands Set", price: 49.99,
        description: "5 resistance levels from light to extra heavy. Perfect for home workouts and rehab.",
        category: "Cardio",
        image: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&auto=format&fit=crop&q=60",
        rating: 4.6, reviews: 534, features: ["5 Levels", "Latex-Free", "Carry Bag", "Door Anchor"]
    },
];
