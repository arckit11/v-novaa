import { useState, useEffect, useRef, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { products, categories } from '../data/products';

const VAPI_KEY = import.meta.env.VITE_VAPI_API_KEY as string | undefined;
const ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID as string | undefined;
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

/** True singleton — persists across HMR via window */
function getVapi(): Vapi | null {
    if (!VAPI_KEY) return null;
    const w = window as any;
    if (!w.__vnova_vapi) {
        w.__vnova_vapi = new Vapi(VAPI_KEY);
    }
    return w.__vnova_vapi;
}

// ─── Gemini direct call (frontend only) ───
const productList = products.map(p => `${p.id}: ${p.name} (${p.category})`).join('\n');
const catList = categories.filter(c => c !== 'All').join(', ');

const SYSTEM_PROMPT = `You are a voice command classifier for V-Novaa e-commerce store.
Given a user's voice transcript, classify their intent and extract parameters.

Categories: ${catList}
Products:
${productList}

Return ONLY a JSON object with one of these action types:
1. Navigate: {"action":"navigate","route":"/products?category=Gym","label":"Showing Gym products"}
   Routes: / (home), /products (all), /products?category=X, /product/ID, /cart, /checkout
2. Add to cart: {"action":"add_to_cart","productId":"g1","label":"Added Dumbbells"}
3. Fill checkout field: {"action":"fill_field","field":"firstName","value":"John","label":"Name: John"}
   Fields: firstName, lastName, email, phone, address, city, zip, cardNumber, cardExpiry, cardCVC
4. Submit order: {"action":"submit_order","label":"Placing order"}
5. Select size: {"action":"select_size","size":"M","label":"Size M"}
   Sizes: XS, S, M, L, XL, XXL, 6, 7, 8, 9, 10, 11
6. Add current item: {"action":"add_current_item","label":"Adding to cart"} (Use this if user says "add this" or "add to cart" without product name)
7. No match: {"action":"none","label":""}
Return ONLY valid JSON, no markdown.`;

async function callGemini(transcript: string): Promise<any> {
    if (!GEMINI_KEY) return null;

    // Try models in order: 2.5-flash (primary), 2.0-flash (fallback)
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];

    for (const model of models) {
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                        contents: [{ parts: [{ text: `User said: "${transcript}"` }] }],
                        generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
                    }),
                }
            );

            // If rate limited (429), try next model
            if (res.status === 429) {
                console.warn(`[Gemini] ${model} rate limited, trying next...`);
                continue;
            }
            if (!res.ok) return null;

            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            const m = text.match(/\{[\s\S]*\}/);
            if (!m) return null;
            const parsed = JSON.parse(m[0]);
            console.log(`[Gemini] ${model} classified:`, parsed);
            return parsed.action === 'none' ? null : parsed;
        } catch {
            continue;
        }
    }
    return null;
}

