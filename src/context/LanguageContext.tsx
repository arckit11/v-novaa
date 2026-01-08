import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'ar';

type Translations = {
    [key in Language]: {
        [key: string]: string;
    };
};

const translations: Translations = {
    en: {
        'nav.home': 'Home',
        'nav.shop': 'Shop',
        'nav.cart': 'Cart',
        'nav.allProducts': 'All Products',
        'common.search': 'Search',
        'common.profile': 'Profile',
        'language.english': 'English',
        'language.arabic': 'Arabic',
        'category.title': 'What are you shopping for today?',
        'category.subtitle': 'Select a category to explore our curated collection',
        'category.yoga': 'Yoga',
        'category.yoga.desc': 'Find your zen with our premium yoga collection',
        'category.jogging': 'Jogging + Running + Walking',
        'category.jogging.desc': 'Gear designed for comfort and performance on every run',
        'category.gym': 'Gym',
        'category.gym.desc': 'Power your workouts with our gym essentials',
        'cart.title': 'Your Cart',
        'cart.empty.title': 'Your Cart is Empty',
        'cart.empty.desc': "Looks like you haven't added any items to your cart yet.",
        'cart.startShopping': 'Start Shopping',
        'cart.items': 'items in your cart',
        'cart.size': 'Size',
        'cart.color': 'Color',
        'cart.remove': 'Remove',
        'cart.summary': 'Order Summary',
        'cart.subtotal': 'Subtotal',
        'cart.shipping': 'Shipping',
        'cart.shipping.free': 'Free',
        'cart.tax': 'Estimated Tax',
        'cart.total': 'Total',
        'cart.checkout': 'Proceed to Checkout',
        'cart.continue': 'Continue Shopping',
        'cart.note.shipping': 'Free shipping on orders over $50.',
        'cart.note.taxes': 'Taxes calculated at checkout.',
        // Sort & Filters
        'sort.priceAsc': 'Price: Low to High',
        'sort.priceDesc': 'Price: High to Low',
        'sort.newest': 'Newest',
        'sort.rating': 'Rating',
        'sort.placeholder': 'Sort by',
        'listing.products': 'Products',
        'listing.filters': 'Filters',
        'listing.clearAll': 'Clear All',
        'listing.apply': 'Apply Filters',
        'listing.available': 'products available',
        'listing.noProducts': 'No products found',
        'listing.tryAdjusting': 'Try adjusting your filters or search term',
        'listing.new': 'New',
        'listing.bestSeller': 'Best Seller',
        'listing.searchPlaceholder': 'Search products...',
        'filter.price': 'Price Range',
        'filter.gender': 'Gender',
        'filter.categories': 'Categories',
        'filter.brands': 'Brands',
        'filter.colors': 'Colors',
        'filter.sizes': 'Sizes',
        // Product Detail
        'product.reviews': 'reviews',
        'product.description': 'Description',
        'product.size': 'Size',
        'product.quantity': 'Quantity',
        'product.addToCart': 'Add to Cart',
        'product.selectSize': 'Please select a size',
        'product.selectSizeDesc': 'You need to select a size before adding to cart',
        'product.added': 'Added to cart',
        'product.viewCart': 'View Cart',
        'product.notFound': 'Product not found',
        'product.back': 'Back to Products',
        // Payment
        'payment.title': 'Checkout',
        'payment.subtitle': 'Complete your purchase',
        'payment.shippingInfo': 'Shipping Information',
        'payment.name': 'Name',
        'payment.email': 'Email Address',
        'payment.address': 'Complete Address',
        'payment.phone': 'Phone Number',
        'payment.saveInfo': 'Save this information for next time',
        'payment.method': 'Payment Method',
        'payment.card': 'Card',
        'payment.cardName': 'Name on Card',
        'payment.cardNumber': 'Card Number',
        'payment.expiry': 'Expiry Date',
        'payment.cvv': 'CVV',
        'payment.saveCard': 'Save card for future purchases',
        'payment.complete': 'Complete Purchase',
        'payment.processing': 'Processing...',
        'payment.payWith': 'Pay with',
        'payment.error.validate': 'Validation Error',
        'payment.error.fill': 'Please fill in all required fields accurately.',
        'voice.start': 'Start Voice Assistant',
        'voice.end': 'End Voice Session',
        // Confirmation
        'confirm.title': 'Your order is confirmed!',
        'confirm.subtitle': "Thank you for your purchase. We've received your order and will begin processing it right away.",
        'confirm.orderInfo': 'Order Information',
        'confirm.orderNum': 'Order Number',
        'confirm.date': 'Date',
        'confirm.email': 'Email',
        'confirm.paymentMethod': 'Payment Method',
        'confirm.paymentDetails': 'Payment Details',
        'confirm.shippingAddress': 'Shipping Address',
        'confirm.notProvided': 'Not provided',
        'confirm.notSpecified': 'Not specified',
        'confirm.addressNotProvided': 'Address not provided',
        'confirm.creditCard': 'Credit Card',
        'confirm.cardEnding': 'Card ending in',
        'confirm.nameOnCard': 'Name on card',
        'confirm.emailNote': 'You will receive a confirmation email with your order details and tracking information once your order ships.',
        'confirm.backHome': 'Back to Home',
        // Intro
        'intro.title': 'VOIX NOVA',
        'intro.subtitle': 'AI Shopping Assistant',
        'intro.description': 'Your personal AI-powered shopping companion that helps you find the perfect fitness gear with voice commands.',
        'intro.active': 'Active',
        'intro.greeting': '"Hi there! I\'m Voix Nova, your personal shopping assistant."',
        'intro.feature.voice': 'Voice Shopping',
        'intro.feature.voiceDesc': 'Find products using natural voice commands',
        'intro.feature.recommend': 'Smart Recommendations',
        'intro.feature.recommendDesc': 'Get personalized product suggestions',
        'intro.feature.seamless': 'Seamless Experience',
        'intro.feature.seamlessDesc': 'Shop hands-free from browsing to checkout',
        'intro.getStarted': 'Get Started',
        'intro.footer': 'Use the voice assistant at the bottom left to navigate by voice',
        // Not Found
        'notfound.title': '404',
        'notfound.subtitle': 'Oops! Page not found',
        'notfound.home': 'Return to Home',
    },
    ar: {
        'nav.home': 'الرئيسية',
        'nav.shop': 'التسوق',
        'nav.cart': 'عربة التسوق',
        'nav.allProducts': 'جميع المنتجات',
        'common.search': 'بحث',
        'common.profile': 'الملف الشخصي',
        'language.english': 'الإنجليزية',
        'language.arabic': 'العربية',
        'category.title': 'ما الذي تتسوق من أجله اليوم؟',
        'category.subtitle': 'اختر فئة لاستكشاف مجموعتنا المختارة',
        'category.yoga': 'يوغا',
        'category.yoga.desc': 'جد زنك مع مجموعتنا المميزة لليوغا',
        'category.jogging': 'الركض + الجري + المشي',
        'category.jogging.desc': 'معدات مصممة للراحة والأداء في كل جولة',
        'category.gym': 'نادي رياضي',
        'category.gym.desc': 'عزز تمارينك مع أساسيات النادي الرياضي لدينا',
        'cart.title': 'عربة التسوق الخاصة بك',
        'cart.empty.title': 'عربة التسوق فارغة',
        'cart.empty.desc': 'يبدو أنك لم تضف أي عناصر إلى عربة التسوق بعد.',
        'cart.startShopping': 'ابدأ التسوق',
        'cart.items': 'عناصر في عربة التسوق',
        'cart.size': 'المقاس',
        'cart.color': 'اللون',
        'cart.remove': 'إزالة',
        'cart.summary': 'ملخص الطلب',
        'cart.subtotal': 'المجموع الفرعي',
        'cart.shipping': 'الشحن',
        'cart.shipping.free': 'مجاني',
        'cart.tax': 'الضريبة المقدرة',
        'cart.total': 'المجموع',
        'cart.checkout': 'متابعة الدفع',
        'cart.continue': 'متابعة التسوق',
        'cart.note.shipping': 'شحن مجاني للطلبات التي تزيد عن 50 دولارًا.',
        'cart.note.taxes': 'يتم حساب الضرائب عند الخروج.',
        // Sort & Filters
        'sort.priceAsc': 'السعر: من الأقل إلى الأعلى',
        'sort.priceDesc': 'السعر: من الأعلى إلى الأقل',
        'sort.newest': 'الأحدث',
        'sort.rating': 'التقييم',
        'sort.placeholder': 'ترتيب حسب',
        'listing.products': 'منتجات',
        'listing.filters': 'تصفية',
        'listing.clearAll': 'مسح الكل',
        'listing.apply': 'تطبيق التصفية',
        'listing.available': 'منتجات متاحة',
        'listing.noProducts': 'لم يتم العثور على منتجات',
        'listing.tryAdjusting': 'حاول تعديل التصفية أو مصطلح البحث',
        'listing.new': 'جديد',
        'listing.bestSeller': 'الأكثر مبيعاً',
        'listing.searchPlaceholder': 'البحث عن منتجات...',
        'filter.price': 'نطاق السعر',
        'filter.gender': 'الجنس',
        'filter.categories': 'الفئات',
        'filter.brands': 'العلامات التجارية',
        'filter.colors': 'الألوان',
        'filter.sizes': 'المقاسات',
        // Product Detail
        'product.reviews': 'مراجعات',
        'product.description': 'الوصف',
        'product.size': 'المقاس',
        'product.quantity': 'الكمية',
        'product.addToCart': 'أضف إلى العربة',
        'product.selectSize': 'الرجاء اختيار مقاس',
        'product.selectSizeDesc': 'يجب عليك اختيار مقاس قبل الإضافة إلى العربة',
        'product.added': 'تمت الإضافة إلى العربة',
        'product.viewCart': 'عرض العربة',
        'product.notFound': 'المنتج غير موجود',
        'product.back': 'العودة للمنتجات',
        // Payment
        'payment.title': 'الدفع',
        'payment.subtitle': 'أكمل عملية الشراء',
        'payment.shippingInfo': 'معلومات الشحن',
        'payment.name': 'الاسم',
        'payment.email': 'البريد الإلكتروني',
        'payment.address': 'العنوان الكامل',
        'payment.phone': 'رقم الهاتف',
        'payment.saveInfo': 'احفظ هذه المعلومات للمرة القادمة',
        'payment.method': 'طريقة الدفع',
        'payment.card': 'بطاقة',
        'payment.cardName': 'الاسم على البطاقة',
        'payment.cardNumber': 'رقم البطاقة',
        'payment.expiry': 'تاريخ الانتهاء',
        'payment.cvv': 'رمز التحقق (CVV)',
        'payment.saveCard': 'حفظ البطاقة للمشريات المستقبلية',
        'payment.complete': 'إتمام الشراء',
        'payment.processing': 'جاري المعالجة...',
        'payment.payWith': 'ادفع بواسطة',
        'payment.error.validate': 'خطأ في التحقق',
        'payment.error.fill': 'الرجاء تعبئة جميع الحقول المطلوبة بدقة.',
        'voice.start': 'تشغيل المساعد الصوتي',
        'voice.end': 'إنهاء الجلسة الصوتية',
        // Confirmation
        'confirm.title': 'تم تأكيد طلبك!',
        'confirm.subtitle': "شكراً لشرائك. لقد استلمنا طلبك وسنبدأ في معالجته على الفور.",
        'confirm.orderInfo': 'معلومات الطلب',
        'confirm.orderNum': 'رقم الطلب',
        'confirm.date': 'التاريخ',
        'confirm.email': 'البريد الإلكتروني',
        'confirm.paymentMethod': 'طريقة الدفع',
        'confirm.paymentDetails': 'تفاصيل الدفع',
        'confirm.shippingAddress': 'عنوان الشحن',
        'confirm.notProvided': 'غير مزود',
        'confirm.notSpecified': 'غير محدد',
        'confirm.addressNotProvided': 'العنوان غير مزود',
        'confirm.creditCard': 'بطاقة ائتمان',
        'confirm.cardEnding': 'بطاقة تنتهي بـ',
        'confirm.nameOnCard': 'الاسم على البطاقة',
        'confirm.emailNote': 'ستتلقى رسالة تأكيد عبر البريد الإلكتروني تحتوي على تفاصيل طلبك ومعلومات التتبع بمجرد شحن طلبك.',
        'confirm.backHome': 'العودة للرئيسية',
        // Intro
        'intro.title': 'VOIX NOVA',
        'intro.subtitle': 'مساعد التسوق بالذكاء الاصطناعي',
        'intro.description': 'رفيقك الشخصي للتسوق المدعوم بالذكاء الاصطناعي الذي يساعدك في العثور على معدات اللياقة البدنية المثالية باستخدام الأوامر الصوتية.',
        'intro.active': 'نشط',
        'intro.greeting': '"مرحباً! أنا Voix Nova، مساعد التسوق الشخصي الخاص بك."',
        'intro.feature.voice': 'التسوق الصوتي',
        'intro.feature.voiceDesc': 'اعثر على المنتجات باستخدام الأوامر الصوتية الطبيعية',
        'intro.feature.recommend': 'توصيات ذكية',
        'intro.feature.recommendDesc': 'احصل على اقتراحات منتجات مخصصة',
        'intro.feature.seamless': 'تجربة سلسة',
        'intro.feature.seamlessDesc': 'تسوق دون استخدام اليدين من المتصفح إلى الدفع',
        'intro.getStarted': 'ابدأ الآن',
        'intro.footer': 'استخدم المساعد الصوتي في أسفل اليسار للتنقل بالصوت',
        // Not Found
        'notfound.title': '404',
        'notfound.subtitle': 'عذراً! الصفحة غير موجودة',
        'notfound.home': 'العودة للرئيسية',
    },
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const savedLang = localStorage.getItem('language');
        return (savedLang === 'en' || savedLang === 'ar') ? savedLang : 'en';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
        // User requested to prevent layout shift (keep LTR for now)
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = language;
    }, [language]);

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    const isRTL = false; // Forced LTR as per user request

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
