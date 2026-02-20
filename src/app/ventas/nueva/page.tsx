'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Icon = ({ children, className = "w-5 h-5" }: { children: React.ReactNode, className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        {children}
    </svg>
);

const AVAILABLE_ICONS = {
    Package: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
    ShoppingCart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />,
    Tag: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
    ShoppingBag: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />,
    Star: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-1.503 1.884-2.305 1.283l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.802.601-2.605-.362-2.305-1.283l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
    Store: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    FastFood: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.5a5 5 0 11-7 0m7 0V13a2 2 0 10-4 0v2.5M3 15.5a5 5 0 117 0m-7 0V13a2 2 0 104 0v2.5M3 20h18" />,
    Sparkles: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />,
    Coffee: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />,
    Heart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
    Bakery: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20.618L7.584 19.8a1 1 0 01-.832-.985V15.5a1 1 0 011-1h8.5a1 1 0 011 1v3.315a1 1 0 01-.832.985L12 20.618z" />,
    Freeze: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20m10-10H2m17.5 7.5L4.5 4.5m15 0L4.5 19.5" />,
    Home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    Apple: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2c-1.5 0-3 1-3 3 0 2 2 3 3 5 1-2 3-3 3-5 0-2-1.5-3-3-3z M12 20c-4 0-7-3-7-7s3-7 7-7 7 3 7 7-3 7-7 7z" />,
    Carrot: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.5 3.5c-1.5-1.5-4-1.5-5.5 0L6 12.5c-1 1-1 2.5 0 3.5l2 2c1 1 2.5 1 3.5 0l9-9c1.5-1.5 1.5-4 0-5.5z M8.5 17.5l-3 3 M11.5 14.5l-2 2" />,
    Milk: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 2h10l1 4v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6l1-4z M7 8h10" />,
    Pizza: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11l-3 3 3 3 m-6-6l3 3-3 3 M12 3L3 20h18L12 3z" />,
    Meat: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.5 14.5c1.333-1.333 4.5-4.5 4.5-4.5s2.5-1.5 1-3-3-1-3-1l-4.5 4.5-3-3L11 8l2.5 2.5L11 13l2.5 2.5L11 18l2.5 2.5 3.5-3.5-1.5-2.5z M10 13l-4 4a2 2 0 000 2.828l.172.172a2 2 0 002.828 0L13 16" />,
    Fish: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 12s-4-4-10-4-10 4-10 4 4 4 10 4 10-4 10-4z M17 12a1 1 0 11-2 0 1 1 0 012 0z" />,
    IceCream: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a4 4 0 00-4 4v2a4 4 0 108 0V6a4 4 0 00-4-4z M12 14l-4 8h8l-4-8z" />,
    Cake: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12c0-4.97-4.03-9-9-9s-9 4.03-9 9m18 0v6c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-6m18 0H3m12-5l-3 3-3-3" />,
    Beer: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8h1a3 3 0 013 3v2a3 3 0 01-3 3h-1m-4 4H7a2 2 0 01-2-2V5a2 2 0 012-2h7a2 2 0 012 2v12a2 2 0 01-2 2z M7 8h9" />,
    Wine: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 2h8m-4 0v12m0 0a4 4 0 01-4 4h8a4 4 0 01-4-4m-6 4h12" />,
    Cleaning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12m-8 4h16" />,
    Pets: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />,
    Tools: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M12 15a3 3 0 100-6 3 3 0 000 6z" />,
    Office: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L19 13" />,
    Tech: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />,
    Shirt: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7V3m0 4l-4-4m4 4l4-4M5 7L3 9v12h18V9l-2-2m-2 0h-2m-4 0H9m-2 0H5" />,
    Gift: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 8h14v13H5V8z" />,
    Medicine: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
};

interface Category {
    id: string;
    name: string;
    icon: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    categoryId: string;
    category?: Category;
    barcode?: string;
    sellByWeight?: boolean;
}