// ─── Regex fallback ───
// ─── Regex fallback ───
function regexFallback(text: string) {
    const lower = text.toLowerCase();

    // ── Field filling FIRST (so "card number" doesn't trigger cart) ──
    const fields: [RegExp, string, string][] = [
        [/(?:my )?(?:first )?name is (.+)/i, 'firstName', 'Name'],
        [/(?:my )?last name is (.+)/i, 'lastName', 'Last name'],
        [/(?:my )?email is (.+)/i, 'email', 'Email'],
        [/(?:my )?phone (?:number )?is (.+)/i, 'phone', 'Phone'],
        [/(?:my )?address is (.+)/i, 'address', 'Address'],
        [/(?:my )?city is (.+)/i, 'city', 'City'],
        [/(?:my )?zip (?:code )?is (.+)/i, 'zip', 'ZIP'],
        [/(?:my )?card (?:number )?is (.+)/i, 'cardNumber', 'Card'],
        [/expir(?:y|ation) (?:date )?is (.+)/i, 'cardExpiry', 'Expiry'],
        [/(?:cvc|cvv|security ?code) is (.+)/i, 'cardCVC', 'CVC'],
    ];
    for (const [rx, field, label] of fields) {
        const m = text.match(rx);
        if (m) return { action: 'fill_field', field, value: m[1].trim(), label: `${label}: ${m[1].trim()}` };
    }

    // Size selection
    if (lower.includes('size')) {
        const sizes = ['xs', 'small', 'medium', 'large', 'xl', 'xxl', '6', '7', '8', '9', '10', '11', 's', 'm', 'l'];
        for (const s of sizes) {
            // Match "size M", "size medium", "medium size"
            // Split by space to avoid matching "small" inside "smaller"
            const words = lower.split(/\s+/);
            if (words.includes(s) || lower.includes(`size ${s}`) || lower.includes(`${s} size`)) {
                let val = s.toUpperCase();
                if (s === 'small') val = 'S';
                if (s === 'medium') val = 'M';
                if (s === 'large') val = 'L';
                return { action: 'select_size', size: val, label: `Size ${val}` };
            }
        }
    }

    if (lower.includes('place order') || lower.includes('confirm order') || lower.includes('submit'))
        return { action: 'submit_order', label: 'Placing order' };

    // ── Navigation ──
    if (lower.includes('go home') || lower.includes('home page')) return { action: 'navigate', route: '/', label: 'Going home' };

    // "cart" or "card" — but NOT if followed by form words (number, details, expiry, cvc)
    const isCardForm = lower.includes('card') && (lower.includes('number') || lower.includes('detail') || lower.includes('expir') || lower.includes('cvc') || lower.includes('cvv'));
    if (!isCardForm && (lower.includes('cart') || lower.includes('card')) && (lower.includes('go') || lower.includes('open') || lower.includes('show') || lower.includes('view') || lower.includes('my')))
        return { action: 'navigate', route: '/cart', label: 'Opening cart' };

    // Categories — check BEFORE checkout so "proceed to gym" doesn't trigger checkout
    const cats: Record<string, string> = { gym: 'Gym', yoga: 'Yoga', running: 'Running', wearable: 'Wearables', audio: 'Audio', computing: 'Computing', recovery: 'Recovery', cardio: 'Cardio' };
    for (const [kw, cat] of Object.entries(cats)) {
        if (lower.includes(kw)) return { action: 'navigate', route: `/products?category=${cat}`, label: `Showing ${cat}` };
    }

    // Checkout — strict
    if (lower.includes('checkout') || lower.includes('check out') ||
        (lower.includes('proceed') && (lower.includes('checkout') || lower.includes('payment') || lower.includes('order') || lower.includes('buy'))))
        return { action: 'navigate', route: '/checkout', label: 'Opening checkout' };

    // Context-aware "Add to cart"
    if (lower.includes('add') && (lower.includes('cart') || lower.includes('bag') || lower.includes('this'))) {
        return { action: 'add_current_item', label: 'Adding to cart' };
    }

    if ((lower.includes('all') || lower.includes('everything')) && lower.includes('product'))
        return { action: 'navigate', route: '/products', label: 'All products' };

    for (const p of products) {
        const pName = p.name.toLowerCase();
        const lastWord = pName.split(' ').pop() || '';
        if (lower.includes(pName) || (lastWord.length > 3 && lower.includes(lastWord))) {
            if (lower.includes('add') || lower.includes('buy'))
                return { action: 'add_to_cart', productId: p.id, label: `Added ${p.name}` };
            return { action: 'navigate', route: `/product/${p.id}`, label: `Showing ${p.name}` };
        }
    }

    return null;
}

