import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, Timestamp,
  increment, writeBatch, documentId
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from './config';

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const loginDashboard = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  // fetch user profile from Firestore
  const snap = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
  if (snap.empty) throw new Error('User profile not found');
  const userData = { id: snap.docs[0].id, ...snap.docs[0].data() };
  localStorage.setItem('user', JSON.stringify(userData));
  return userData;
};

export const loginPOS = async (fullName, password) => {
  // Look up user by full_name to get their email
  const snap = await getDocs(query(collection(db, 'users'), where('full_name', '==', fullName)));
  if (snap.empty) throw new Error('User not found');
  const userData = { id: snap.docs[0].id, ...snap.docs[0].data() };
  if (!userData.email) throw new Error('No email linked to this user');
  await signInWithEmailAndPassword(auth, userData.email, password);
  return userData;
};

export const logoutUser = () => signOut(auth);

// ─── COMPANIES ───────────────────────────────────────────────────────────────

export const getUserCompanies = async (userId) => {
  try {
    console.log('[DEBUG] auth.currentUser:', auth.currentUser?.uid ?? 'NOT LOGGED IN');
    const assignSnap = await getDocs(
      query(collection(db, 'user_assignments'), where('user_id', '==', userId))
    );
    const assignments = assignSnap.docs.map(d => d.data());
    const companyIds = [...new Set(assignments.map(d => d.company_id))];
    console.log('[DEBUG] companyIds from assignments:', companyIds);
    if (!companyIds.length) return [];

    try {
      const companySnap = await getDocs(
        query(collection(db, 'companies'), where(documentId(), 'in', companyIds))
      );
      console.log('[DEBUG] companies fetched:', companySnap.docs.length);
      if (companySnap.docs.length > 0) {
        return companySnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (companyErr) {
      console.error('[DEBUG] companies fetch error:', companyErr.code, companyErr.message);
    }

    // Fallback: build company list from assignment data directly
    console.warn('[DEBUG] falling back to assignment data for companies');
    return companyIds.map(id => ({ id, name: id }));
  } catch (e) {
    console.error('[DEBUG] getUserCompanies error:', e.code, e.message);
    return [];
  }
};

export const getUserLocations = async (userId, companyId) => {
  const assignSnap = await getDocs(
    query(
      collection(db, 'user_assignments'),
      where('user_id', '==', userId),
      where('company_id', '==', companyId)
    )
  );
  const locationIds = [...new Set(assignSnap.docs.map(d => d.data().location_id).filter(Boolean))];
  if (!locationIds.length) return [];
  const locations = await Promise.all(
    locationIds.map(id => getDoc(doc(db, 'locations', id)))
  );
  return locations
    .filter(d => d.exists())
    .map(d => ({ id: d.id, ...d.data() }));
};

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

export const getCategories = async (companyId, locationId) => {
  let q = query(
    collection(db, 'categories'),
    where('company_id', '==', companyId),
    where('is_active', '==', true)
  );
  const snap = await getDocs(q);
  let cats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (locationId) cats = cats.filter(c => !c.location_id || c.location_id === locationId);
  return cats;
};

export const createCategory = async (data) => {
  const ref = await addDoc(collection(db, 'categories'), {
    ...data,
    is_active: true,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
};

export const updateCategory = async (id, data) => {
  await updateDoc(doc(db, 'categories', id), { ...data, updated_at: serverTimestamp() });
};

export const deleteCategory = async (id) => {
  await updateDoc(doc(db, 'categories', id), { is_active: false, updated_at: serverTimestamp() });
};

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

export const getProducts = async (locationId, companyId) => {
  let q;
  if (locationId) {
    q = query(
      collection(db, 'products'),
      where('location_id', '==', locationId),
      where('is_active', '==', true)
    );
  } else {
    q = query(
      collection(db, 'products'),
      where('company_id', '==', companyId),
      where('is_active', '==', true)
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const createProduct = async (data) => {
  const ref = await addDoc(collection(db, 'products'), {
    ...data,
    is_active: true,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
};

export const updateProduct = async (id, data) => {
  await updateDoc(doc(db, 'products', id), { ...data, updated_at: serverTimestamp() });
};

export const deleteProduct = async (id) => {
  await updateDoc(doc(db, 'products', id), { is_active: false, updated_at: serverTimestamp() });
};

export const uploadProductImage = async (file) => {
  const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
};

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────

export const getCustomers = async (companyId) => {
  const snap = await getDocs(
    query(collection(db, 'customers'), where('company_id', '==', companyId))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const searchCustomerByPhone = async (companyId, phone) => {
  const snap = await getDocs(
    query(
      collection(db, 'customers'),
      where('company_id', '==', companyId),
      where('phone', '==', phone)
    )
  );
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

export const createCustomer = async (data) => {
  const ref = await addDoc(collection(db, 'customers'), {
    ...data,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
};

export const updateCustomer = async (id, data) => {
  await updateDoc(doc(db, 'customers', id), { ...data, updated_at: serverTimestamp() });
};

export const deleteCustomer = async (id) => {
  await deleteDoc(doc(db, 'customers', id));
};

// ─── SALES ───────────────────────────────────────────────────────────────────

export const createSale = async (saleData) => {
  const ref = await addDoc(collection(db, 'sales'), {
    ...saleData,
    status: 'paid',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  // Decrement stock only for items with stock tracking enabled
  const batch = writeBatch(db);
  if (saleData.items) {
    for (const item of saleData.items) {
      if (item.product_id && item.track_stock !== false) {
        const productRef = doc(db, 'products', item.product_id);
        batch.update(productRef, { stock: increment(-item.quantity) });
      }
    }
  }
  await batch.commit();
  return ref.id;
};

export const getSales = async (companyId, locationId, filters = {}) => {
  const snap = await getDocs(
    query(
      collection(db, 'sales'),
      where('company_id', '==', companyId)
    )
  );
  let sales = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aTime = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
      const bTime = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at);
      return bTime - aTime;
    });

  if (locationId) {
    sales = sales.filter(s => s.location_id === locationId);
  }
  if (filters.limit) {
    sales = sales.slice(0, filters.limit);
  }
  return sales;
};

export const getSalesDashboard = async (companyId, period, dateRange) => {
  const snap = await getDocs(
    query(
      collection(db, 'sales'),
      where('company_id', '==', companyId),
      where('status', '==', 'paid'),
      orderBy('created_at', 'desc')
    )
  );
  let sales = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at),
    };
  });

  // Apply date filter
  const now = new Date();
  if (period === 'day') {
    const start = new Date(now); start.setHours(0,0,0,0);
    sales = sales.filter(s => s.created_at >= start);
  } else if (period === 'yesterday') {
    const start = new Date(now); start.setDate(start.getDate()-1); start.setHours(0,0,0,0);
    const end = new Date(now); end.setHours(0,0,0,0);
    sales = sales.filter(s => s.created_at >= start && s.created_at < end);
  } else if (period === 'week') {
    const start = new Date(now); start.setDate(start.getDate()-7);
    sales = sales.filter(s => s.created_at >= start);
  } else if (period === 'month') {
    const start = new Date(now); start.setDate(start.getDate()-30);
    sales = sales.filter(s => s.created_at >= start);
  } else if (period === '90days') {
    const start = new Date(now); start.setDate(start.getDate()-90);
    sales = sales.filter(s => s.created_at >= start);
  } else if (period === 'custom' && dateRange) {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end); end.setHours(23,59,59,999);
    sales = sales.filter(s => s.created_at >= start && s.created_at <= end);
  }

  // Build analytics
  const totalAmount = sales.reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
  const totalDiscount = sales.reduce((s, r) => s + parseFloat(r.discount || 0), 0);

  // Group by location
  const byLocation = {};
  sales.forEach(s => {
    const loc = s.location_id || 'unknown';
    if (!byLocation[loc]) byLocation[loc] = { location_id: loc, location_name: s.location_name || loc, total_amount: 0, total_discount: 0, transaction_count: 0, items_sold: 0 };
    byLocation[loc].total_amount += parseFloat(s.total_amount || 0);
    byLocation[loc].total_discount += parseFloat(s.discount || 0);
    byLocation[loc].transaction_count += 1;
    byLocation[loc].items_sold += (s.items || []).reduce((a, i) => a + i.quantity, 0);
    byLocation[loc].store_name = s.location_name || loc;
  });

  // Group by payment method
  const byPayment = {};
  sales.forEach(s => {
    const method = s.payment_method || 'cash';
    if (!byPayment[method]) byPayment[method] = { method, total_amount: 0, transaction_count: 0 };
    byPayment[method].total_amount += parseFloat(s.total_amount || 0);
    byPayment[method].transaction_count += 1;
  });

  // Group by order type
  const byChannel = {};
  sales.forEach(s => {
    const ch = s.order_type || 'dine_in';
    if (!byChannel[ch]) byChannel[ch] = { channel: ch, total_amount: 0, transaction_count: 0 };
    byChannel[ch].total_amount += parseFloat(s.total_amount || 0);
    byChannel[ch].transaction_count += 1;
  });

  // Top items
  const itemMap = {};
  sales.forEach(s => {
    (s.items || []).forEach(item => {
      const name = item.product_name || item.name;
      if (!itemMap[name]) itemMap[name] = { product_name: name, units_sold: 0, revenue: 0 };
      itemMap[name].units_sold += item.quantity;
      itemMap[name].revenue += parseFloat(item.total || item.price * item.quantity || 0);
    });
  });
  const topItems = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  return {
    overview: {
      total_receipts: sales.length,
      net_sales: totalAmount,
      gross_sales: totalAmount + totalDiscount,
      total_discounts: totalDiscount,
      total_tax: 0,
    },
    sales_by_stores: Object.values(byLocation),
    sales_by_payment: Object.values(byPayment),
    sales_by_channels: Object.values(byChannel),
    top_items: topItems,
    hourly_trends: buildHourlyTrends(sales),
    daily_sales: buildDailySales(sales),
  };
};

const buildHourlyTrends = (sales) => {
  const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2,'0')}:00`, orders: 0, revenue: 0 }));
  sales.forEach(s => {
    const h = new Date(s.created_at).getHours();
    hours[h].orders += 1;
    hours[h].revenue += parseFloat(s.total_amount || 0);
  });
  return hours;
};

const buildDailySales = (sales) => {
  const dayMap = {};
  sales.forEach(s => {
    const d = new Date(s.created_at).toISOString().split('T')[0];
    if (!dayMap[d]) dayMap[d] = { hour: d, orders: 0, revenue: 0 };
    dayMap[d].orders += 1;
    dayMap[d].revenue += parseFloat(s.total_amount || 0);
  });
  return Object.values(dayMap).sort((a, b) => a.hour.localeCompare(b.hour));
};

// ─── SHIFTS ──────────────────────────────────────────────────────────────────

export const getCurrentShift = async (locationId) => {
  const snap = await getDocs(
    query(
      collection(db, 'shifts'),
      where('location_id', '==', locationId),
      where('status', '==', 'open'),
      orderBy('opened_at', 'desc'),
      limit(1)
    )
  );
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

export const openShift = async (data) => {
  const ref = await addDoc(collection(db, 'shifts'), {
    ...data,
    status: 'open',
    opened_at: serverTimestamp(),
    created_at: serverTimestamp(),
  });
  return ref.id;
};

export const closeShift = async (shiftId, data) => {
  await updateDoc(doc(db, 'shifts', shiftId), {
    ...data,
    status: 'closed',
    closed_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
};

export const getShiftHistory = async (companyId, locationId) => {
  let q = query(
    collection(db, 'shifts'),
    where('company_id', '==', companyId),
    orderBy('opened_at', 'desc')
  );
  const snap = await getDocs(q);
  let shifts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (locationId) shifts = shifts.filter(s => s.location_id === locationId);
  return shifts;
};

// ─── DISCOUNTS ───────────────────────────────────────────────────────────────

export const getDiscounts = async (companyId, locationId) => {
  const snap = await getDocs(
    query(collection(db, 'discounts'), where('company_id', '==', companyId))
  );
  let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (locationId) items = items.filter(i => !i.location_id || i.location_id === locationId);
  return items;
};

export const createDiscount = async (data) => {
  const ref = await addDoc(collection(db, 'discounts'), {
    ...data,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
};

export const updateDiscount = async (id, data) => {
  await updateDoc(doc(db, 'discounts', id), { ...data, updated_at: serverTimestamp() });
};

export const deleteDiscount = async (id) => {
  await deleteDoc(doc(db, 'discounts', id));
};

// ─── VOUCHERS ────────────────────────────────────────────────────────────────

export const getVouchers = async (companyId, locationId) => {
  const snap = await getDocs(
    query(collection(db, 'vouchers'), where('company_id', '==', companyId))
  );
  let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (locationId) items = items.filter(i => !i.location_id || i.location_id === locationId);
  return items;
};

export const createVoucher = async (data) => {
  const ref = await addDoc(collection(db, 'vouchers'), {
    ...data,
    used_count: 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
};

export const updateVoucher = async (id, data) => {
  await updateDoc(doc(db, 'vouchers', id), { ...data, updated_at: serverTimestamp() });
};

export const deleteVoucher = async (id) => {
  await deleteDoc(doc(db, 'vouchers', id));
};

export const validateVoucher = async (companyId, code) => {
  const snap = await getDocs(
    query(
      collection(db, 'vouchers'),
      where('company_id', '==', companyId),
      where('code', '==', code),
      where('is_active', '==', true)
    )
  );
  if (snap.empty) return null;
  const voucher = { id: snap.docs[0].id, ...snap.docs[0].data() };
  // Check usage limit
  if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) return null;
  // Check date validity
  const now = new Date();
  if (voucher.start_date && new Date(voucher.start_date) > now) return null;
  if (voucher.end_date && new Date(voucher.end_date) < now) return null;
  return voucher;
};

export const incrementVoucherUsage = async (id) => {
  await updateDoc(doc(db, 'vouchers', id), {
    used_count: increment(1),
    updated_at: serverTimestamp(),
  });
};

// ─── PAYMENT METHODS ─────────────────────────────────────────────────────────

export const getPaymentMethods = async (companyId, locationId) => {
  const snap = await getDocs(
    query(
      collection(db, 'payment_methods'),
      where('company_id', '==', companyId),
      orderBy('sort_order', 'asc')
    )
  );
  let methods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (locationId) methods = methods.filter(m => !m.location_id || m.location_id === locationId);
  if (!methods.length) {
    // Return default methods if none configured
    return [
      { id: 'cash', method_name: 'cash', display_name: 'Cash', is_enabled: true, sort_order: 1 },
      { id: 'card', method_name: 'card', display_name: 'Card', is_enabled: true, sort_order: 2 },
      { id: 'qr', method_name: 'qr', display_name: 'QR', is_enabled: true, sort_order: 3 },
    ];
  }
  return methods;
};

export const createPaymentMethod = async (data) => {
  const ref = await addDoc(collection(db, 'payment_methods'), {
    ...data,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
};

export const updatePaymentMethod = async (id, data) => {
  await updateDoc(doc(db, 'payment_methods', id), { ...data, updated_at: serverTimestamp() });
};

// ─── CONFIGS ─────────────────────────────────────────────────────────────────

export const getConfig = async (companyId, locationId, key) => {
  const snap = await getDocs(
    query(
      collection(db, 'configs'),
      where('company_id', '==', companyId),
      where('location_id', '==', locationId || ''),
      where('key', '==', key)
    )
  );
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

export const setConfig = async (companyId, locationId, key, value) => {
  const existing = await getConfig(companyId, locationId, key);
  if (existing) {
    await updateDoc(doc(db, 'configs', existing.id), { value, updated_at: serverTimestamp() });
  } else {
    await addDoc(collection(db, 'configs'), {
      company_id: companyId,
      location_id: locationId || '',
      key,
      value,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }
};

export const getAllConfigs = async (companyId, locationId) => {
  const snap = await getDocs(
    query(
      collection(db, 'configs'),
      where('company_id', '==', companyId)
    )
  );
  let configs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (locationId) configs = configs.filter(c => !c.location_id || c.location_id === locationId);
  return configs;
};

// ─── REPORT HELPERS ──────────────────────────────────────────────────────────

export const getRevenueSummary = async (companyId, locationId, startDate, endDate) => {
  const snap = await getDocs(
    query(
      collection(db, 'sales'),
      where('company_id', '==', companyId),
      where('status', '==', 'paid'),
      orderBy('created_at', 'desc')
    )
  );
  let sales = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id, ...data,
      created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at),
    };
  });

  if (locationId) sales = sales.filter(s => s.location_id === locationId);
  if (startDate) sales = sales.filter(s => s.created_at >= new Date(startDate));
  if (endDate) {
    const end = new Date(endDate); end.setHours(23,59,59,999);
    sales = sales.filter(s => s.created_at <= end);
  }

  // Group by date
  const byDate = {};
  sales.forEach(s => {
    const d = s.created_at.toISOString().split('T')[0];
    if (!byDate[d]) byDate[d] = { date: d, gross_sales: 0, discounts: 0, net_sales: 0, transactions: 0, items_sold: 0 };
    const gross = parseFloat(s.total_amount || 0) + parseFloat(s.discount || 0);
    byDate[d].gross_sales += gross;
    byDate[d].discounts += parseFloat(s.discount || 0);
    byDate[d].net_sales += parseFloat(s.total_amount || 0);
    byDate[d].transactions += 1;
    byDate[d].items_sold += (s.items || []).reduce((a, i) => a + i.quantity, 0);
  });

  return {
    summary: Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)),
    totals: {
      gross_sales: sales.reduce((a, s) => a + parseFloat(s.total_amount || 0) + parseFloat(s.discount || 0), 0),
      discounts: sales.reduce((a, s) => a + parseFloat(s.discount || 0), 0),
      net_sales: sales.reduce((a, s) => a + parseFloat(s.total_amount || 0), 0),
      transactions: sales.length,
    }
  };
};

export const getProductSalesSummary = async (companyId, locationId, startDate, endDate) => {
  const snap = await getDocs(
    query(
      collection(db, 'sales'),
      where('company_id', '==', companyId),
      where('status', '==', 'paid'),
      orderBy('created_at', 'desc')
    )
  );
  let sales = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id, ...data,
      created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at),
    };
  });

  if (locationId) sales = sales.filter(s => s.location_id === locationId);
  if (startDate) sales = sales.filter(s => s.created_at >= new Date(startDate));
  if (endDate) {
    const end = new Date(endDate); end.setHours(23,59,59,999);
    sales = sales.filter(s => s.created_at <= end);
  }

  const productMap = {};
  sales.forEach(s => {
    (s.items || []).forEach(item => {
      const key = item.product_id || item.product_name;
      if (!productMap[key]) productMap[key] = {
        product_id: item.product_id,
        product_name: item.product_name || item.name,
        category: item.category || '',
        units_sold: 0,
        revenue: 0,
        cost: 0,
      };
      productMap[key].units_sold += item.quantity;
      productMap[key].revenue += parseFloat(item.total || item.price * item.quantity || 0);
    });
  });

  return Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
};
