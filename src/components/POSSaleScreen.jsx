import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProducts, getCategories, getCurrentShift, openShift, closeShift,
  getPaymentMethods, getDiscounts, getConfig, createSale,
  searchCustomerByPhone, validateVoucher, incrementVoucherUsage
} from '../firebase/db';

const POSSaleScreen = ({ session, onLogout }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All items');
  const [searchQuery, setSearchQuery] = useState('');
  const [customer, setCustomer] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showPostShiftModal, setShowPostShiftModal] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [actualCashUSD, setActualCashUSD] = useState('');
  const [actualCashKHR, setActualCashKHR] = useState('');
  const [openingCashUSD, setOpeningCashUSD] = useState('');
  const [openingCashKHR, setOpeningCashKHR] = useState('');
  const [shiftCloseSummary, setShiftCloseSummary] = useState(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tenderedUSD, setTenderedUSD] = useState(0);
  const [tenderedKHR, setTenderedKHR] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0); // From customer or manual
  const [discountType, setDiscountType] = useState(''); // 'fixed' or 'percent'
  const [discountValue, setDiscountValue] = useState(0); // The discount amount/percentage value
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherAmount, setVoucherAmount] = useState(0);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [serviceChargeRate, setServiceChargeRate] = useState(0); // Service charge percentage from config
  const [taxRate, setTaxRate] = useState(8.75); // Tax rate from config
  const [exchangeRate] = useState(4100); // USD to KHR rate
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false); // Hamburger menu state
  const [paymentMethods, setPaymentMethods] = useState([]); // Payment methods from API
  const [availableDiscounts, setAvailableDiscounts] = useState([]); // Discounts from Dashboard
  const [selectedDiscount, setSelectedDiscount] = useState(null); // Selected discount from list
  const [actionButtons, setActionButtons] = useState([]); // Action buttons from Dashboard config
  const [activeParentButton, setActiveParentButton] = useState(null); // For showing sub-buttons popup

  // Mock customer data (replace with API fetch)
  const mockCustomers = {
    '01200693': { id: 1, name: 'John Doe', phone: '01200693', membership: 'Gold' }
  };

  useEffect(() => {
    // Load products from API for the current location
    const fetchProducts = async () => {
      if (!session?.location?.id) return;

      try {
        const response = await getProducts(session.location.id, session.company.id);
        // Add emoji for display
        const productsWithEmoji = response.map(p => ({
          ...p,
          image: getProductEmoji(p.name),
          price: parseFloat(p.price)
        }));
        setProducts(productsWithEmoji);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, [session?.location?.id]);

  useEffect(() => {
    // Load categories from API (location-specific)
    const fetchCategories = async () => {
      if (!session?.company?.id || !session?.location?.id) return;

      try {
        const response = await getCategories(session.company.id, session.location.id);
        setCategories(response);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [session?.company?.id, session?.location?.id]);

  useEffect(() => {
    // Fetch current shift status
    const fetchShiftStatus = async () => {
      if (!session?.location?.id) return;

      try {
        const shift = await getCurrentShift(session.location.id);
        if (!shift) {
          setShowOpenShiftModal(true);
        } else {
          setCurrentShift(shift);
        }
      } catch (error) {
        console.error('Error fetching shift status:', error);
      }
    };

    fetchShiftStatus();
  }, [session?.location?.id, session?.user?.id]);

  useEffect(() => {
    // Fetch payment methods from API
    const fetchPaymentMethods = async () => {
      if (!session?.company?.id || !session?.location?.id) return;

      try {
        const response = await getPaymentMethods(session.company.id, session.location.id);
        setPaymentMethods(response);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        setPaymentMethods([
          { method_name: 'cash', display_name: 'Cash' },
          { method_name: 'card', display_name: 'Card' },
          { method_name: 'qr', display_name: 'QR Code' },
        ]);
      }
    };

    fetchPaymentMethods();
  }, [session?.company?.id, session?.location?.id]);

  useEffect(() => {
    // Fetch discounts from Dashboard
    const fetchDiscounts = async () => {
      if (!session?.company?.id) return;

      try {
        const response = await getDiscounts(session.company.id, session.location?.id);
        const activeDiscounts = response.filter(d => d.is_active);
        setAvailableDiscounts(activeDiscounts);
      } catch (error) {
        console.error('Error fetching discounts:', error);
      }
    };

    fetchDiscounts();
  }, [session?.company?.id, session?.location?.id]);

  useEffect(() => {
    // Fetch tax rate and service charge from configs
    const fetchConfigs = async () => {
      if (!session?.company?.id) return;

      try {
        const taxConf = await getConfig(session.company.id, session.location?.id || '', 'tax_rate');
        const scConf = await getConfig(session.company.id, session.location?.id || '', 'service_charge');
        if (taxConf?.value) setTaxRate(parseFloat(taxConf.value));
        if (scConf?.value) setServiceChargeRate(parseFloat(scConf.value));
      } catch (error) {
        console.error('Error fetching configs:', error);
        // Keep default values
      }
    };

    fetchConfigs();
  }, [session?.company?.id]);

  useEffect(() => {
    // Fetch action buttons from Dashboard config
    const fetchActionButtons = async () => {
      if (!session?.company?.id) return;

      try {
        const conf = await getConfig(session.company.id, session.location?.id || '', 'action_buttons');
        const buttons = conf?.value || [];
        const activeButtons = buttons.filter(b => b.is_active).sort((a, b) => (a.position || 0) - (b.position || 0));
        setActionButtons(activeButtons);
      } catch (error) {
        console.error('Error fetching action buttons:', error);
        // Keep empty array - will use default buttons
      }
    };

    fetchActionButtons();
  }, [session?.company?.id, session?.location?.id]);

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
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    const newQuantity = currentQtyInCart + 1;

    // Check stock availability
    if (newQuantity > product.stock && !product.backorder_allowed) {
      alert(`Insufficient stock for ${product.name}. Available: ${product.stock}, In cart: ${currentQtyInCart}. Backorder not allowed for this product.`);
      return;
    }

    // Show warning if exceeding stock but backorder is allowed
    if (newQuantity > product.stock && product.backorder_allowed) {
      if (!confirm(`${product.name} has only ${product.stock} in stock. You're ordering ${newQuantity}. Continue with backorder?`)) {
        return;
      }
    }

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
      const cartItem = cart.find(item => item.id === productId);
      if (!cartItem) return;

      // Check stock availability when increasing quantity
      if (newQuantity > cartItem.quantity) {
        const product = products.find(p => p.id === productId);
        if (product && newQuantity > product.stock && !product.backorder_allowed) {
          alert(`Insufficient stock for ${product.name}. Available: ${product.stock}. Backorder not allowed.`);
          return;
        }

        if (product && newQuantity > product.stock && product.backorder_allowed) {
          if (!confirm(`${product.name} has only ${product.stock} in stock. Continue with backorder?`)) {
            return;
          }
        }
      }

      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    // Priority: Manual discount > Customer membership discount
    if (discountType === 'fixed') {
      return parseFloat(discountValue || 0);
    }
    if (discountType === 'percent') {
      return (calculateSubtotal() * parseFloat(discountValue || 0)) / 100;
    }
    if (customer?.membership_discount) {
      return (calculateSubtotal() * parseFloat(customer.membership_discount || 0)) / 100;
    }
    // Fallback to old discountPercent if set
    return (calculateSubtotal() * discountPercent) / 100;
  };

  const calculateServiceCharge = () => {
    const afterDiscount = calculateSubtotal() - calculateDiscount() - voucherAmount;
    return afterDiscount * (serviceChargeRate / 100);
  };

  const calculateTax = () => {
    const afterDiscount = calculateSubtotal() - calculateDiscount() - voucherAmount;
    const withService = afterDiscount + calculateServiceCharge();
    return withService * (taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount() - voucherAmount + calculateServiceCharge() + calculateTax();
  };

  const calculateTendered = () => {
    return parseFloat(tenderedUSD || 0) + (parseFloat(tenderedKHR || 0) / exchangeRate);
  };

  const calculateChange = () => {
    const tendered = calculateTendered();
    const total = calculateTotal();
    return tendered - total;
  };

  const calculateChangeKHR = () => {
    return calculateChange() * exchangeRate;
  };

  const handleCustomerSearch = async () => {
    try {
      const response = await searchCustomerByPhone(session.company.id, customerPhone);
      if (!response) throw new Error('Customer not found');
      setCustomer(response);
      setShowCustomerSearch(false);
      const discountPct = response.membership_discount || 0;
      alert(`Customer found: ${response.full_name} (${response.membership_level} - ${discountPct}% discount will be applied)`);
    } catch (error) {
      console.error('Customer search error:', error);
      alert('Customer not found. Please check the phone number.');
    }
  };

  const handleDiscountApply = () => {
    setShowDiscountModal(false);
    if (selectedDiscount) {
      // Apply discount from Dashboard
      const discType = selectedDiscount.type === 'percentage' ? 'percent' : 'fixed';
      const discVal = parseFloat(selectedDiscount.value);
      setDiscountType(discType);
      setDiscountValue(discVal);
      const message = discType === 'fixed'
        ? `${selectedDiscount.name}: $${discVal.toFixed(2)} discount applied.`
        : `${selectedDiscount.name}: ${discVal}% discount applied.`;
      alert(message);
    } else if (discountType && discountValue > 0) {
      const message = discountType === 'fixed'
        ? `$${discountValue} discount applied.`
        : `${discountValue}% discount applied.`;
      alert(message);
    }
  };

  const handleValidateVoucher = async () => {
    try {
      const voucher = await validateVoucher(session.company.id, voucherCode);
      if (voucher) {
        let discountAmt = 0;
        const subtotal = calculateSubtotal();
        if (voucher.type === 'percentage') {
          discountAmt = subtotal * (parseFloat(voucher.value) / 100);
          if (voucher.max_discount) discountAmt = Math.min(discountAmt, parseFloat(voucher.max_discount));
        } else {
          discountAmt = parseFloat(voucher.value);
        }
        if (voucher.min_purchase && subtotal < parseFloat(voucher.min_purchase)) {
          alert(`Minimum purchase $${parseFloat(voucher.min_purchase).toFixed(2)} required`);
          return;
        }
        await incrementVoucherUsage(voucher.id);
        setVoucherAmount(discountAmt);
        setShowVoucherModal(false);
        alert(`Voucher applied! Discount: $${discountAmt.toFixed(2)}`);
      } else {
        alert('Invalid or expired voucher');
      }
    } catch (error) {
      console.error('Voucher validation error:', error);
      alert(error?.error || 'Voucher validation failed. Please check the code.');
    }
  };

  const handleOpenShift = async () => {
    try {
      const shiftId = await openShift({
        company_id: session.company.id,
        location_id: session.location.id,
        user_id: session.user.id,
        opening_cash_usd: parseFloat(openingCashUSD) || 0,
        opening_cash_khr: parseFloat(openingCashKHR) || 0,
      });
      setCurrentShift({ id: shiftId, company_id: session.company.id, location_id: session.location.id });
      setShowOpenShiftModal(false);
      setOpeningCashUSD('');
      setOpeningCashKHR('');
      alert('Shift opened successfully!');
    } catch (error) {
      console.error('Error opening shift:', error);
      alert('Failed to open shift. Please try again.');
    }
  };

  const handleCloseShift = async () => {
    if (!currentShift) {
      alert('No active shift to close');
      return;
    }

    try {
      await closeShift(currentShift.id, {
        actual_cash_usd: parseFloat(actualCashUSD) || 0,
        actual_cash_khr: parseFloat(actualCashKHR) || 0,
        notes: ''
      });
      setShiftCloseSummary({ shift_id: currentShift.id });
      setShowCloseShiftModal(false);
      setShowTerminalModal(false);
      setShowPostShiftModal(true);
      setActualCashUSD('');
      setActualCashKHR('');
      setCurrentShift(null);
    } catch (error) {
      console.error('Error closing shift:', error);
      alert('Failed to close shift. Please try again.');
    }
  };

  const handleCloseTerminal = () => {
    setShowPostShiftModal(false);
    alert('Terminal closed. Logging out...');
    onLogout();
  };

  const handleOpenNewShift = () => {
    setShowPostShiftModal(false);
    setShiftCloseSummary(null);
    setShowOpenShiftModal(true);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const total = calculateTotal();
      const saleData = {
        company_id: session.company.id,
        location_id: session.location.id,
        location_name: session.location.name,
        user_id: session.user.id,
        customer_id: customer?.id || null,
        phone: customer?.phone || null,
        order_type: 'dine_in',
        payment_method: paymentMethod,
        subtotal: calculateSubtotal(),
        discount: calculateDiscount(),
        tax: calculateTax(),
        total_amount: total,
        ...(paymentMethod === 'cash' && {
          tendered_usd: tenderedUSD,
          tendered_khr: tenderedKHR,
          change_usd: Math.max(0, calculateChange()),
          change_khr: Math.max(0, calculateChangeKHR())
        }),
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        }))
      };

      await createSale(saleData);
      alert(`Sale completed! Total: $${total.toFixed(2)}`);

      // Clear cart and inputs
      setCart([]);
      setTenderedUSD(0);
      setTenderedKHR(0);
      setDiscountPercent(0);
      setDiscountType('');
      setDiscountValue(0);
      setVoucherCode('');
      setVoucherAmount(0);
      setCustomer(null);
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to complete sale: ' + (error.error || error.message));
    }
  };

  const handleNavigation = (path) => {
    if (cart.length > 0) {
      const confirmed = confirm(
        'You have items in your cart. Please checkout first or clear cart before navigating away.'
      );
      if (!confirmed) {
        return; // Don't navigate
      }
    }
    setShowHamburgerMenu(false);
    navigate(path);
  };

  // Handle action button clicks based on action_type from dashboard config
  const handleActionButtonClick = (button) => {
    // If this is a parent button with sub-buttons, show the sub-buttons popup
    if (button.button_type === 'parent' && button.sub_buttons && button.sub_buttons.length > 0) {
      setActiveParentButton(activeParentButton?.id === button.id ? null : button);
      return;
    }

    // Close sub-buttons popup if open
    setActiveParentButton(null);

    // Get action config (could be stored as JSON string or object)
    const actionConfig = typeof button.action_config === 'string'
      ? JSON.parse(button.action_config || '{}')
      : (button.action_config || {});

    switch (button.action_type) {
      case 'open_modal':
        // Open specific modal based on config
        const modalType = actionConfig.modal_type || 'discount';
        if (modalType === 'discount') setShowDiscountModal(true);
        else if (modalType === 'voucher') setShowVoucherModal(true);
        else if (modalType === 'customer') setShowCustomerSearch(true);
        else if (modalType === 'payment') setShowPaymentModal(true);
        else alert(`Modal: ${modalType}`);
        break;

      case 'search_member':
        setShowCustomerSearch(true);
        break;

      case 'discount_percent':
        const percentValue = parseFloat(actionConfig.percent_value || 0);
        if (percentValue > 0) {
          setDiscountType('percent');
          setDiscountValue(percentValue);
          setSelectedDiscount(null);
          alert(`${button.label}: ${percentValue}% discount applied`);
        } else {
          setShowDiscountModal(true);
        }
        break;

      case 'discount_fixed':
        const fixedValue = parseFloat(actionConfig.fixed_value || 0);
        if (fixedValue > 0) {
          setDiscountType('fixed');
          setDiscountValue(fixedValue);
          setSelectedDiscount(null);
          alert(`${button.label}: $${fixedValue} discount applied`);
        } else {
          setShowDiscountModal(true);
        }
        break;

      case 'scan_barcode':
        // Focus on search bar for barcode scanning
        const searchInput = document.querySelector('input[placeholder="Search"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        break;

      case 'manual_code_input':
        const code = prompt('Enter product code:');
        if (code) {
          setSearchQuery(code);
        }
        break;

      case 'navigate':
        const targetPage = actionConfig.target_page || '/sale';
        handleNavigation(targetPage);
        break;

      case 'trigger_calculation':
        // Recalculate totals (already handled reactively, but can force update)
        alert(`Subtotal: $${calculateSubtotal().toFixed(2)}\nDiscount: $${calculateDiscount().toFixed(2)}\nTax: $${calculateTax().toFixed(2)}\nTotal: $${calculateTotal().toFixed(2)}`);
        break;

      case 'print_receipt':
        window.print();
        break;

      case 'open_drawer':
        alert('Cash drawer opened');
        // In real implementation, this would send command to cash drawer
        break;

      case 'hold_order':
        if (cart.length > 0) {
          const heldOrder = {
            items: [...cart],
            customer,
            discountType,
            discountValue,
            voucherCode,
            voucherAmount,
            timestamp: new Date().toISOString()
          };
          const heldOrders = JSON.parse(localStorage.getItem('heldOrders') || '[]');
          heldOrders.push(heldOrder);
          localStorage.setItem('heldOrders', JSON.stringify(heldOrders));
          setCart([]);
          setCustomer(null);
          setDiscountType('');
          setDiscountValue(0);
          setVoucherCode('');
          setVoucherAmount(0);
          alert('Order held successfully');
        } else {
          alert('No items in cart to hold');
        }
        break;

      case 'void_item':
        if (cart.length > 0) {
          const newCart = [...cart];
          newCart.pop();
          setCart(newCart);
          alert('Last item voided');
        }
        break;

      case 'clear_cart':
        if (cart.length > 0 && confirm('Clear all items from cart?')) {
          setCart([]);
          setDiscountPercent(0);
          setDiscountType('');
          setDiscountValue(0);
          setVoucherCode('');
          setVoucherAmount(0);
          setCustomer(null);
          setSelectedDiscount(null);
        }
        break;

      case 'apply_voucher':
        setShowVoucherModal(true);
        break;

      case 'payment_cash':
        setPaymentMethod('cash');
        if (cart.length > 0) setShowPaymentModal(true);
        else alert('Cart is empty');
        break;

      case 'payment_card':
        setPaymentMethod('card');
        if (cart.length > 0) setShowPaymentModal(true);
        else alert('Cart is empty');
        break;

      case 'payment_qr':
        setPaymentMethod('qr');
        if (cart.length > 0) setShowPaymentModal(true);
        else alert('Cart is empty');
        break;

      case 'custom_action':
        const customCode = actionConfig.custom_code || '';
        if (customCode) {
          alert(`Custom action: ${customCode}`);
        }
        break;

      // Legacy action types for backwards compatibility
      case 'discount':
        if (button.action_value) {
          setDiscountType('percent');
          setDiscountValue(parseFloat(button.action_value));
          alert(`${button.label}: ${button.action_value}% discount applied`);
        } else {
          setShowDiscountModal(true);
        }
        break;

      case 'print':
        window.print();
        break;

      case 'voucher':
        setShowVoucherModal(true);
        break;

      case 'member':
        setShowCustomerSearch(true);
        break;

      case 'cash_payment':
        setPaymentMethod('cash');
        if (cart.length > 0) setShowPaymentModal(true);
        break;

      case 'card_payment':
        setPaymentMethod('card');
        if (cart.length > 0) setShowPaymentModal(true);
        break;

      case 'custom_function':
        if (button.action_value) {
          alert(`Custom action: ${button.action_value}`);
        }
        break;

      default:
        alert(`Action: ${button.label}`);
    }
  };

  // Get icon SVG path based on icon name or action type
  const getActionButtonIcon = (button) => {
    // First check if button has a specific icon set
    const iconName = button.icon || button.action_type;

    const icons = {
      // Named icons from Dashboard config
      tag: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
      percent: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z",
      dollar: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      qrcode: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z",
      barcode: "M4 6h16M4 10h16M4 14h16M4 18h16",
      cash: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
      card: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
      printer: "M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z",
      trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
      clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      ban: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
      cog: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",

      // Action type based icons (legacy support)
      discount: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
      discount_percent: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z",
      discount_fixed: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      open_modal: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
      search_member: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      scan_barcode: "M4 6h16M4 10h16M4 14h16M4 18h16",
      manual_code_input: "M3 8l4-4 4 4m6-4l4 4-4 4M5 20h14",
      navigate: "M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z",
      trigger_calculation: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
      print_receipt: "M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z",
      print: "M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z",
      open_drawer: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
      hold_order: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      void_item: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
      clear_cart: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
      apply_voucher: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z",
      voucher: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z",
      member: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      payment_cash: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
      cash_payment: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
      payment_card: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
      card_payment: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
      payment_qr: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z",
      custom_action: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      custom_function: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",

      // Parent button indicator
      parent: "M4 6h16M4 10h16M4 14h16M4 18h16"
    };

    return icons[iconName] || icons.cog;
  };

  // Default action buttons if none configured
  const defaultActionButtons = [
    { id: 1, label: 'KHQR', action_type: 'custom_function', action_value: 'KHQR coming soon', color: '#6B7280', position: 1 },
    { id: 2, label: 'Cash', action_type: 'cash_payment', color: '#6B7280', position: 2 },
    { id: 3, label: 'Bank Card', action_type: 'card_payment', color: '#6B7280', position: 3 },
    { id: 4, label: 'Voucher', action_type: 'voucher', color: '#6B7280', position: 4 },
    { id: 5, label: 'Digital Wallet', action_type: 'custom_function', action_value: 'Digital Wallet coming soon', color: '#6B7280', position: 5 },
    { id: 6, label: 'Promotion', action_type: 'discount', color: '#6B7280', position: 6 },
    { id: 7, label: 'Member', action_type: 'member', color: '#6B7280', position: 7 },
    { id: 8, label: 'Clear', action_type: 'clear_cart', color: '#6B7280', position: 8 },
    { id: 9, label: 'Settings', action_type: 'custom_function', action_value: 'settings', color: '#6B7280', position: 9 }
  ];

  // Use configured buttons or default ones
  const displayActionButtons = actionButtons.length > 0 ? actionButtons : defaultActionButtons;

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All items' || product.category_id === selectedCategory;
    const matchesSearch = searchQuery === '' || product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header with Hamburger Menu */}
      <div className="bg-white shadow-sm px-6 py-3 flex items-center gap-4">
        {/* Hamburger Button */}
        <button
          onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-2xl">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Search Button */}
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          Search
        </button>

        {/* Store Info */}
        <div className="text-right text-sm">
          <div className="font-semibold">{session?.company?.name}</div>
          <div className="text-gray-500">{session?.location?.name}</div>
        </div>
      </div>

      {/* Hamburger Menu Modal */}
      {showHamburgerMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowHamburgerMenu(false)}>
          <div className="bg-white w-80 h-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Menu</h2>
              <button onClick={() => setShowHamburgerMenu(false)} className="p-2 hover:bg-gray-100 rounded">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2">
              <button onClick={() => { setShowHamburgerMenu(false); cart.length > 0 ? setShowPaymentModal(true) : alert('Cart is empty!'); }}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-blue-50 rounded-lg transition">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="font-medium">Checkout</span>
              </button>

              <button onClick={() => handleNavigation('/sale')}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-blue-50 rounded-lg transition">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">Sale</span>
              </button>

              <button onClick={() => handleNavigation('/report')}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-blue-50 rounded-lg transition">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">Report</span>
              </button>

              <button onClick={() => handleNavigation('/more')}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-blue-50 rounded-lg transition">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">Setting</span>
              </button>

              <div className="mt-4 pt-4 border-t">
                <button onClick={() => {
                  setShowHamburgerMenu(false);
                  if (confirm('Are you sure you want to logout?')) {
                    onLogout();
                  }
                }}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-red-50 rounded-lg transition">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium text-red-600">Logout</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Products */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category Tabs */}
          <div className="bg-white border-b px-6">
            <div className="flex gap-1 overflow-x-auto">
              {/* All items - always first */}
              <button
                onClick={() => setSelectedCategory('All items')}
                className={`py-3 px-6 font-medium whitespace-nowrap ${
                  selectedCategory === 'All items'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                }`}
              >
                All
              </button>

              {/* Dynamic categories from database */}
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`py-3 px-6 font-medium whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-6 gap-3">
              {filteredProducts.map(product => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= 10;
                const cartItem = cart.find(item => item.id === product.id);
                const qtyInCart = cartItem ? cartItem.quantity : 0;

                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden ${
                      isOutOfStock && !product.backorder_allowed ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={isOutOfStock && !product.backorder_allowed}
                  >
                    {/* Product Image */}
                    <div className="aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url.startsWith('http') ? product.image_url : `${API_BASE_URL}${product.image_url}`}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-4xl">{product.image || '📦'}</div>
                      )}

                      {/* Stock badges */}
                      {isOutOfStock && (
                        <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-semibold ${
                          product.backorder_allowed ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {product.backorder_allowed ? 'BO' : 'Out'}
                        </div>
                      )}
                      {isLowStock && !isOutOfStock && (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-yellow-500 text-white">
                          Low
                        </div>
                      )}
                      {qtyInCart > 0 && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white">
                          {qtyInCart}
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-2 text-left">
                      <div className="font-medium text-xs line-clamp-2 mb-1">{product.name}</div>
                      <div className="text-sm font-bold text-gray-900">${product.price.toFixed(2)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Order Details */}
        <div className="w-96 bg-white border-l flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-bold">Order Details</h2>
            <p className="text-sm text-gray-500">{cart.length} items</p>
          </div>


          {/* Applied Discounts/Vouchers/Customer Indicator */}
          {(customer || discountType || voucherAmount > 0) && (
            <div className="px-3 py-2 bg-yellow-50 border-b space-y-1">
              {customer && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-700 font-medium">👤 {customer.full_name} ({customer.membership_level})</span>
                  <button onClick={() => setCustomer(null)} className="text-red-500 hover:text-red-700">✕</button>
                </div>
              )}
              {discountType && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-orange-700 font-medium">
                    🏷️ {selectedDiscount ? selectedDiscount.name : 'Manual'}: {discountType === 'fixed' ? `$${discountValue}` : `${discountValue}%`}
                  </span>
                  <button onClick={() => { setDiscountType(''); setDiscountValue(0); setSelectedDiscount(null); }} className="text-red-500 hover:text-red-700">✕</button>
                </div>
              )}
              {voucherAmount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-700 font-medium">🎟️ Voucher: ${voucherAmount.toFixed(2)}</span>
                  <button onClick={() => { setVoucherAmount(0); setVoucherCode(''); }} className="text-red-500 hover:text-red-700">✕</button>
                </div>
              )}
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-auto p-4">
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
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-2 pb-2 border-b">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{item.name}</div>
                      <div className="text-xs text-gray-600">${item.price.toFixed(2)} × {item.quantity}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <div className="font-bold text-sm w-16 text-right">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {cart.length > 0 && (
            <div className="border-t p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
              </div>
              {(discountType || customer?.membership_discount || discountPercent > 0) && calculateDiscount() > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>
                    Discount
                    {discountType === 'fixed' && ' (Fixed)'}
                    {discountType === 'percent' && ` (${discountValue}%)`}
                    {customer?.membership_discount && !discountType && ` (${customer.membership_level} ${customer.membership_discount}%)`}
                    {discountPercent > 0 && !discountType && !customer && ` (${discountPercent}%)`}
                  </span>
                  <span>-${calculateDiscount().toFixed(2)}</span>
                </div>
              )}
              {voucherAmount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Voucher ({voucherCode})</span>
                  <span>-${voucherAmount.toFixed(2)}</span>
                </div>
              )}
              {serviceChargeRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Service Charge ({serviceChargeRate}%)</span>
                  <span className="font-medium">${calculateServiceCharge().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({taxRate}%)</span>
                <span className="font-medium">${calculateTax().toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Action Buttons - Sticky at Bottom */}
          <div className="border-t p-3 bg-gray-50 mt-auto">
            {/* Grid of action buttons - 3 columns, dynamically loaded from dashboard config */}
            <div className="grid grid-cols-3 gap-2 mb-3 relative">
              {displayActionButtons.slice(0, 9).map((button, index) => {
                const isParent = button.button_type === 'parent';
                const hasSubButtons = isParent && button.sub_buttons && button.sub_buttons.length > 0;
                const isActive = activeParentButton?.id === button.id;

                // Parse sub_buttons if it's a string
                const subButtons = hasSubButtons
                  ? (typeof button.sub_buttons === 'string' ? JSON.parse(button.sub_buttons) : button.sub_buttons)
                  : [];

                return (
                  <div key={button.id || index} className="relative">
                    <button
                      onClick={() => handleActionButtonClick(button)}
                      className={`w-full flex flex-col items-center justify-center py-2 px-1 bg-white border rounded-xl hover:bg-gray-50 transition ${
                        isActive ? 'ring-2 ring-blue-500' : ''
                      }`}
                      style={{ ...(button.color ? { borderColor: button.color, borderWidth: '2px' } : { borderColor: '#E5E7EB' }), height: '72px' }}
                      style={button.color ? { borderColor: button.color, borderWidth: '2px' } : { borderColor: '#E5E7EB' }}
                    >
                      <div className="relative">
                        <svg
                          className="w-5 h-5 mb-1"
                          style={{ color: button.color || '#4B5563' }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getActionButtonIcon(button)} />
                        </svg>
                        {/* Show indicator for parent buttons */}
                        {hasSubButtons && (
                          <div className="absolute -top-1 -right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <span
                        className="text-xs font-medium text-center line-clamp-1"
                        style={{ color: button.color || '#374151' }}
                      >
                        {button.label}
                      </span>
                      {/* Chevron for parent buttons */}
                      {hasSubButtons && (
                        <svg
                          className={`w-3 h-3 mt-0.5 transition-transform ${isActive ? 'rotate-180' : ''}`}
                          style={{ color: button.color || '#9CA3AF' }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>

                    {/* Sub-buttons popup */}
                    {isActive && subButtons.length > 0 && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                        <div className="p-2 bg-gray-50 border-b text-xs font-semibold text-gray-600">
                          {button.label}
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {subButtons.map((subBtn, subIndex) => (
                            <button
                              key={subBtn.id || subIndex}
                              onClick={() => {
                                handleActionButtonClick(subBtn);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition text-left border-b border-gray-100 last:border-0"
                            >
                              <svg
                                className="w-4 h-4 flex-shrink-0"
                                style={{ color: subBtn.color || button.color || '#4B5563' }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getActionButtonIcon(subBtn)} />
                              </svg>
                              <span className="text-sm" style={{ color: subBtn.color || '#374151' }}>
                                {subBtn.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Click outside to close sub-buttons popup */}
            {activeParentButton && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setActiveParentButton(null)}
              />
            )}

            {/* Bottom status bar */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
              <span>{session?.location?.name || 'POS'}</span>
              <span>{currentShift ? `Shift ${currentShift.id}` : 'No Shift'}</span>
              <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Modal with Customer Search */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Apply Discount</h3>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search by Customer Number */}
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-sm mb-2 text-blue-900">Search by Customer Number</h4>
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Enter phone number (e.g., 01200693)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleCustomerSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
              {customer && (
                <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                  <p className="text-sm font-semibold text-green-700">✓ {customer.full_name}</p>
                  <p className="text-xs text-gray-600">Member: {customer.membership_level} - {customer.membership_discount}% discount will be applied</p>
                </div>
              )}
            </div>

            {/* Available Discounts from Dashboard */}
            {availableDiscounts.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="font-semibold text-sm text-gray-700">Available Discounts:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableDiscounts.map((discount) => {
                    const meetsMinPurchase = calculateSubtotal() >= parseFloat(discount.min_purchase || 0);
                    return (
                      <button
                        key={discount.id}
                        onClick={() => {
                          if (meetsMinPurchase) {
                            setSelectedDiscount(discount);
                            setDiscountType(discount.type === 'percentage' ? 'percent' : 'fixed');
                            setDiscountValue(parseFloat(discount.value));
                          }
                        }}
                        disabled={!meetsMinPurchase}
                        className={`w-full p-3 rounded-lg border text-left transition ${
                          selectedDiscount?.id === discount.id
                            ? 'border-orange-500 bg-orange-50'
                            : meetsMinPurchase
                              ? 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                              : 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">{discount.name}</span>
                          <span className="font-bold text-orange-600">
                            {discount.type === 'percentage' ? `${discount.value}%` : `$${parseFloat(discount.value).toFixed(2)}`}
                          </span>
                        </div>
                        {parseFloat(discount.min_purchase || 0) > 0 && (
                          <p className={`text-xs mt-1 ${meetsMinPurchase ? 'text-green-600' : 'text-red-500'}`}>
                            {meetsMinPurchase ? '✓' : '✗'} Min. purchase: ${parseFloat(discount.min_purchase).toFixed(2)}
                          </p>
                        )}
                        {discount.max_discount && discount.type === 'percentage' && (
                          <p className="text-xs text-gray-500 mt-1">
                            Max discount: ${parseFloat(discount.max_discount).toFixed(2)}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Manual Discount Selection */}
            <div className="space-y-4 mt-4">
              <h4 className="font-semibold text-sm mb-2 text-gray-700">
                {availableDiscounts.length > 0 ? 'Or apply manual discount:' : 'Apply manual discount:'}
              </h4>

              {/* Discount Type Selection */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedDiscount(null);
                    setDiscountType('fixed');
                    setDiscountValue(0);
                  }}
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    discountType === 'fixed' && !selectedDiscount
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Fixed Amount
                </button>
                <button
                  onClick={() => {
                    setSelectedDiscount(null);
                    setDiscountType('percent');
                    setDiscountValue(0);
                  }}
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    discountType === 'percent' && !selectedDiscount
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Percentage
                </button>
              </div>

              {/* Discount Value Input - only show for manual discount */}
              {discountType && !selectedDiscount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {discountType === 'fixed' ? 'Enter discount amount ($)' : 'Enter discount percentage (%)'}
                  </label>
                  <input
                    type="number"
                    step={discountType === 'fixed' ? '0.01' : '1'}
                    min="0"
                    max={discountType === 'percent' ? '100' : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder={discountType === 'fixed' ? '0.00' : '0'}
                  />
                </div>
              )}

              {/* Selected Discount Summary */}
              {selectedDiscount && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm font-medium text-orange-800">
                    Selected: {selectedDiscount.name} - {selectedDiscount.type === 'percentage' ? `${selectedDiscount.value}%` : `$${parseFloat(selectedDiscount.value).toFixed(2)}`}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setDiscountPercent(0);
                    setDiscountType('');
                    setDiscountValue(0);
                    setSelectedDiscount(null);
                    setCustomer(null);
                    setShowDiscountModal(false);
                  }}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDiscountApply}
                  disabled={(!discountType || discountValue <= 0) && !selectedDiscount}
                  className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Apply Discount
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Apply Voucher</h3>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voucher Code
                </label>
                <input
                  type="text"
                  placeholder="Enter voucher code"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 uppercase"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setVoucherCode('');
                    setShowVoucherModal(false);
                  }}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleValidateVoucher}
                  disabled={!voucherCode}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Validate & Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Search Modal */}
      {showCustomerSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Search Customer</h3>
              <button
                onClick={() => setShowCustomerSearch(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter phone number (e.g., 01200693)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {customer && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-semibold text-green-800">{customer.full_name}</p>
                  <p className="text-sm text-green-600">{customer.membership_level} Member - {customer.membership_discount}% discount</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCustomerPhone('');
                    setShowCustomerSearch(false);
                  }}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomerSearch}
                  disabled={!customerPhone}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Select Payment Method</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentMethod('cash');
                  setTenderedUSD(0);
                  setTenderedKHR(0);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-center mb-8">
              <p className="text-gray-600 mb-2">Total Amount:</p>
              <p className="text-4xl font-bold text-blue-600">${calculateTotal().toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">({Math.round(calculateTotal() * exchangeRate).toLocaleString()} KHR)</p>
            </div>

            {/* Payment Method Buttons */}
            {paymentMethod === 'cash' ? (
              // Cash Payment View
              <div className="space-y-4">
                <button
                  onClick={() => setPaymentMethod('')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to payment methods
                </button>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tendered USD</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={tenderedUSD}
                        onChange={(e) => setTenderedUSD(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tendered KHR</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={tenderedKHR}
                        onChange={(e) => setTenderedKHR(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="1"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 text-center">
                    Exchange Rate: 1 USD = {exchangeRate.toLocaleString()} KHR
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Tendered:</span>
                      <span className="font-semibold">${calculateTendered().toFixed(2)} ({Math.round(calculateTendered() * exchangeRate).toLocaleString()} KHR)</span>
                    </div>
                    <div className={`flex justify-between text-sm font-bold ${
                      calculateChange() >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      <span>Change:</span>
                      <span>{calculateChange() >= 0 ? '' : '-'}${Math.abs(calculateChange()).toFixed(2)} ({Math.round(Math.abs(calculateChangeKHR())).toLocaleString()} KHR)</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={calculateTendered() < calculateTotal()}
                  className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Complete Sale
                </button>
              </div>
            ) : (
              // Payment Method Selection
              <div className="grid grid-cols-2 gap-4">
                {paymentMethods.map(method => (
                  <button
                    key={method.method_name}
                    onClick={() => {
                      setPaymentMethod(method.method_name);
                      if (method.method_name !== 'cash') {
                        handleCheckout();
                      }
                    }}
                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        {method.icon === 'money' && (
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        )}
                        {method.icon === 'credit-card' && (
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        )}
                        {method.icon === 'qrcode' && (
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                        )}
                        {method.icon === 'wallet' && (
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        )}
                      </div>
                      <span className="font-bold text-lg">{method.display_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terminal Options Modal */}
      {showTerminalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Terminal Options</h3>
              <button
                onClick={() => setShowTerminalModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowTerminalModal(false);
                  setShowCloseShiftModal(true);
                }}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Close Shift</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Turn off terminal and logout?')) {
                    alert('Terminal turned off');
                    setShowTerminalModal(false);
                    onLogout();
                  }
                }}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span>Turn Off Terminal</span>
              </button>

              <button
                onClick={() => setShowTerminalModal(false)}
                className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseShiftModal && currentShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Close Shift</h3>
              <button
                onClick={() => setShowCloseShiftModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Expected Cash Calculation */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <h4 className="font-semibold text-blue-900 mb-3">Expected Cash in Drawer</h4>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Opening Cash (USD):</span>
                    <span className="font-semibold">${parseFloat(currentShift.opening_cash_usd || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Cash Sales Today (USD):</span>
                    <span className="font-semibold">${parseFloat(currentShift.cash_sales_usd || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-300 pt-2 font-bold text-blue-900">
                    <span>Expected Total (USD):</span>
                    <span>${(parseFloat(currentShift.opening_cash_usd || 0) + parseFloat(currentShift.cash_sales_usd || 0)).toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-blue-300 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Opening Cash (KHR):</span>
                    <span className="font-semibold">រ{parseFloat(currentShift.opening_cash_khr || 0).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Cash Sales Today (KHR):</span>
                    <span className="font-semibold">រ{parseFloat(currentShift.cash_sales_khr || 0).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-300 pt-2 font-bold text-blue-900">
                    <span>Expected Total (KHR):</span>
                    <span>រ{(parseFloat(currentShift.opening_cash_khr || 0) + parseFloat(currentShift.cash_sales_khr || 0)).toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 font-medium">Count the cash in your drawer and enter the actual amounts:</p>

              {/* Actual Cash USD Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Actual Cash in Drawer $ (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={actualCashUSD}
                  onChange={(e) => setActualCashUSD(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              {/* Actual Cash KHR Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Actual Cash in Drawer រ (KHR)
                </label>
                <input
                  type="number"
                  step="1"
                  value={actualCashKHR}
                  onChange={(e) => setActualCashKHR(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCloseShiftModal(false)}
                  className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseShift}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                >
                  Complete & View Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post-Shift Report Modal (After Closing Shift) */}
      {showPostShiftModal && shiftCloseSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full my-8">
            {/* Report Header */}
            <div className="border-b pb-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Shift Close Report</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {session?.company?.name} - {session?.location?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Cashier: {session?.user?.full_name || session?.user?.email}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Closed: {new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Shift #{shiftCloseSummary.shift_id || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Sales Summary */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4">Sales Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Total Transactions</p>
                  <p className="text-2xl font-bold text-blue-900">{shiftCloseSummary.total_transactions || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Total Sales</p>
                  <p className="text-2xl font-bold text-green-900">${parseFloat(shiftCloseSummary.total_sales || 0).toFixed(2)}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Total Discounts</p>
                  <p className="text-2xl font-bold text-yellow-900">${parseFloat(shiftCloseSummary.total_discounts || 0).toFixed(2)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Total Tax</p>
                  <p className="text-2xl font-bold text-purple-900">${parseFloat(shiftCloseSummary.total_tax || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Cash Reconciliation */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4">Cash Reconciliation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* USD Cash */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 mb-3">Cash USD ($)</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Opening Cash:</span>
                      <span className="font-medium">${parseFloat(shiftCloseSummary.opening_cash_usd || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cash Sales:</span>
                      <span className="font-medium">+${parseFloat(shiftCloseSummary.cash_sales_usd || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Expected Cash:</span>
                      <span className="font-semibold">${parseFloat(shiftCloseSummary.expected_cash_usd || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Actual Cash:</span>
                      <span className="font-semibold">${parseFloat(shiftCloseSummary.actual_cash_usd || 0).toFixed(2)}</span>
                    </div>
                    <div className={`flex justify-between border-t pt-2 font-bold ${
                      parseFloat(shiftCloseSummary.variance_usd || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span>Variance:</span>
                      <span>
                        {parseFloat(shiftCloseSummary.variance_usd || 0) >= 0 ? '+' : ''}
                        ${parseFloat(shiftCloseSummary.variance_usd || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* KHR Cash */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 mb-3">Cash KHR (រ)</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Opening Cash:</span>
                      <span className="font-medium">រ{parseFloat(shiftCloseSummary.opening_cash_khr || 0).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cash Sales:</span>
                      <span className="font-medium">+រ{parseFloat(shiftCloseSummary.cash_sales_khr || 0).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Expected Cash:</span>
                      <span className="font-semibold">រ{parseFloat(shiftCloseSummary.expected_cash_khr || 0).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Actual Cash:</span>
                      <span className="font-semibold">រ{parseFloat(shiftCloseSummary.actual_cash_khr || 0).toFixed(0)}</span>
                    </div>
                    <div className={`flex justify-between border-t pt-2 font-bold ${
                      parseFloat(shiftCloseSummary.variance_khr || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span>Variance:</span>
                      <span>
                        {parseFloat(shiftCloseSummary.variance_khr || 0) >= 0 ? '+' : ''}
                        រ{parseFloat(shiftCloseSummary.variance_khr || 0).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods Breakdown */}
            {shiftCloseSummary.payment_breakdown && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-4">Payment Methods</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-4 font-semibold text-gray-700">Method</th>
                        <th className="text-right py-2 px-4 font-semibold text-gray-700">Count</th>
                        <th className="text-right py-2 px-4 font-semibold text-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(shiftCloseSummary.payment_breakdown).map(([method, data], idx) => (
                        <tr key={idx} className="border-t">
                          <td className="py-2 px-4 capitalize">{method}</td>
                          <td className="text-right py-2 px-4">{data.count || 0}</td>
                          <td className="text-right py-2 px-4 font-medium">${parseFloat(data.amount || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t pt-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => window.print()}
                  className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
                <button
                  onClick={() => alert('Export to Excel feature coming soon!')}
                  className="py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Excel
                </button>
                <button
                  onClick={handleOpenNewShift}
                  className="py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
                >
                  Close & Open New Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Open Shift Modal */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Open Shift</h3>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">Enter the starting cash amounts in the drawer:</p>

              {/* Opening Cash USD Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Starting Cash $ (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={openingCashUSD}
                  onChange={(e) => setOpeningCashUSD(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              {/* Opening Cash KHR Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Starting Cash រ (KHR)
                </label>
                <input
                  type="number"
                  step="1"
                  value={openingCashKHR}
                  onChange={(e) => setOpeningCashKHR(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <button
                  onClick={handleOpenShift}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                >
                  Open Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default POSSaleScreen;