export const VoiceAssistant = () => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'speaking' | 'processing' | 'blocked' | 'error'>('idle');
    const [subtitle, setSubtitle] = useState('Click to start');
    const navigateRef = useRef(useNavigate());
    const addItemRef = useRef(useCart().addItem);
    const blockedRef = useRef(false);

    const nav = useNavigate();
    const { addItem } = useCart();
    useEffect(() => { navigateRef.current = nav; }, [nav]);
    useEffect(() => { addItemRef.current = addItem; }, [addItem]);

    const executeAction = useCallback((result: any) => {
        switch (result.action) {
            case 'navigate':
                if (result.route) navigateRef.current(result.route);
                break;
            case 'add_to_cart': {
                const p = products.find(x => x.id === result.productId);
                if (p) addItemRef.current(p);
                break;
            }
            case 'fill_field':
                if (result.field && result.value)
                    window.dispatchEvent(new CustomEvent('voice-fill', { detail: { field: result.field, value: result.value } }));
                break;
            case 'submit_order':
                window.dispatchEvent(new CustomEvent('voice-submit'));
                break;
            case 'select_size':
                if (result.size)
                    window.dispatchEvent(new CustomEvent('voice-select-size', { detail: { size: result.size } }));
                break;
            case 'add_current_item':
                window.dispatchEvent(new CustomEvent('voice-add-current'));
                break;
        }
    }, []);

    // Filler words to skip — don't burn API calls on "hello" or "yeah"
    const FILLER = new Set(['hello', 'hi', 'hey', 'yeah', 'yes', 'no', 'okay', 'ok', 'um', 'uh', 'hmm', 'huh', 'thanks', 'thank you', 'bye', 'goodbye']);
    const lastGeminiCall = useRef(0);

    const processCommand = useCallback(async (transcript: string) => {
        const trimmed = transcript.trim();
        const wordCount = trimmed.split(/\s+/).length;

        // Skip filler and very short transcripts
        if (wordCount < 2 || FILLER.has(trimmed.toLowerCase())) {
            console.log('[Voice] Skipping filler:', trimmed);
            setSubtitle(`"${trimmed}" — listening...`);
            setTimeout(() => setSubtitle('Listening...'), 1500);
            return;
        }

        setStatus('processing');

        // 1. Try regex FIRST (free, instant) — handles most commands
        const regex = regexFallback(transcript);
        if (regex) {
            console.log('[Voice] Regex →', regex.action, regex.label);
            setSubtitle(regex.label);
            executeAction(regex);
            setTimeout(() => { setSubtitle('Listening...'); setStatus('active'); }, 2500);
            return;
        }

        // 2. Gemini only if regex didn't match — with 2s cooldown to avoid 429
        const now = Date.now();
        if (now - lastGeminiCall.current < 2000) {
            console.log('[Voice] Gemini cooldown, skipping');
            setSubtitle(`"${trimmed.slice(0, 30)}..." — try again`);
            setTimeout(() => { setSubtitle('Listening...'); setStatus('active'); }, 2000);
            return;
        }

        setSubtitle('🧠 Processing...');
        lastGeminiCall.current = now;

        const gemini = await callGemini(transcript);
        if (gemini) {
            console.log('[Voice] Gemini →', gemini.action, gemini.label);
            setSubtitle(`✨ ${gemini.label}`);
            executeAction(gemini);
            setTimeout(() => { setSubtitle('Listening...'); setStatus('active'); }, 2500);
            return;
        }

        setSubtitle(`"${trimmed.slice(0, 35)}..."`);
        setTimeout(() => { setSubtitle('Listening...'); setStatus('active'); }, 2000);
    }, [executeAction]);

    useEffect(() => {
        const vapi = getVapi();
        if (!vapi || !ASSISTANT_ID) {
            setStatus('error');
            setSubtitle(VAPI_KEY ? 'Missing Assistant ID' : 'Missing Vapi API Key');
            return;
        }

        // Auto-start on mount
        const autoStart = () => {
            setStatus('connecting');
            setSubtitle('Connecting...');
            vapi.start(ASSISTANT_ID!).catch((err: unknown) => {
                console.error('[Voice] Auto-start failed:', err);
                setStatus('error');
                setSubtitle('Click to start');
            });
        };
        autoStart();

        const onCallStart = () => {
            setStatus('active');
            setSubtitle('Listening...');
        };

        const onCallEnd = () => {
            // Don't reconnect if blocked by daily limit
            if (blockedRef.current) return;
            // Auto-reconnect after 1 second to stay always listening
            setStatus('connecting');
            setSubtitle('Reconnecting...');
            setTimeout(() => {
                if (blockedRef.current) return;
                vapi.start(ASSISTANT_ID!).catch(() => {
                    setStatus('idle');
                    setSubtitle('Click to reconnect');
                });
            }, 1000);
        };

        const onSpeechStart = () => setStatus('speaking');
        const onSpeechEnd = () => setStatus('active');

        const onMessage = (msg: any) => {
            if (msg.type === 'transcript' && msg.role === 'user' && msg.transcriptType === 'final') {
                console.log('[Voice] Heard:', msg.transcript);
                processCommand(msg.transcript);
            }
            if (msg.type === 'transcript' && msg.role === 'assistant' && msg.transcriptType === 'final') {
                setSubtitle(msg.transcript);
            }
        };

        const onError = (error: any) => {
            console.error('[Voice] Vapi error:', error);

            // Detect daily limit / wallet errors — don't retry these
            const errType = error?.type || '';
            const errMsg = error?.error?.message?.message
                || error?.error?.message
                || error?.message
                || '';
            const errStr = typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg);

            if (errType === 'daily-error' || errStr.toLowerCase().includes('wallet') || errStr.toLowerCase().includes('daily')) {
                blockedRef.current = true;
                setStatus('blocked');
                setSubtitle('⚠️ Daily limit reached — resets tomorrow');
                return;
            }

            setStatus('error');
            setSubtitle('Error — click to retry');
        };

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);
        vapi.on('message', onMessage);
        vapi.on('error', onError);

        return () => {
            vapi.removeListener('call-start', onCallStart);
            vapi.removeListener('call-end', onCallEnd);
            vapi.removeListener('speech-start', onSpeechStart);
            vapi.removeListener('speech-end', onSpeechEnd);
            vapi.removeListener('message', onMessage);
            vapi.removeListener('error', onError);
        };
    }, []);

    const handleClick = () => {
        const vapi = getVapi();
        if (!vapi || !ASSISTANT_ID) return;

        // Don't retry if daily limit reached
        if (status === 'blocked') return;

        // Stop if active
        if (status === 'active' || status === 'speaking' || status === 'connecting' || status === 'processing') {
            vapi.stop();
            setStatus('idle');
            setSubtitle('Stopped — click to start');
            return;
        }

        // Start
        setStatus('connecting');
        setSubtitle('Connecting...');

        vapi.start(ASSISTANT_ID).catch((err: unknown) => {
            console.error('[Voice] Start failed:', err);
            setStatus('error');
            setSubtitle('Failed — click to retry');
        });
    };

    const colors: Record<string, string> = {
        idle: '#6b7280', connecting: '#f59e0b', active: '#22c55e',
        speaking: '#3b82f6', processing: '#f59e0b', blocked: '#ef4444', error: '#ef4444',
    };
    const dotColor = colors[status] || '#6b7280';

    return (
        <button
            onClick={handleClick}
            style={{
                position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 18px 10px 14px',
                background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
                borderRadius: 100, border: `1px solid ${status === 'active' ? 'rgba(34,197,94,0.4)' : 'var(--border-card)'}`,
                cursor: status === 'blocked' ? 'not-allowed' : 'pointer',
                color: 'white', fontFamily: 'var(--font)',
                animation: 'fadeUp 0.4s ease', transition: 'border-color 0.3s',
            }}
        >
            <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: dotColor, flexShrink: 0,
                boxShadow: `0 0 8px ${dotColor}`,
                animation: status === 'active' ? 'dot-pulse 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {subtitle}
            </span>
            <style>{`@keyframes dot-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }`}</style>
        </button>
    );
};
