'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../components/context/authcontext'
import Navbar from '../components/navbarl'
import Footer from '../components/footer'
import Image from 'next/image'
import {
    FaSearch,
    FaFilter,
    FaShoppingCart,
    FaPlus,
    FaMinus,
    FaTimes,
    FaSpinner,
    FaCheck
} from 'react-icons/fa'

export default function ShopPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [products, setProducts] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([])
    const [cart, setCart] = useState([])
    const [isLoading, setIsLoading] = useState({
        products: true,
        order: false
    })
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filters, setFilters] = useState({
        category: '',
        priceRange: '',
        sortBy: 'name'
    })
    const [showFilters, setShowFilters] = useState(false)
    const [orderSuccess, setOrderSuccess] = useState(false)

    useEffect(() => {
        if (!user) {
            router.push('/login')
        }
    }, [user, router])

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(prev => ({ ...prev, products: true }))
                const response = await fetch('http://localhost:4000/api/products')

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const data = await response.json()
                setProducts(data.data || data || [])
                setFilteredProducts(data.data || data || [])
                setError(null)
            } catch (err) {
                console.error('Failed to fetch products:', err)
                setError(err.message)
                setProducts([])
                setFilteredProducts([])
            } finally {
                setIsLoading(prev => ({ ...prev, products: false }))
            }
        }

        fetchProducts()
    }, [])

    const categories = useMemo(() => {
        return [...new Set(
            products.map(product => product.category?.name).filter(Boolean)
        )]
    }, [products])

    useEffect(() => {
        const filterProducts = () => {
            let result = [...products]

            if (searchTerm) {
                const term = searchTerm.toLowerCase()
                result = result.filter(product => (
                    product.name.toLowerCase().includes(term) ||
                    (product.description && product.description.toLowerCase().includes(term))
                ))
            }

            if (filters.category) {
                result = result.filter(product => (
                    product.category?.name === filters.category
                ))
            }

            if (filters.priceRange) {
                const [min, max] = filters.priceRange.split('-').map(Number)
                result = result.filter(product => {
                    const price = product.price
                    return (!min || price >= min) && (!max || price <= max)
                })
            }

            result.sort((a, b) => {
                if (filters.sortBy === 'price-asc') return a.price - b.price
                if (filters.sortBy === 'price-desc') return b.price - a.price
                return a.name.localeCompare(b.name)
            })

            setFilteredProducts(result)
        }

        const debounceTimer = setTimeout(filterProducts, 300)
        return () => clearTimeout(debounceTimer)
    }, [products, searchTerm, filters])

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id)
            return existingItem
                ? prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
                : [...prevCart, {
                    ...product,
                    quantity: 1,
                    price: Number(product.price.toFixed(2))
                }]
        })
    }

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId))
    }

    const updateQuantity = (productId, newQuantity) => {
        const quantity = Math.max(1, Math.floor(newQuantity))
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === productId ? { ...item, quantity } : item
            )
        )
    }

    const cartTotal = useMemo(() => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
    }, [cart])

    const createOrder = async () => {
        if (!user) {
            router.push('/login')
            return
        }

        if (cart.length === 0) {
            setError('Korpa je prazna.')
            return
        }

        try {
            setIsLoading(prev => ({ ...prev, order: true }))
            setError(null)

            const testEndpoint = await fetch('http://localhost:4000/api/products/verify', {
                method: 'OPTIONS'
            })

            if (testEndpoint.status === 404) {
                throw new Error('API endpoint not found - check your route configuration')
            }

            const verifyRes = await fetch('http://localhost:4000/api/products/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    productIds: cart.map(item => item.id)
                })
            })

            const contentType = verifyRes.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                const text = await verifyRes.text()
                throw new Error(`Invalid response format: ${text.slice(0, 100)}...`)
            }

            const verifiedProducts = await verifyRes.json()

            if (!verifyRes.ok) {
                throw new Error(verifiedProducts.error || 'Failed to verify products')
            }

            const orderRes = await fetch('http://localhost:4000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    items: cart.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                        price: verifiedProducts.find(p => p.id === item.id)?.price || item.price
                    }))
                })
            })

            const orderContentType = orderRes.headers.get('content-type')
            if (!orderContentType || !orderContentType.includes('application/json')) {
                const text = await orderRes.text()
                throw new Error(`Invalid order response: ${text.slice(0, 100)}...`)
            }

            const orderData = await orderRes.json()

            if (!orderRes.ok) {
                throw new Error(orderData.error || 'Failed to create order')
            }

            setOrderSuccess(true)
            setCart([])
            setTimeout(() => setOrderSuccess(false), 5000)
        } catch (err) {
            console.error('Order error:', err)
            setError(err.message)
        } finally {
            setIsLoading(prev => ({ ...prev, order: false }))
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black relative">
            <div className="fixed inset-0 z-0 opacity-20">
                <Image
                    src="/images/hero-bg.jpg"
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            <Navbar />

            <main className="relative z-10 pt-60 pb-16 px-4 sm:px-6 lg:px-8">
                {orderSuccess && (
                    <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-xl z-50 flex items-center animate-fade-in-out">
                        <FaCheck className="mr-2" />
                        Narudžba uspješno kreirana! Možete je preuzeti u salonu.
                    </div>
                )}

                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Cart Sidebar - Always visible */}
                        <div className="w-full lg:w-80 bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-xl shadow-lg p-4 lg:sticky lg:top-32 h-fit max-h-[calc(100vh-10rem)] overflow-hidden flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white flex items-center">
                                    <FaShoppingCart className="mr-2 text-amber-400" />
                                    Vaša korpa
                                </h3>
                                <span className="text-gray-400 text-xs bg-gray-800 px-2 py-1 rounded-full">
                                    {cart.length} {cart.length === 1 ? 'proizvod' : 'proizvoda'}
                                </span>
                            </div>

                            {cart.length === 0 ? (
                                <div className="text-center py-4">
                                    <div className="text-gray-500 text-sm mb-2">Vaša korpa je prazna</div>
                                    <button
                                        onClick={() => setShowFilters(true)}
                                        className="text-amber-400 hover:text-amber-300 text-xs font-medium"
                                    >
                                        Pogledajte proizvode
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                                        {cart.map((item) => (
                                            <div key={item.id} className="flex items-start border-b border-gray-800 pb-3">
                                                <div className="relative w-12 h-12 rounded-md overflow-hidden mr-2 flex-shrink-0">
                                                    <Image
                                                        src={item.imageUrl || '/images/product-placeholder.jpg'}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-white text-xs font-medium truncate">{item.name}</h4>
                                                    <p className="text-amber-400 text-xs">
                                                        {item.price.toFixed(2)} KM
                                                    </p>
                                                    <div className="flex items-center mt-1">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            className="text-gray-400 hover:text-amber-400 p-0.5"
                                                        >
                                                            <FaMinus className="text-xs" />
                                                        </button>
                                                        <span className="mx-1 text-white text-xs w-4 text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="text-gray-400 hover:text-amber-400 p-0.5"
                                                        >
                                                            <FaPlus className="text-xs" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end ml-1">
                                                    <p className="text-white text-xs font-medium mb-1">
                                                        {(item.price * item.quantity).toFixed(2)} KM
                                                    </p>
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="text-gray-400 hover:text-red-500 p-0.5"
                                                    >
                                                        <FaTimes className="text-xs" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-gray-800">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-300 text-sm">Ukupno:</span>
                                            <span className="text-amber-400 font-bold text-lg">{cartTotal.toFixed(2)} KM</span>
                                        </div>

                                        <div className="text-xs text-gray-500 mb-3 italic">
                                            * Proizvodi se preuzimaju u salonu
                                        </div>

                                        <button
                                            onClick={createOrder}
                                            disabled={isLoading.order || cart.length === 0}
                                            className={`w-full py-2 rounded-lg font-medium text-sm flex items-center justify-center ${isLoading.order
                                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                    : 'bg-amber-400 hover:bg-amber-500 text-gray-900 transition-all'
                                                }`}
                                        >
                                            {isLoading.order ? (
                                                <>
                                                    <FaSpinner className="animate-spin mr-1" />
                                                    Procesiranje...
                                                </>
                                            ) : (
                                                'Naruči'
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1">
                            {/* Filters - Hidden by default on mobile */}
                            <div className={`${showFilters ? 'block' : 'hidden'} lg:block bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-xl shadow-lg p-6 mb-6`}>
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                        <FaFilter className="mr-3 text-amber-400" />
                                        Filteri
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Pretraga</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    placeholder="Pretraži proizvode..."
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent pl-10 transition-all"
                                                />
                                                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Kategorija</label>
                                            <select
                                                value={filters.category}
                                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                            >
                                                <option value="">Sve kategorije</option>
                                                {categories.map(category => (
                                                    <option key={category} value={category}>{category}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Sortiraj po</label>
                                            <select
                                                value={filters.sortBy}
                                                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                            >
                                                <option value="name">Nazivu (A-Ž)</option>
                                                <option value="price-asc">Cijeni (niža-viša)</option>
                                                <option value="price-desc">Cijeni (viša-niža)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Products Grid - 3 columns on larger screens */}
                            {isLoading.products ? (
                                <div className="flex justify-center items-center h-64">
                                    <FaSpinner className="animate-spin text-amber-400 text-4xl" />
                                </div>
                            ) : error ? (
                                <div className="bg-red-900/50 border border-red-700 rounded-xl p-6 text-center">
                                    <p className="text-red-300">{error}</p>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
                                    <p className="text-gray-400">Nema proizvoda koji zadovoljavaju vaše kriterije</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden hover:border-amber-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10"
                                        >
                                            <div className="relative h-56 overflow-hidden">
                                                <Image
                                                    src={product.imageUrl || '/images/product-placeholder.jpg'}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="p-5">
                                                <h3 className="text-lg font-bold text-white">{product.name}</h3>
                                                <p className="text-gray-400 text-sm mt-2 line-clamp-3">
                                                    {product.description}
                                                </p>
                                                <div className="mt-4 flex justify-between items-center">
                                                    <p className="text-amber-400 text-lg font-semibold">
                                                        {product.price.toFixed(2)} KM
                                                    </p>
                                                    <button
                                                        onClick={() => addToCart(product)}
                                                        className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-medium py-1.5 px-4 rounded-full text-sm flex items-center transition-all"
                                                    >
                                                        <FaPlus className="mr-1" /> U korpu
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}