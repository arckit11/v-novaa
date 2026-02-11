import { useState, useEffect, useRef, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

interface CheckoutForm {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
    cardNumber: string;
    cardExpiry: string;
    cardCVC: string;
}

const emptyForm: CheckoutForm = {
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', zip: '',
    cardNumber: '', cardExpiry: '', cardCVC: '',
};

// Detect card brand from first digits
function detectBrand(num: string): { brand: string; icon: string } {
    const n = num.replace(/\s/g, '');
    if (/^4/.test(n)) return { brand: 'Visa', icon: '💳' };
    if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return { brand: 'Mastercard', icon: '🔴' };
    if (/^3[47]/.test(n)) return { brand: 'Amex', icon: '🟦' };
    if (/^6(?:011|5)/.test(n)) return { brand: 'Discover', icon: '🟡' };
    return { brand: '', icon: '💳' };
}

// Format card number with spaces every 4 digits
function formatCardNumber(val: string): string {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
}

// Format expiry as MM/YY
function formatExpiry(val: string): string {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const Checkout = () => {
    const { items, subtotal, clearCart } = useCart();
    const navigate = useNavigate();
    const [form, setForm] = useState<CheckoutForm>(emptyForm);
    const [errors, setErrors] = useState<Partial<CheckoutForm>>({});
    const [processing, setProcessing] = useState(false);
    const [step, setStep] = useState<1 | 2>(1); // 1 = personal, 2 = payment
    const formRef = useRef<HTMLFormElement>(null);

    const update = useCallback((field: keyof CheckoutForm, value: string) => {
        let formatted = value;
        if (field === 'cardNumber') formatted = formatCardNumber(value);
        if (field === 'cardExpiry') formatted = formatExpiry(value);
        if (field === 'cardCVC') formatted = value.replace(/\D/g, '').slice(0, 4);
        setForm(prev => ({ ...prev, [field]: formatted }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    }, []);

    // Voice integration
    useEffect(() => {
        const handleFill = (e: Event) => {
            const { field, value } = (e as CustomEvent).detail;
            console.log('[Checkout] Voice fill:', field, value); // Debug log
            if (field in emptyForm) update(field as keyof CheckoutForm, value);
        };
        const handleSubmit = () => formRef.current?.requestSubmit();
        window.addEventListener('voice-fill', handleFill);
        window.addEventListener('voice-submit', handleSubmit);
        return () => {
            window.removeEventListener('voice-fill', handleFill);
            window.removeEventListener('voice-submit', handleSubmit);
        };
    }, [update]);

    const validateStep1 = () => {
        const e: Partial<CheckoutForm> = {};
        if (!form.firstName.trim()) e.firstName = 'Required';
        if (!form.lastName.trim()) e.lastName = 'Required';
        if (!form.email.trim() || !form.email.includes('@')) e.email = 'Valid email required';
        if (!form.address.trim()) e.address = 'Required';
        if (!form.city.trim()) e.city = 'Required';
        if (!form.zip.trim()) e.zip = 'Required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep2 = () => {
        const e: Partial<CheckoutForm> = {};
        if (form.cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = '16-digit card required';
        if (!form.cardExpiry.includes('/') || form.cardExpiry.length < 5) e.cardExpiry = 'MM/YY required';
        if (form.cardCVC.length < 3) e.cardCVC = '3+ digits required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const goToPayment = () => {
        if (validateStep1()) setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep2()) return;

        setProcessing(true);

        const orderData = {
            items: items.map(i => ({
                productId: i.id,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                size: i.size,
            })),
            customer: {
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                phone: form.phone,
                address: form.address,
                city: form.city,
                zip: form.zip,
            },
            payment: {
                last4: form.cardNumber.replace(/\s/g, '').slice(-4),
                brand: detectBrand(form.cardNumber).brand || 'Visa',
            },
        };

        try {
            const res = await fetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            if (res.ok) {
                const data = await res.json();
                clearCart();
                navigate('/order-success', { state: { orderId: data.orderId } });
            } else {
                throw new Error('Order failed');
            }
        } catch {
            // Fallback: if backend is down, still complete the demo
            clearCart();
            navigate('/order-success');
        } finally {
            setProcessing(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="container section" style={{ textAlign: 'center', padding: '120px 24px' }}>
                <h1>Your cart is empty</h1>
                <p style={{ color: 'var(--text-2)', marginTop: 8 }}>Add products before checking out</p>
            </div>
        );
    }

    const { brand, icon } = detectBrand(form.cardNumber);

    const inputStyle = (field: keyof CheckoutForm): React.CSSProperties => ({
        width: '100%', padding: '14px 16px',
        background: 'var(--bg-secondary)', border: `1.5px solid ${errors[field] ? '#ef4444' : 'var(--border-card)'}`,
        borderRadius: 'var(--r-sm)', color: 'var(--text)',
        fontSize: '0.95rem', outline: 'none', fontFamily: 'var(--font)',
        transition: 'border-color 0.2s',
    });

    return (
        <div className="container section">
            {/* Steps Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.85rem', fontWeight: 700,
                        background: step >= 1 ? 'var(--accent)' : 'var(--bg-card)', color: step >= 1 ? 'white' : 'var(--text-3)',
                        transition: 'all 0.3s',
                    }}>1</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: step >= 1 ? 'var(--text)' : 'var(--text-3)' }}>Details</span>
                </div>
                <div style={{ flex: 1, height: 2, background: step >= 2 ? 'var(--accent)' : 'var(--border)', transition: 'all 0.3s' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.85rem', fontWeight: 700,
                        background: step >= 2 ? 'var(--accent)' : 'var(--bg-card)', color: step >= 2 ? 'white' : 'var(--text-3)',
                        transition: 'all 0.3s',
                    }}>2</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: step >= 2 ? 'var(--text)' : 'var(--text-3)' }}>Payment</span>
                </div>
            </div>

            <form ref={formRef} onSubmit={handleSubmit}>
                <div className="checkout-grid">
                    <div>
                        {/* Step 1: Personal + Shipping */}
                        {step === 1 && (
                            <>
                                <div className="checkout-section">
                                    <h2 className="checkout-section-title">Personal Information</h2>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">First Name</label>
                                            <input id="checkout-firstName" style={inputStyle('firstName')} value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="John" />
                                            {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Last Name</label>
                                            <input id="checkout-lastName" style={inputStyle('lastName')} value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Doe" />
                                            {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Email</label>
                                            <input id="checkout-email" style={inputStyle('email')} value={form.email} onChange={e => update('email', e.target.value)} placeholder="john@example.com" type="email" />
                                            {errors.email && <span className="form-error">{errors.email}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Phone <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
                                            <input id="checkout-phone" style={inputStyle('phone')} value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
                                        </div>
                                    </div>
                                </div>

                                <div className="checkout-section">
                                    <h2 className="checkout-section-title">Shipping Address</h2>
                                    <div className="form-group">
                                        <label className="form-label">Street Address</label>
                                        <input id="checkout-address" style={inputStyle('address')} value={form.address} onChange={e => update('address', e.target.value)} placeholder="123 Main Street" />
                                        {errors.address && <span className="form-error">{errors.address}</span>}
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">City</label>
                                            <input id="checkout-city" style={inputStyle('city')} value={form.city} onChange={e => update('city', e.target.value)} placeholder="New York" />
                                            {errors.city && <span className="form-error">{errors.city}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">ZIP Code</label>
                                            <input id="checkout-zip" style={inputStyle('zip')} value={form.zip} onChange={e => update('zip', e.target.value)} placeholder="10001" />
                                            {errors.zip && <span className="form-error">{errors.zip}</span>}
                                        </div>
                                    </div>
                                </div>

                                <button type="button" onClick={goToPayment} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1rem' }}>
                                    Continue to Payment →
                                </button>
                            </>
                        )}

                        {/* Step 2: Payment */}
                        {step === 2 && (
                            <>
                                <div className="checkout-section" style={{ position: 'relative' }}>
                                    <h2 className="checkout-section-title">Payment Details</h2>

                                    {/* Card Preview */}
                                    <div className="payment-card-preview">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                            <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{brand || 'Credit Card'}</span>
                                        </div>
                                        <div style={{ fontFamily: 'monospace', fontSize: '1.3rem', letterSpacing: '0.15em', marginBottom: 24 }}>
                                            {form.cardNumber || '•••• •••• •••• ••••'}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Card Holder</div>
                                                <div style={{ fontSize: '0.85rem' }}>
                                                    {form.firstName || form.lastName ? `${form.firstName} ${form.lastName}`.trim() : 'YOUR NAME'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Expires</div>
                                                <div style={{ fontSize: '0.85rem' }}>{form.cardExpiry || 'MM/YY'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginTop: 24 }}>
                                        <label className="form-label">Card Number</label>
                                        <input id="checkout-cardNumber" style={inputStyle('cardNumber')} value={form.cardNumber} onChange={e => update('cardNumber', e.target.value)} placeholder="4242 4242 4242 4242" maxLength={19} />
                                        {errors.cardNumber && <span className="form-error">{errors.cardNumber}</span>}
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Expiry Date</label>
                                            <input id="checkout-cardExpiry" style={inputStyle('cardExpiry')} value={form.cardExpiry} onChange={e => update('cardExpiry', e.target.value)} placeholder="MM/YY" maxLength={5} />
                                            {errors.cardExpiry && <span className="form-error">{errors.cardExpiry}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">CVC</label>
                                            <input id="checkout-cardCVC" style={inputStyle('cardCVC')} value={form.cardCVC} onChange={e => update('cardCVC', e.target.value)} placeholder="123" maxLength={4} type="password" />
                                            {errors.cardCVC && <span className="form-error">{errors.cardCVC}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '16px' }}>
                                        ← Back
                                    </button>
                                    <button type="submit" disabled={processing} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '16px', fontSize: '1rem', opacity: processing ? 0.7 : 1 }}>
                                        {processing ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span className="spinner" /> Processing Payment...
                                            </span>
                                        ) : (
                                            `Pay $${subtotal.toFixed(2)} →`
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="checkout-summary">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Order Summary</h3>
                        <div className="checkout-items">
                            {items.map(item => (
                                <div key={`${item.id}-${item.size}`} className="checkout-item">
                                    <img src={item.image} alt={item.name} style={{ width: 48, height: 48, borderRadius: 'var(--r-sm)', objectFit: 'cover' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                                            Qty: {item.quantity}{item.size ? ` · ${item.size}` : ''}
                                        </div>
                                    </div>
                                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-2)', marginBottom: 8 }}>
                                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-2)', marginBottom: 16 }}>
                                <span>Shipping</span><span style={{ color: '#22c55e' }}>Free</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.15rem' }}>
                                <span>Total</span><span>${subtotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};
