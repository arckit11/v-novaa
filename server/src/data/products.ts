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

export const products: Product[] = [
    { id: "g1", name: "TitanGrip Adjustable Dumbbells", price: 349.99, description: "Replaces 15 sets of weights. Quick-adjust dial system from 5 to 52.5 lbs per hand.", category: "Gym", image: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=800&auto=format&fit=crop&q=60", rating: 4.9, reviews: 187, features: ["5-52.5 lbs", "Quick-Adjust Dial", "Anti-Slip Grip", "Compact"] },
    { id: "g2", name: "IronForge Kettlebell Pro", price: 79.99, description: "Competition-grade cast iron kettlebell with color-coded weight bands.", category: "Gym", image: "https://images.unsplash.com/photo-1517344884509-a4c3e1527cbb?w=800&auto=format&fit=crop&q=60", rating: 4.7, reviews: 134, features: ["Cast Iron", "Color-Coded", "Wide Handle", "Flat Base"] },
    { id: "g3", name: "PowerRack Home Station", price: 699.99, description: "Full-size power rack with pull-up bar, safety spotters, and plate storage.", category: "Gym", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=60", rating: 4.8, reviews: 92, features: ["Pull-Up Bar", "Safety Spotters", "Plate Storage", "700lb Capacity"] },
    { id: "g4", name: "GripForce Workout Gloves", price: 29.99, description: "Premium leather gym gloves with wrist wrap support.", category: "Gym", image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=60", rating: 4.5, reviews: 328, features: ["Leather Palm", "Wrist Wrap", "Breathable Mesh", "Anti-Slip"], sizes: ["S", "M", "L", "XL"] },
    { id: "g5", name: "EliteForm Weight Belt", price: 59.99, description: "Genuine leather lifting belt with double-prong buckle.", category: "Gym", image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format&fit=crop&q=60", rating: 4.8, reviews: 215, features: ["Genuine Leather", "Double-Prong", "4-Inch Width", "Break-In Ready"], sizes: ["S", "M", "L", "XL", "XXL"] },
    { id: "y1", name: "ProFlex Yoga Mat", price: 89.99, description: "Premium non-slip yoga mat with alignment lines.", category: "Yoga", image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop&q=60", rating: 4.8, reviews: 312, features: ["Non-Slip", "Alignment Guides", "6mm Thick", "Eco TPE"] },
    { id: "y2", name: "ZenBlock Cork Yoga Blocks", price: 34.99, description: "Set of 2 natural cork yoga blocks.", category: "Yoga", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=60", rating: 4.6, reviews: 189, features: ["Natural Cork", "Set of 2", "Non-Slip", "Lightweight"] },
    { id: "y3", name: "FlowFit Yoga Leggings", price: 68.99, description: "High-waist compression leggings with hidden pocket.", category: "Yoga", image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&auto=format&fit=crop&q=60", rating: 4.7, reviews: 456, features: ["High-Waist", "4-Way Stretch", "Hidden Pocket", "Squat-Proof"], sizes: ["XS", "S", "M", "L", "XL"] },
    { id: "r1", name: "AeroStride Running Shoes", price: 179.99, description: "Carbon-plate midsole with elite energy return.", category: "Running", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=60", rating: 4.7, reviews: 423, features: ["Carbon Plate", "Breathable Knit", "Energy Return", "210g"], sizes: ["7", "8", "9", "10", "11", "12"] },
    { id: "r2", name: "SwiftDry Running Shorts", price: 44.99, description: "Lightweight 5-inch shorts with built-in liner.", category: "Running", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=60", rating: 4.6, reviews: 287, features: ["Built-In Liner", "Zipper Pocket", "Moisture-Wicking", "Reflective"], sizes: ["XS", "S", "M", "L", "XL"] },
    { id: "w1", name: "Nova Watch Pro", price: 399.99, description: "Medical-grade health tracking with always-on display.", category: "Wearables", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60", rating: 4.9, reviews: 89, features: ["ECG", "Always-On Display", "Water Resistant 50m", "7-Day Battery"] },
    { id: "w2", name: "PulseBand Fitness Tracker", price: 129.99, description: "Slim fitness band with heart rate and 14-day battery.", category: "Wearables", image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&auto=format&fit=crop&q=60", rating: 4.6, reviews: 342, features: ["Heart Rate", "Sleep Tracking", "14-Day Battery", "Swim-Proof"] },
    { id: "a1", name: "Nova X-1 Wireless Headphones", price: 299.99, description: "Flagship noise-cancelling headphones with spatial audio.", category: "Audio", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60", rating: 4.8, reviews: 124, features: ["ANC", "40h Battery", "Spatial Audio", "Multipoint"] },
    { id: "c1", name: "Nova Book Air", price: 1299.99, description: "Our thinnest laptop ever with N1 chip.", category: "Computing", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=60", rating: 4.7, reviews: 256, features: ["N1 Chip", "Liquid Retina", "Fanless", "18h Battery"] },
    { id: "rc2", name: "ThermaGun Massage Gun", price: 199.99, description: "Percussion massage device with 5 speeds and 4 heads.", category: "Recovery", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=60", rating: 4.8, reviews: 412, features: ["5 Speeds", "4 Heads", "Ultra-Quiet", "3h Battery"] },
    { id: "cd1", name: "PulseFit Smart Jump Rope", price: 69.99, description: "Built-in sensors count jumps, calories, and duration.", category: "Cardio", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop&q=60", rating: 4.4, reviews: 198, features: ["Digital Counter", "Calorie Tracking", "Adjustable", "App Sync"] },
];

export const categories = ['All', 'Gym', 'Yoga', 'Running', 'Wearables', 'Audio', 'Computing', 'Recovery', 'Cardio'];
