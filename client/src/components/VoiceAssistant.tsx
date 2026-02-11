import { useState, useEffect, useRef, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { products } from '../data/products';

const VAPI_KEY = import.meta.env.VITE_VAPI_API_KEY as string | undefined;
const ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID;

// ─── Singleton for Vapi ───
declare global {
    interface Window {
        __vnova_vapi: any;
    }
}
function getVapiInstance() {
    if (!VAPI_KEY) return null;
    const w = window as any;
    if (!w.__vnova_vapi) {
        w.__vnova_vapi = new Vapi(VAPI_KEY);
    }
    return w.__vnova_vapi;
}

// ─── Regex fallback ───
// ─── Regex fallback ───
// ─── Regex fallback ───
// ─── Regex fallback ───
function regexFallback(text: string): any[] | null {
    const lower = text.toLowerCase();
    const actions: any[] = [];

    // ── Field filling (collect ALL matches) ──
    const fields: [RegExp, string, string][] = [
        [/(?:my )?(?:first )?name (?:is )?(.+?)(?:$| and|,\s|;)/i, 'firstName', 'Name'],
        [/(?:my )?last name (?:is )?(.+?)(?:$| and|,\s|;)/i, 'lastName', 'Last name'],
        [/(?:my )?email (?:is )?(.+?)(?:$| and|,\s|;)/i, 'email', 'Email'],
        [/(?:my )?phone (?:number )?(?:is )?(.+?)(?:$| and|,\s|;)/i, 'phone', 'Phone'],
        [/(?:my )?(?:street )?address (?:is )?(.+?)(?:$| and|,\s|;)/i, 'address', 'Address'],
        [/(?:my )?city (?:is )?(.+?)(?:$| and|,\s|;)/i, 'city', 'City'],
        [/(?:my )?zip(?: ?code)? (?:is )?(.+?)(?:$| and|,\s|;)/i, 'zip', 'ZIP'],
        [/(?:my )?card (?:number )?(?:is )?(.+?)(?:$| and|,\s|;)/i, 'cardNumber', 'Card'],
        [/expir(?:y|ation) (?:date )?(?:is )?(.+?)(?:$| and|,\s|;)/i, 'cardExpiry', 'Expiry'],
        [/(?:cvc|cvv|security ?code) (?:is )?(.+?)(?:$| and|,\s|;)/i, 'cardCVC', 'CVC'],
    ];

    for (const [rx, field, label] of fields) {
        const m = text.match(rx);
        if (m) {
            actions.push({ action: 'fill_field', field, value: m[1].trim(), label: `${label}: ${m[1].trim()}` });
        }
    }

    // Size selection
    if (lower.includes('size')) {
        const sizes = ['xs', 'small', 'medium', 'large', 'xl', 'xxl', '6', '7', '8', '9', '10', '11', 's', 'm', 'l'];
        for (const s of sizes) {
            const words = lower.split(/\s+/);
            if (words.includes(s) || lower.includes(`size ${s}`) || lower.includes(`${s} size`)) {
                let val = s.toUpperCase();
                if (s === 'small') val = 'S';
                if (s === 'medium') val = 'M';
                if (s === 'large') val = 'L';
                actions.push({ action: 'select_size', size: val, label: `Size ${val}` });
                break; // Only select one size
            }
        }
    }

    // Continue to payment / Submit order
    if (lower.includes('continue') && (lower.includes('payment') || lower.includes('step') || lower.includes('next')))
        actions.push({ action: 'submit_order', label: 'Continuing...' });
    else if (lower.includes('place order') || lower.includes('confirm order') || lower.includes('submit') || lower.includes('complete order') || lower.includes('finish order') || lower.includes('pay now') || lower === 'pay')
        actions.push({ action: 'submit_order', label: 'Placing order' });

    // Quantity & Removal
    if (lower.includes('remove') || lower.includes('delete')) {
        const m = lower.match(/(?:remove|delete) (?:the )?(.+)/);
        if (m) actions.push({ action: 'remove_item', product: m[1], label: `Removing ${m[1]}` });
    }
    else if (lower.includes('increase') || lower.includes('add more')) {
        const m = lower.match(/(?:increase|add more) (?:quantity of )?(.+)/);
        if (m) actions.push({ action: 'increase_quantity', product: m[1], label: `Increasing ${m[1]}` });
    }
    else if (lower.includes('decrease') || lower.includes('reduce')) {
        const m = lower.match(/(?:decrease|reduce) (?:quantity of )?(.+)/);
        if (m) actions.push({ action: 'decrease_quantity', product: m[1], label: `Decreasing ${m[1]}` });
    }

    // ── Navigation (only if no other actions, to avoid jumping away while filling) ──
    if (actions.length === 0) {
        if (lower.includes('go home') || lower.includes('home page')) return [{ action: 'navigate', route: '/', label: 'Going home' }];

        // "cart" or "card"
        const isCardForm = lower.includes('card') && (lower.includes('number') || lower.includes('detail') || lower.includes('expir') || lower.includes('cvc') || lower.includes('cvv'));
        if (!isCardForm && (lower.includes('cart') || lower.includes('card')) && (lower.includes('go') || lower.includes('open') || lower.includes('show') || lower.includes('view') || lower.includes('my')))
            return [{ action: 'navigate', route: '/cart', label: 'Opening cart' }];

        // Categories
        const cats: Record<string, string> = { gym: 'Gym', yoga: 'Yoga', running: 'Running', wearable: 'Wearables', audio: 'Audio', computing: 'Computing', recovery: 'Recovery', cardio: 'Cardio' };
        for (const [kw, cat] of Object.entries(cats)) {
            if (lower.includes(kw)) return [{ action: 'navigate', route: `/products?category=${cat}`, label: `Showing ${cat}` }];
        }

        // Checkout
        if (lower.includes('checkout') || lower.includes('check out') ||
            (lower.includes('proceed') && (lower.includes('checkout') || lower.includes('payment') || lower.includes('order') || lower.includes('buy'))))
            return [{ action: 'navigate', route: '/checkout', label: 'Opening checkout' }];

        // Add to cart (context)
        if (lower.includes('add') && (lower.includes('cart') || lower.includes('bag') || lower.includes('this'))) {
            return [{ action: 'add_current_item', label: 'Adding to cart' }];
        }

        // Products
        if ((lower.includes('all') || lower.includes('everything')) && lower.includes('product'))
            return [{ action: 'navigate', route: '/products', label: 'All products' }];

        for (const p of products) {
            const pName = p.name.toLowerCase();
            const lastWord = pName.split(' ').pop() || '';
            if (lower.includes(pName) || (lastWord.length > 3 && lower.includes(lastWord))) {
                if (lower.includes('add') || lower.includes('buy'))
                    return [{ action: 'add_to_cart', productId: p.id, label: `Added ${p.name}` }];
                return [{ action: 'navigate', route: `/product/${p.id}`, label: `Showing ${p.name}` }];
            }
        }
    }

    return actions.length > 0 ? actions : null;
}

export const VoiceAssistant = () => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'speaking' | 'processing' | 'blocked' | 'error'>('idle');
    const [subtitle, setSubtitle] = useState('Click to start');

    const nav = useNavigate();
    const { addItem, items, updateQuantity, removeItem } = useCart();

    const navigateRef = useRef(nav);
    const addItemRef = useRef(addItem);
    const cartRef = useRef(items);
    const updateQtyRef = useRef(updateQuantity);
    const removeItemRef = useRef(removeItem);
    const blockedRef = useRef(false);

    useEffect(() => { navigateRef.current = nav; }, [nav]);
    useEffect(() => { addItemRef.current = addItem; }, [addItem]);
    useEffect(() => { cartRef.current = items; }, [items]);
    useEffect(() => { updateQtyRef.current = updateQuantity; }, [updateQuantity]);
    useEffect(() => { removeItemRef.current = removeItem; }, [removeItem]);

    const executeAction = useCallback((result: any) => {
        switch (result.action) {
            case 'navigate':
                if (result.route) {
                    setSubtitle(`Navigating to ${result.label.replace('Showing ', '').replace('Opening ', '')}...`);
                    setTimeout(() => {
                        navigateRef.current(result.route);
                    }, 2500); // Delay navigation to let Vapi speak
                }
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
            case 'increase_quantity':
            case 'decrease_quantity':
            case 'remove_item': {
                const term = result.product?.toLowerCase();
                if (!term) return;
                const match = cartRef.current.find(i => i.name.toLowerCase().includes(term));
                if (match) {
                    if (result.action === 'remove_item') {
                        removeItemRef.current(match.id, match.size);
                    } else {
                        const newQty = result.action === 'increase_quantity' ? match.quantity + 1 : match.quantity - 1;
                        updateQtyRef.current(match.id, newQty, match.size);
                    }
                }
                break;
            }
        }
    }, []);

    // Filler words to skip — don't burn processing on "hello" or "yeah"
    const FILLER = new Set(['hello', 'hi', 'hey', 'yeah', 'yes', 'no', 'okay', 'ok', 'um', 'uh', 'hmm', 'huh', 'thanks', 'thank you', 'bye', 'goodbye']);

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

        // Regex engine (now PRIMARY and ONLY handler)
        const actions = regexFallback(transcript);
        if (actions && Array.isArray(actions)) {
            console.log('[Voice] Regex Actions →', actions.length);
            setSubtitle(`Matched ${actions.length} actions`);
            actions.forEach(action => executeAction(action));
            setTimeout(() => { setSubtitle('Listening...'); setStatus('active'); }, 2500);
            return;
        }

        // No match
        setSubtitle(`"${trimmed.slice(0, 35)}..."`);
        setTimeout(() => { setSubtitle('Listening...'); setStatus('active'); }, 2000);
    }, [executeAction]);

    useEffect(() => {
        const vapi = getVapiInstance();
        if (!vapi || !ASSISTANT_ID) {
            setStatus('error');
            setSubtitle('Missing Assistant ID');
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
        const vapi = getVapiInstance();
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
