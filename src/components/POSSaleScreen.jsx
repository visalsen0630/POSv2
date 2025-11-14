import React, { useState, useEffect } from 'react';
import axios from 'axios';

const POSSaleScreen = ({ session, onLogout }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All items');
  const [searchQuery, setSearchQuery] = useState('');
  const [customer, setCustomer] = useState(null);

  const categories = ['All items', 'Favorites', 'Summer sale', 'Clearance', 'New arrivals'];

  useEffect(() => {
    // Load products from API for the current location
    const fetchProducts = async () => {
      if (!session?.location?.id) return;

      try {
        const response = await axios.get(`http://localhost:5000/api/products?location_id=${session.location.id}`);
        // Add default category and emoji for display
        const productsWithCategory = response.data.map(p => ({
          ...p,
          category: 'All items',
          image: getProductEmoji(p.name),
          price: parseFloat(p.price)
        }));
        setProducts(productsWithCategory);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, [session?.location?.id]);

  // Helper function to get emoji based on product name
  const getProductEmoji = (name) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('shirt') || nameLower.includes('tee')) return '👕';
    if (nameLower.includes('jacket') || nameLower.includes('coat')) return '🧥';
    if (nameLower.includes('pant') || nameLower.includes('jean') || nameLower.includes('denim')) return '👖';
    if (nameLower.includes('bag') || nameLower.includes('satchel')) return '👜';
    if (nameLower.includes('shoe') || nameLower.includes('sneaker')) return '👟';
    if (nameLower.includes('hat') || nameLower.includes('cap')) return '🎩';
    if (nameLower.includes('dress')) return '👗';
    if (nameLower.includes('sweater') || nameLower.includes('sweatshirt')) return '🧶';
    return '📦'; // Default emoji
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1, size: 'Medium' }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.0875; // 8.75% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const filteredProducts = products.filter(product =>
    (selectedCategory === 'All items' || product.category === selectedCategory) &&
    (searchQuery === '' || product.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {/* QR Scanner */}
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </button>
        </div>

        {/* Store Info */}
        <div className="text-right text-sm">
          <div className="font-semibold">{session?.company?.name}</div>
          <div className="text-gray-500">{session?.location?.name}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Products */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category Tabs */}
          <div className="bg-white border-b px-6">
            <div className="flex gap-6 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`py-4 px-2 border-b-2 transition whitespace-nowrap ${
                    selectedCategory === category
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden group"
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-6xl">
                    {product.image}
                  </div>
                  <div className="p-4">
                    <div className="font-semibold text-gray-900 mb-1">{product.name}</div>
                    <div className="text-lg font-bold text-gray-700">${product.price.toFixed(2)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Cart */}
        <div className="w-96 bg-white border-l flex flex-col">
          {/* Customer Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-blue-600">
                  {customer ? customer.name : 'Walk-in Customer'}
                </h2>
                <p className="text-sm text-gray-500">{cart.length} items</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-auto">
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p>Cart is empty</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="font-semibold text-gray-700 mb-4">In store ({cart.length})</div>
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3 pb-4 border-b">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center text-2xl flex-shrink-0">
                      {item.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-semibold text-gray-900">
                          {item.name} × {item.quantity}
                        </div>
                        <div className="font-bold text-gray-900 whitespace-nowrap">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mb-2">Medium</div>
                      {item.sku && (
                        <div className="text-xs text-gray-400 mb-2">SKU: {item.sku}</div>
                      )}
                      <div className="text-sm text-gray-600">${item.price.toFixed(2)} ea</div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                        >
                          −
                        </button>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-sm ml-auto"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="border-t">
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold">${calculateTax().toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="text-sm text-gray-600 mb-2">Shipment (1)</div>
                  <div className="text-xs text-gray-500">
                    {session?.location?.name}, {session?.location?.address}, {session?.location?.city}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 flex gap-3">
                <button
                  onClick={() => setCart([])}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
                >
                  Save cart
                </button>
                <button
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                >
                  Charge ${calculateTotal().toFixed(2)}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-gray-900 text-white flex items-center justify-around py-3">
        <button
          onClick={onLogout}
          className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-gray-800 rounded transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-xs">Logout {session?.user?.full_name?.split(' ')[0]}</span>
        </button>
        <button className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-gray-800 rounded transition text-blue-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-xs">Checkout</span>
        </button>
        <button className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-gray-800 rounded transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-xs">Inventory</span>
        </button>
        <button className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-gray-800 rounded transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs">Transactions</span>
        </button>
        <button className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-gray-800 rounded transition relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-xs">Notifications</span>
        </button>
        <button className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-gray-800 rounded transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-xs">More</span>
        </button>
      </div>
    </div>
  );
};

export default POSSaleScreen;
