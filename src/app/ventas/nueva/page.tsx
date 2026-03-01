'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
    Package, ShoppingCart, ShoppingBag, Tag, Star, Store, Sparkles, Coffee, Heart,
    Apple, Carrot, Beef, Drumstick, Milk, Croissant, Sandwich, Soup,
    Container, Popcorn, Candy, CupSoda, Wine, Beer, SprayCan, Scroll, Brush,
    PawPrint, Bone, Shirt, Gift, Stethoscope, Hammer, Smartphone, Pizza,
    IceCream, Cake, Zap, Lightbulb, Home, Search, Trash2, Pencil, Plus, Minus,
    ArrowLeft, ChevronLeft, ChevronRight, X, AlertTriangle, Delete
} from 'lucide-react';

const AVAILABLE_ICONS: Record<string, any> = {
    Package,
    ShoppingCart,
    ShoppingBag,
    Tag,
    Star,
    Store,
    Sparkles,
    Coffee,
    Heart,
    Apple,
    Carrot,
    Meat: Beef,
    Chicken: Drumstick,
    Cheese: Pizza,
    Milk,
    Croissant,
    Baguette: Sandwich,
    Pasta: Soup,
    Can: Container,
    Snacks: Popcorn,
    Candy,
    Soda: CupSoda,
    Wine,
    Beer,
    Spray: SprayCan,
    Bucket: Container,
    Paper: Scroll,
    Brush,
    Paw: PawPrint,
    Bone,
    Shirt,
    Gift,
    Medicine: Stethoscope,
    Tools: Hammer,
    Tech: Smartphone,
    Pizza,
    IceCream,
    Cake,
    Zap,
    Lightbulb,
    Home,
    Search,
    Trash: Trash2,
    Edit: Pencil,
    Plus,
    Minus,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    X,
    AlertTriangle,
    Delete,
};

