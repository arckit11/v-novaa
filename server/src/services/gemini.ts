import { GoogleGenAI } from '@google/genai';
import { products, categories } from '../data/products.js';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

// Build product names list for the prompt
const productList = products.map(p => `${p.id}: ${p.name} (${p.category})`).join('\n');
const categoryList = categories.filter(c => c !== 'All').join(', ');

const SYSTEM_PROMPT = `You are a voice command classifier for V-Novaa e-commerce store.

Given a user's voice transcript, classify their intent and extract parameters.

Available categories: ${categoryList}

Available products:
${productList}

Return a JSON object with ONE of these action types:

1. Navigate to a page:
   {"action":"navigate","route":"/","label":"Going home"}
   {"action":"navigate","route":"/products","label":"Showing all products"}
   {"action":"navigate","route":"/products?category=Gym","label":"Showing Gym products"}
   {"action":"navigate","route":"/product/g1","label":"Showing TitanGrip Dumbbells"}
   {"action":"navigate","route":"/cart","label":"Opening cart"}
   {"action":"navigate","route":"/checkout","label":"Opening checkout"}

2. Add product to cart:
   {"action":"add_to_cart","productId":"g1","label":"Added TitanGrip Dumbbells to cart"}

3. Fill a checkout form field:
   {"action":"fill_field","field":"firstName","value":"John","label":"First name set to John"}
   Fields: firstName, lastName, email, phone, address, city, zip, cardNumber, cardExpiry, cardCVC

4. Submit the order:
   {"action":"submit_order","label":"Placing order"}

5. No actionable intent found:
   {"action":"none","label":""}

RULES:
- If user says a product name (even partially), match to the closest product by name.
- If user mentions a category, navigate to that category's product listing.
- If user says "go home", "home page", navigate to "/".
- If user says "cart", "my cart", "view cart", navigate to "/cart".
- If user says "checkout", "proceed", "pay", navigate to "/checkout".
- If user says "add [product]" or "buy [product]", use add_to_cart.
- If user says "my name is X", "email is X", etc., use fill_field.
- If user says "place order", "confirm", "submit", use submit_order.
- Return ONLY the JSON, no markdown, no explanation.`;

export interface VoiceAction {
    action: 'navigate' | 'add_to_cart' | 'fill_field' | 'submit_order' | 'none';
    route?: string;
    productId?: string;
    field?: string;
    value?: string;
    label: string;
}

export async function classifyVoiceCommand(transcript: string): Promise<VoiceAction> {
    if (!GEMINI_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `User said: "${transcript}"`,
        config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.1,
            maxOutputTokens: 200,
        },
    });

    const text = response.text?.trim() || '';

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        jsonStr = jsonMatch[0];
    }

    try {
        const parsed = JSON.parse(jsonStr) as VoiceAction;
        return parsed;
    } catch {
        console.error('[Gemini] Failed to parse:', text);
        return { action: 'none', label: '' };
    }
}