interface CartItem extends Product {
    quantity: number;
    productId: string;
}

export default function POSPage() {
    const { showToast } = useToast();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [auditLog, setAuditLog] = useState<any[]>([]);

    // Weight Modal state
    const [weightModal, setWeightModal] = useState<{ isOpen: boolean; product: Product | null; isRemoving: boolean }>({
        isOpen: false,
        product: null,
        isRemoving: false
    });
    const [weightInput, setWeightInput] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchData();
        const savedCart = localStorage.getItem('active_cart');
        if (savedCart) setCart(JSON.parse(savedCart));
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Si hay un modal abierto, no interferir con el foco
            if (isPaymentModalOpen || weightModal.isOpen) return;

            // F2 fuerza el foco si se perdió por alguna razón
            if (e.key === 'F2') {
                e.preventDefault();
                searchInputRef.current?.focus();
                return;
            }

            // Si el foco no está en el buscador y el usuario empieza a escribir una letra o número
            // (evitamos capturar teclas de control como Shift, Alt, etc)
            if (document.activeElement !== searchInputRef.current && e.key.length === 1) {
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        // Asegurar foco inicial
        searchInputRef.current?.focus();

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPaymentModalOpen, weightModal.isOpen]);

    useEffect(() => {
        localStorage.setItem('active_cart', JSON.stringify(cart));
    }, [cart]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [productsRes, categoriesRes, pmRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/categories'),
                fetch('/api/payment-methods')
            ]);

            if (!productsRes.ok || !categoriesRes.ok || !pmRes.ok) throw new Error('Error de conexión');

            const productsData = await productsRes.json();
            const categoriesData = await categoriesRes.json();
            const pmData = await pmRes.json();

            setProducts(productsData);
            setCategories(categoriesData);
            setPaymentMethods(pmData);

            if (pmData.length > 0) setSelectedPaymentMethod(pmData[0].id);
        } catch (err) {
            setError('No se pudo cargar el catálogo de productos o métodos de pago');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (product: Product, quantity: number = 1) => {
        if (product.sellByWeight && quantity > 0) {
            setWeightModal({ isOpen: true, product, isRemoving: false });
            setWeightInput('');
            return;
        }

        if (product.sellByWeight && quantity < 0) {
            setWeightModal({ isOpen: true, product, isRemoving: true });
            setWeightInput('');
            return;
        }

        const existingItem = cart.find(item => item.productId === product.id);
        const currentQtyInCart = existingItem ? existingItem.quantity : 0;
        const newTotalQty = currentQtyInCart + quantity;

        if (quantity > 0 && newTotalQty > product.stock) {
            showToast(`¡Stock insuficiente! Disponible: ${product.stock} ${product.sellByWeight ? 'kg' : 'unid'}`, 'error');
            return;
        }

        // Log the action for audit
        setAuditLog(prev => [...prev, {
            productId: product.id,
            productName: product.name,
            quantity: Math.abs(quantity),
            action: quantity > 0 ? 'ADD' : 'REMOVE',
            timestamp: new Date().toISOString()
        }]);

        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                const newQuantity = existing.quantity + quantity;
                if (newQuantity <= 0) return prev.filter(item => item.productId !== product.id);
                return prev.map(item => item.productId === product.id ? { ...item, quantity: newQuantity } : item);
            }
            if (quantity <= 0) return prev;
            return [...prev, { ...product, productId: product.id, quantity }];
        });
    };

    const handleConfirmWeight = () => {
        const weight = parseFloat(weightInput);
        if (isNaN(weight) || weight <= 0) {
            showToast('Ingresa un peso válido', 'error');
            return;
        }

        const product = weightModal.product!;
        const quantity = weightModal.isRemoving ? -weight : weight;

        const existingItem = cart.find(item => item.productId === product.id);
        const currentQtyInCart = existingItem ? existingItem.quantity : 0;
        const newTotalQty = currentQtyInCart + quantity;

        if (quantity > 0 && newTotalQty > product.stock) {
            showToast(`¡Stock insuficiente! Disponible: ${product.stock} ${product.sellByWeight ? 'kg' : 'unid'}`, 'error');
            return;
        }

        // Log the action for audit
        setAuditLog(prev => [...prev, {
            productId: product.id,
            productName: product.name,
            quantity: Math.abs(quantity),
            action: quantity > 0 ? 'ADD' : 'REMOVE',
            timestamp: new Date().toISOString()
        }]);

        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                const newQuantity = existing.quantity + quantity;
                if (newQuantity <= 0) return prev.filter(item => item.productId !== product.id);
                return prev.map(item => item.productId === product.id ? { ...item, quantity: newQuantity } : item);
            }
            if (quantity <= 0) return prev;
            return [...prev, { ...product, productId: product.id, quantity }];
        });

        setWeightModal({ isOpen: false, product: null, isRemoving: false });
    };

    const activePM = paymentMethods.find(pm => pm.id === selectedPaymentMethod);
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const surcharge = activePM ? (subtotal * (activePM.percentage / 100)) : 0;
    const total = subtotal + surcharge;

    const finalizarVenta = async (type: string = 'VENTA') => {
        if (cart.length === 0) return;
        setProcessing(true);

        try {
            const storedUser = localStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : null;

            const saleData = {
                userId: user?.id,
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price
                })),
                paymentMethodId: selectedPaymentMethod,
                total: total,
                type: type,
                auditLog: auditLog
            };

            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saleData)
            });

            const result = await res.json();
            if (res.ok) {
                showToast(type === 'VENTA' ? 'Venta registrada con éxito' : 'Operación cancelada y registrada', 'success');
                setCart([]);
                setAuditLog([]);
                localStorage.removeItem('active_cart');
                setSearch('');
                setSelectedCategory(null);
                fetchData();
            } else {
                showToast('Error: ' + result.error, 'error');
            }
        } catch (err) {
            showToast('Error de conexión', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const searchTerm = search.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(searchTerm) || (p.barcode && p.barcode.includes(search));
        const matchesCategory = selectedCategory ? p.categoryId === selectedCategory : true;
        const hasStock = p.stock > 0;
        return matchesSearch && matchesCategory && hasStock;
    });

    return (
        <div className="fixed inset-0 flex flex-row overflow-hidden bg-slate-50 dark:bg-slate-950 z-10">
            <main className="flex-1 flex flex-col p-6 overflow-hidden">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 text-slate-400 hover:text-slate-600">
                            <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></Icon>
                        </Link>
                        <h1 className="text-2xl font-bold">Punto de Venta</h1>
                    </div>

                    <div className="relative w-full md:w-80">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></Icon>
                        </span>
                        <input
                            ref={searchInputRef}
                            autoFocus
                            type="text"
                            placeholder="Escribe o escanea código..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-slate-400 animate-pulse">Cargando productos...</div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-20">
                            <div className="p-4 bg-red-50 text-red-500 rounded-full">
                                <Icon className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></Icon>
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-slate-900 dark:text-white">Error al cargar productos</p>
                                <p className="text-sm text-slate-500">{error}</p>
                            </div>
                            <button onClick={fetchData} className="btn-secondary">Reintentar</button>
                        </div>
                    ) : !selectedCategory && !search ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className="card-premium p-6 flex flex-col items-center justify-center gap-4 hover:border-primary group transition-all"
                                >
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Icon className="w-8 h-8">{(AVAILABLE_ICONS as any)[cat.icon] || AVAILABLE_ICONS.Package}</Icon>
                                    </div>
                                    <span className="font-bold text-center">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <button onClick={() => { setSelectedCategory(null); setSearch(''); }} className="text-sm font-medium text-primary flex items-center gap-1 hover:underline">
                                <Icon className="w-4 h-4"><path d="M15 19l-7-7 7-7" /></Icon> Regresar a categorías
                            </button>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredProducts.map(p => (
                                    <div key={p.id} className="card-premium p-4 flex flex-col justify-between hover:border-primary transition-all">
                                        <div className="mb-4">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{p.category?.name || 'Sin categoría'}</p>
                                            <h3 className="font-bold text-sm line-clamp-2">{p.name}</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="text-xl font-bold">${Number(p.price).toLocaleString()}</div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAddToCart(p, 1)} className="flex-1 bg-primary text-white py-2 rounded-lg text-xs font-bold hover:bg-primary-dark">SUMAR</button>
                                                <button onClick={() => handleAddToCart(p, -1)} className="px-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                                                    <Icon className="w-4 h-4"><path d="M20 12H4" /></Icon>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <div className="col-span-full py-20 text-center text-slate-400 font-medium italic">
                                        No se encontraron productos coincidentes
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <aside className="w-80 lg:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-xl h-full">

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-0">
                    {/* Cart Items with their removals */}
                    {cart.map((item) => {
                        const productRemovals = auditLog.filter(l => l.productId === item.productId && l.action === 'REMOVE');
                        const totalRemoved = productRemovals.reduce((sum, l) => sum + l.quantity, 0);
                        const lastTimestamp = productRemovals.length > 0 ? productRemovals[productRemovals.length - 1].timestamp : null;

                        return (
                            <div key={item.productId} className="space-y-1">
                                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 group shadow-sm">
                                    <div className="flex-1 min-w-0 mr-2">
                                        <h4 className="font-bold text-sm truncate">{item.name}</h4>
                                        <p className="text-xs text-slate-500">${Number(item.price).toLocaleString()} x {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">${(item.price * item.quantity).toLocaleString()}</p>
                                        <button onClick={() => handleAddToCart(item as any as Product, -1)} className="text-red-500 opacity-60 hover:opacity-100 transition-opacity p-1">
                                            <Icon className="w-5 h-5 inline"><path d="M20 12H4" /></Icon>
                                        </button>
                                    </div>
                                </div>
                                {totalRemoved > 0 && (
                                    <div className="mx-2 p-1.5 flex justify-between items-center bg-red-50/50 dark:bg-red-900/10 text-[10px] text-red-600 dark:text-red-400 border-l-2 border-red-300 dark:border-red-800">
                                        <span className="font-bold uppercase tracking-tighter">Acumulado Quitado: -{totalRemoved.toFixed(item.sellByWeight ? 3 : 0)} {item.sellByWeight ? 'kg' : 'unid'}</span>
                                        <span className="opacity-50">{new Date(lastTimestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Fully Removed Items (Ghosts) grouped and summed */}
                    {Object.values(
                        auditLog
                            .filter(l => l.action === 'REMOVE' && !cart.some(c => c.productId === l.productId))
                            .reduce((acc: Record<string, any>, log) => {
                                if (!acc[log.productId]) {
                                    acc[log.productId] = { ...log, totalQuantity: 0 };
                                }
                                acc[log.productId].totalQuantity += log.quantity;
                                acc[log.productId].timestamp = log.timestamp; // update to latest
                                return acc;
                            }, {})
                    ).map((ghost: any, i) => (
                        <div key={`ghost-${i}`} className="p-3 bg-red-50/20 dark:bg-red-900/5 border border-dashed border-red-200 dark:border-red-900/20 rounded-xl opacity-60 flex flex-col gap-1 grayscale-[0.5]">
                            <div className="flex justify-between items-center text-red-700 dark:text-red-500">
                                <h4 className="font-bold text-xs line-through italic">{ghost.productName}</h4>
                                <span className="text-[8px] font-bold px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 rounded uppercase tracking-tighter">ELIMINADO</span>
                            </div>
                            <div className="text-[9px] text-red-500/70 flex justify-between uppercase font-bold tracking-tighter">
                                <span>Total quitado: -{ghost.totalQuantity.toFixed(ghost.totalQuantity % 1 !== 0 ? 3 : 0)}</span>
                                <span>{new Date(ghost.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    ))}

                    {cart.length === 0 && auditLog.length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2 opacity-50 py-20">
                        <Icon className="w-12 h-12"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></Icon>
                        <span className="text-xs font-bold uppercase tracking-widest">Carrito vacío</span>
                    </div>}

                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 space-y-4 shrink-0">
                    <button onClick={() => setIsPaymentModalOpen(true)} className="w-full h-12 flex items-center justify-between px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary group transition-all">
                        <span className="text-sm font-medium">{activePM?.name || 'Método de Pago'}</span>
                        <Icon className="w-4 h-4 text-slate-400 group-hover:text-primary"><path d="M9 5l7 7-7 7" /></Icon>
                    </button>

                    <div className="flex justify-between items-center text-2xl font-bold">
                        <span>Total</span>
                        <span className="text-primary">${total.toLocaleString()}</span>
                    </div>

                    <div className="space-y-2">
                        <button onClick={() => finalizarVenta('VENTA')} disabled={cart.length === 0 || processing} className="btn-primary w-full py-3 h-14 text-lg">
                            {processing ? 'Procesando...' : 'COBRAR'}
                        </button>
                        <button onClick={() => confirm('¿Cancelar venta?') && finalizarVenta('VENTA_NO_REALIZADA')} disabled={cart.length === 0 || processing} className="w-full text-xs font-bold text-slate-400 hover:text-red-500 py-2 uppercase tracking-widest">
                            Cancelar Operación
                        </button>
                    </div>
                </div>
            </aside>

            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <header className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold">Método de Pago</h2>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Icon><path d="M6 18L18 6M6 6l12 12" /></Icon></button>
                        </header>
                        <div className="p-6 gap-3 flex flex-col">
                            {paymentMethods.map(pm => (
                                <button
                                    key={pm.id}
                                    onClick={() => { setSelectedPaymentMethod(pm.id); setIsPaymentModalOpen(false); }}
                                    className={`p-4 rounded-lg border-2 text-left flex justify-between items-center transition-all ${selectedPaymentMethod === pm.id ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                                >
                                    <span className="font-bold">{pm.name}</span>
                                    {pm.percentage !== 0 && <span className={`text-xs px-2 py-1 rounded-full ${pm.percentage > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{pm.percentage > 0 ? '+' : ''}{pm.percentage}%</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {weightModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <header className="p-6 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-lg font-bold">{weightModal.product?.name}</h2>
                            <p className="text-sm text-slate-500">{weightModal.isRemoving ? 'Ingresa el peso a quitar' : 'Ingresa el peso en kg'}</p>
                        </header>
                        <div className="p-6 space-y-4">
                            <input
                                autoFocus
                                type="tel"
                                step="0.001"
                                inputMode="decimal"
                                placeholder="0.000"
                                className="w-full p-4 border rounded-lg text-4xl font-bold text-center outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800"
                                value={weightInput}
                                onChange={(e) => {
                                    const val = e.target.value.replace(',', '.');
                                    if (/^\d*\.?\d*$/.test(val)) setWeightInput(val);
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirmWeight()}
                            />

                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => {
                                            if (num === '.' && weightInput.includes('.')) return;
                                            setWeightInput(prev => prev + num.toString());
                                        }}
                                        className="h-14 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xl font-bold transition-colors active:scale-95"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setWeightInput(prev => prev.slice(0, -1))}
                                    className="h-14 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors active:scale-95"
                                >
                                    <Icon className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" /></Icon>
                                </button>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setWeightModal({ isOpen: false, product: null, isRemoving: false })} className="btn-secondary flex-1 h-12">Cancelar</button>
                                <button onClick={handleConfirmWeight} className={`flex-1 h-12 rounded-lg font-bold text-white shadow-lg transition-all active:scale-95 ${weightModal.isRemoving ? 'bg-red-600 shadow-red-500/20' : 'bg-primary shadow-primary/20'}`}>
                                    {weightModal.isRemoving ? 'QUITAR' : 'AGREGAR'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