const Icon = ({ name, className = "w-5 h-5", fallback = Package }: { name: string, className?: string, fallback?: any }) => {
    const LucideIcon = AVAILABLE_ICONS[name] || fallback;
    return <LucideIcon className={className} />;
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
    const [registerOpen, setRegisterOpen] = useState<boolean | null>(null);
    const [showExitWarning, setShowExitWarning] = useState(false);

    // Weight Modal state
    const [weightModal, setWeightModal] = useState<{ isOpen: boolean; product: Product | null; isRemoving: boolean }>({
        isOpen: false,
        product: null,
        isRemoving: false
    });
    const [weightInput, setWeightInput] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Quick Edit Product Modal (for cost/iva/margin)
    const [quickEditModal, setQuickEditModal] = useState<{ isOpen: boolean; product: any | null }>({
        isOpen: false,
        product: null
    });
    const [quickEditData, setQuickEditData] = useState({
        cost: '',
        hasIva: false,
        margin: '0',
        price: ''
    });

    // Handle price calculation in Quick Edit
    useEffect(() => {
        const costVal = parseFloat(quickEditData.cost);
        const marginVal = parseFloat(quickEditData.margin);
        if (!isNaN(costVal) && !isNaN(marginVal)) {
            const base = quickEditData.hasIva ? costVal * 1.21 : costVal;
            const calculated = base * (1 + marginVal / 100);
            const currentPrice = parseFloat(quickEditData.price);
            if (isNaN(currentPrice) || Math.abs(currentPrice - calculated) > 0.01) {
                setQuickEditData(prev => ({ ...prev, price: calculated.toFixed(2) }));
            }
        }
    }, [quickEditData.cost, quickEditData.hasIva, quickEditData.margin]);

    useEffect(() => {
        checkRegisterStatus();
        fetchData();
        const savedCart = localStorage.getItem('active_cart');
        if (savedCart) setCart(JSON.parse(savedCart));
    }, []);

    const handleOpenQuickEdit = (e: React.MouseEvent, product: any) => {
        e.stopPropagation();
        setQuickEditModal({ isOpen: true, product });
        setQuickEditData({
            cost: product.cost ? product.cost.toString() : '',
            hasIva: product.hasIva || false,
            margin: product.margin ? product.margin.toString() : '0',
            price: product.price.toString()
        });
    };

    const handleSaveQuickEdit = async () => {
        if (!quickEditModal.product) return;
        setProcessing(true);
        try {
            const body = {
                ...quickEditModal.product,
                cost: quickEditData.cost,
                hasIva: quickEditData.hasIva,
                margin: quickEditData.margin,
                price: quickEditData.price
            };

            const res = await fetch('/api/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const updatedProduct = await res.json();
                showToast('Producto actualizado', 'success');
                // Update local products list
                setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
                setQuickEditModal({ isOpen: false, product: null });
            } else {
                showToast('Error al actualizar el producto', 'error');
            }
        } catch (error) {
            showToast('Error de conexión', 'error');
        } finally {
            setProcessing(false);
        }
    };


    const checkRegisterStatus = async () => {
        try {
            const res = await fetch('/api/cash-register');
            const data = await res.json();
            setRegisterOpen(data.status === 'OPEN');
        } catch {
            setRegisterOpen(false);
        }
    };

    // Interceptar botón físico Atrás del navegador cuando hay venta activa
    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            if (auditLog.length > 0) {
                // Re-push state para que el browser no cambie de página
                window.history.pushState(null, '', window.location.href);
                setShowExitWarning(true);
            }
        };
        // Push initial state so we can catch the back event
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [auditLog.length]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Si hay un modal abierto, no interferir con el foco
            if (isPaymentModalOpen || weightModal.isOpen || showExitWarning) return;

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
            } else if (result.error === 'CAJA_CERRADA') {
                showToast('La caja está cerrada. Abrí el turno antes de vender.', 'error');
                setRegisterOpen(false);
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

    // --- CAJA CERRADA: pantalla de bloqueo ---
    if (registerOpen === false) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950 z-10">
                <div className="text-center max-w-sm px-8 space-y-6">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Caja Cerrada</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                            No podés registrar ventas sin un turno activo. Abrí la caja diaria primero.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/caja"
                            className="btn-primary py-3 text-base w-full"
                        >
                            Ir a Abrir Caja
                        </Link>
                        <Link href="/" className="btn-secondary py-3 text-sm w-full">
                            Volver al Inicio
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-row overflow-hidden bg-slate-50 dark:bg-slate-950 z-10">
            <main className="flex-1 flex flex-col p-6 overflow-hidden">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                if (auditLog.length > 0) {
                                    setShowExitWarning(true);
                                } else {
                                    router.push('/');
                                }
                            }}
                            className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title={auditLog.length > 0 ? 'Tenés una venta en curso' : 'Volver al inicio'}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">Punto de Venta</h1>
                            {auditLog.length > 0 && (
                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Venta en curso • {auditLog.length} acción{auditLog.length !== 1 ? 'es' : ''}</p>
                            )}
                        </div>
                    </div>

                    <div className="relative w-full md:w-80">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Icon name="Search" />
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
                                <Icon name="AlertTriangle" className="w-10 h-10" />
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
                                        <Icon name={cat.icon} className="w-8 h-8" />
                                    </div>
                                    <span className="font-bold text-center">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <button onClick={() => { setSelectedCategory(null); setSearch(''); }} className="text-sm font-medium text-primary flex items-center gap-1 hover:underline">
                                <Icon name="ChevronLeft" className="w-4 h-4" /> Regresar a categorías
                            </button>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredProducts.map(p => (
                                    <div key={p.id} className="card-premium p-4 flex flex-col justify-between hover:border-primary transition-all relative group">
                                        <div className="mb-4">
                                            <div className="flex justify-between items-start">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{p.category?.name || 'Sin categoría'}</p>
                                                <button
                                                    onClick={(e) => handleOpenQuickEdit(e, p)}
                                                    className="p-1 text-slate-300 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Configurar Precio"
                                                >
                                                    <Icon name="Edit" className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <h3 className="font-bold text-sm line-clamp-2">{p.name}</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="text-xl font-bold">${Number(p.price).toLocaleString()}</div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAddToCart(p as any as Product, 1)} className="flex-1 bg-primary text-white py-2 rounded-lg text-xs font-bold hover:bg-primary-dark">SUMAR</button>
                                                <button onClick={() => handleAddToCart(p as any as Product, -1)} className="px-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                                                    <Icon name="Minus" className="w-4 h-4" />
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

            {/* Quick Edit Modal */}
            {quickEditModal.isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <header className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold">{quickEditModal.product?.name}</h2>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Configuración de Precios</p>
                            </div>
                            <button onClick={() => setQuickEditModal({ isOpen: false, product: null })} className="text-slate-400 hover:text-slate-600"><Icon name="X" /></button>
                        </header>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Costo de Compra</label>
                                    <input
                                        type="number" step="0.01"
                                        className="w-full p-2.5 rounded-lg border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-right font-medium"
                                        value={quickEditData.cost}
                                        onChange={e => setQuickEditData({ ...quickEditData, cost: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1 flex flex-col justify-end">
                                    <label
                                        onClick={() => setQuickEditData({ ...quickEditData, hasIva: !quickEditData.hasIva })}
                                        className="flex items-center gap-2 cursor-pointer p-2.5 h-[46px] bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800"
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${quickEditData.hasIva ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white dark:bg-slate-800'}`}>
                                            {quickEditData.hasIva && <Icon name="Check" className="w-3 h-3" />}
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-tighter">Compra con IVA</span>
                                    </label>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Margen de Ganancia (%)</label>
                                    <input
                                        type="number" step="0.1"
                                        className="w-full p-2.5 rounded-lg border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-right font-bold text-primary"
                                        value={quickEditData.margin}
                                        onChange={e => setQuickEditData({ ...quickEditData, margin: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-primary">Precio de Venta Final</label>
                                    <input
                                        required type="number" step="0.01"
                                        className="w-full p-2.5 rounded-lg border-2 border-primary/30 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary text-right font-bold text-xl"
                                        value={quickEditData.price}
                                        onChange={e => setQuickEditData({ ...quickEditData, price: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl flex gap-3 items-start">
                                <Icon name="Sparkles" className="w-5 h-5 text-blue-500 mt-0.5" />
                                <div className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                                    El precio final se calcula sumando el <span className="font-bold">IVA (21%)</span> al costo (si corresponde) y aplicando un <span className="font-bold">{quickEditData.margin}%</span> de margen sobre ese valor. Los cambios se guardarán en la base de datos de productos.
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setQuickEditModal({ isOpen: false, product: null })} className="btn-secondary flex-1 h-12 uppercase tracking-widest text-xs font-bold">Cancelar</button>
                                <button onClick={handleSaveQuickEdit} disabled={processing} className="btn-primary flex-1 h-12 uppercase tracking-widest text-xs font-bold">
                                    {processing ? 'Guardando...' : 'Actualizar Producto'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                            <Icon name="Minus" className="w-5 h-5 inline" />
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
                        <Icon name="ShoppingCart" className="w-12 h-12" />
                        <span className="text-xs font-bold uppercase tracking-widest">Carrito vacío</span>
                    </div>}

                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 space-y-4 shrink-0">
                    <button onClick={() => setIsPaymentModalOpen(true)} className="w-full h-12 flex items-center justify-between px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary group transition-all">
                        <span className="text-sm font-medium">{activePM?.name || 'Método de Pago'}</span>
                        <Icon name="ChevronRight" className="w-4 h-4 text-slate-400 group-hover:text-primary" />
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
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Icon name="X" /></button>
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
                                    <Icon name="Delete" className="w-6 h-6" />
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

            {/* ── Modal Advertencia de Salida ── */}
            {showExitWarning && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-amber-500 p-6 text-white">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                                <AlertTriangle className="w-7 h-7" />
                            </div>
                            <h2 className="text-xl font-bold">Venta en Curso</h2>
                            <p className="text-amber-100 text-sm mt-1">
                                Hay {auditLog.length} acción{auditLog.length !== 1 ? 'es' : ''} registradas en esta sesión
                            </p>
                        </div>

                        <div className="p-6 space-y-3">
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                No podés salir con una venta iniciada. Debés <strong className="text-slate-800 dark:text-white">cobrar</strong> la operación o registrarla como <strong className="text-slate-800 dark:text-white">venta no realizada</strong> antes de salir.
                            </p>

                            <button
                                onClick={() => setShowExitWarning(false)}
                                className="btn-primary w-full py-3"
                            >
                                Continuar la Venta
                            </button>

                            <button
                                onClick={async () => {
                                    setShowExitWarning(false);
                                    await finalizarVenta('VENTA_NO_REALIZADA');
                                    router.push('/');
                                }}
                                className="w-full py-3 rounded-lg font-semibold border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                            >
                                Cancelar y Registrar como No Realizada
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
