import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { getSales, getShiftHistory } from './firebase/db';
import Login from './components/Login';
import CompanyLocationSelector from './components/CompanyLocationSelector';
import POSSaleScreen from './components/POSSaleScreen';

const POSPageTemplate = ({ session, onLogout, children }) => {
  const navigate = useNavigate();
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);

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
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled
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
              <button onClick={() => { setShowHamburgerMenu(false); navigate('/'); }}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-blue-50 rounded-lg transition">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="font-medium">POS</span>
              </button>

              <button onClick={() => { setShowHamburgerMenu(false); navigate('/sale'); }}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-blue-50 rounded-lg transition">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">Sale</span>
              </button>

              <button onClick={() => { setShowHamburgerMenu(false); navigate('/report'); }}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-blue-50 rounded-lg transition">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">Report</span>
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
      <div className="flex-1 overflow-auto p-6 bg-gray-100">
        {children}
      </div>
    </div>
  );
};

const TransactionsScreen = ({ session }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSaleId, setExpandedSaleId] = useState(null);

  // Format date to Asia/Phnom_Penh timezone
  const formatDatePhnomPenh = (dateString) => {
    const date = dateString?.toDate ? dateString.toDate() : new Date(dateString);
    return date.toLocaleString('en-US', {
      timeZone: 'Asia/Phnom_Penh',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const toggleExpand = (saleId) => {
    setExpandedSaleId(expandedSaleId === saleId ? null : saleId);
  };

  useEffect(() => {
    const fetchSales = async () => {
      if (!session?.company?.id || !session?.location?.id) return;

      setLoading(true);
      try {
        // Fetch sales for the current location
        const response = await getSales(session.company.id, session.location.id, { limit: 50 });
        setSales(response);
      } catch (error) {
        console.error('Failed to load transactions:', error);
        setSales([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [session?.company?.id, session?.location?.id]);

  const getStatusBadge = (status) => {
    const badges = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Cancel: 'bg-red-100 text-red-800',
      Void: 'bg-gray-100 text-gray-800',
      Complete: 'bg-green-100 text-green-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-700">Sale Transactions</h1>
        <p className="text-sm text-gray-500">{sales.length} transactions</p>
      </div>

      {sales.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date & Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Receipt #</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Items</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const isExpanded = expandedSaleId === sale.id;
                  const subtotal = parseFloat(sale.total_amount || 0) + parseFloat(sale.discount || 0);

                  return (
                    <React.Fragment key={sale.id}>
                      <tr
                        onClick={() => toggleExpand(sale.id)}
                        className="border-b hover:bg-gray-50 transition cursor-pointer"
                      >
                        <td className="py-3 px-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <svg
                              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            {formatDatePhnomPenh(sale.created_at)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          #{sale.receipt_number || sale.id}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {sale.items?.length || 0} item{sale.items?.length !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="font-bold text-gray-900">${parseFloat(sale.total_amount || 0).toFixed(2)}</div>
                          {sale.discount && parseFloat(sale.discount) > 0 && (
                            <div className="text-xs text-green-600">-${parseFloat(sale.discount).toFixed(2)} off</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(sale.status || 'complete')}`}>
                            {sale.status || 'Complete'}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="5" className="bg-gray-50 p-4">
                            <div className="max-w-4xl">
                              <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Receipt #{sale.receipt_number || sale.id}
                                </h3>

                                {/* Items Table */}
                                <div className="mb-4">
                                  <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Product</th>
                                        <th className="text-center py-2 px-3 font-semibold text-gray-700">Qty</th>
                                        <th className="text-right py-2 px-3 font-semibold text-gray-700">Price</th>
                                        <th className="text-right py-2 px-3 font-semibold text-gray-700">Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sale.items && sale.items.length > 0 ? (
                                        sale.items.map((item, idx) => (
                                          <tr key={idx} className="border-b border-gray-100">
                                            <td className="py-2 px-3 font-medium text-gray-900">
                                              {item.product_name || item.name}
                                            </td>
                                            <td className="text-center py-2 px-3 text-gray-600">
                                              {item.quantity}
                                            </td>
                                            <td className="text-right py-2 px-3 text-gray-600">
                                              ${parseFloat(item.price || 0).toFixed(2)}
                                            </td>
                                            <td className="text-right py-2 px-3 font-semibold text-gray-900">
                                              ${(parseFloat(item.price || 0) * parseInt(item.quantity || 0)).toFixed(2)}
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan="4" className="text-center py-4 text-gray-400">
                                            No items
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Summary */}
                                <div className="border-t pt-3 space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                                  </div>
                                  {sale.discount && parseFloat(sale.discount) > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                      <span>Discount:</span>
                                      <span className="font-medium">-${parseFloat(sale.discount).toFixed(2)}</span>
                                    </div>
                                  )}
                                  {sale.tax && parseFloat(sale.tax) > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Tax:</span>
                                      <span className="font-medium">${parseFloat(sale.tax).toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-base font-bold border-t pt-2">
                                    <span>Total:</span>
                                    <span className="text-blue-600">${parseFloat(sale.total_amount || 0).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500">No sale transactions found.</p>
        </div>
      )}
    </div>
  );
};

const ReportScreen = ({ session }) => {
  const [shiftReports, setShiftReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchShiftReports();
  }, [session]);

  const fetchShiftReports = async () => {
    try {
      setLoading(true);
      const response = await getShiftHistory(session?.company?.id, session?.location?.id);
      setShiftReports(response || []);
    } catch (err) {
      console.error('Error fetching shift reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    alert('Export to Excel feature coming soon!');
  };

  const handleCloseReport = () => {
    setSelectedReport(null);
  };

  const formatDatePhnomPenh = (dateString) => {
    const date = dateString?.toDate ? dateString.toDate() : new Date(dateString);
    return date.toLocaleString('en-US', {
      timeZone: 'Asia/Phnom_Penh',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Shift Close Reports</h1>

      {loading ? (
        <div className="text-center py-12">Loading reports...</div>
      ) : shiftReports.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Closed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cashier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Variance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shiftReports.map((report) => {
                const cashVarianceUsd = (parseFloat(report.closing_cash_usd || 0) - (parseFloat(report.opening_cash_usd || 0) + parseFloat(report.cash_sales_usd || 0))).toFixed(2);
                const cashVarianceKhr = (parseFloat(report.closing_cash_khr || 0) - (parseFloat(report.opening_cash_khr || 0) + parseFloat(report.cash_sales_khr || 0))).toFixed(2);
                const hasVariance = Math.abs(cashVarianceUsd) > 0.01 || Math.abs(cashVarianceKhr) > 0.01;

                return (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDatePhnomPenh(report.closed_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.cashier_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${parseFloat(report.total_sales_usd || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.total_transactions || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {hasVariance ? (
                        <span className={parseFloat(cashVarianceUsd) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          ${cashVarianceUsd} / ៛{cashVarianceKhr}
                        </span>
                      ) : (
                        <span className="text-green-600 font-semibold">Balanced</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewReport(report)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500">No shift close reports found.</p>
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full my-8">
            {/* Report Header */}
            <div className="border-b pb-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Shift Close Report</h2>
              <p className="text-sm text-gray-600 mt-1">{session?.company?.name} - {session?.location?.name}</p>
              <p className="text-sm text-gray-600">Cashier: {selectedReport.cashier_name || session?.user?.full_name || session?.user?.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                Closed: {formatDatePhnomPenh(selectedReport.closed_at)}
              </p>
            </div>

            {/* Sales Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Total Transactions</p>
                <p className="text-2xl font-bold text-blue-900">{selectedReport.total_transactions || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-green-900">${parseFloat(selectedReport.total_sales_usd || 0).toFixed(2)}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Total Discounts</p>
                <p className="text-2xl font-bold text-orange-900">${parseFloat(selectedReport.total_discounts_usd || 0).toFixed(2)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Total Tax</p>
                <p className="text-2xl font-bold text-purple-900">${parseFloat(selectedReport.total_tax_usd || 0).toFixed(2)}</p>
              </div>
            </div>

            {/* Cash Reconciliation */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4">Cash Reconciliation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* USD */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold mb-3 text-gray-700">USD</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Opening Cash:</span>
                      <span className="font-semibold">${parseFloat(selectedReport.opening_cash_usd || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cash Sales:</span>
                      <span className="font-semibold">+${parseFloat(selectedReport.cash_sales_usd || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-2">
                      <span>Expected Total:</span>
                      <span className="font-bold">${(parseFloat(selectedReport.opening_cash_usd || 0) + parseFloat(selectedReport.cash_sales_usd || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Actual Cash:</span>
                      <span className="font-semibold">${parseFloat(selectedReport.closing_cash_usd || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-2">
                      <span className="font-bold">Variance:</span>
                      <span className={`font-bold ${(parseFloat(selectedReport.closing_cash_usd || 0) - (parseFloat(selectedReport.opening_cash_usd || 0) + parseFloat(selectedReport.cash_sales_usd || 0))) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${(parseFloat(selectedReport.closing_cash_usd || 0) - (parseFloat(selectedReport.opening_cash_usd || 0) + parseFloat(selectedReport.cash_sales_usd || 0))).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* KHR */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold mb-3 text-gray-700">KHR (៛)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Opening Cash:</span>
                      <span className="font-semibold">៛{parseFloat(selectedReport.opening_cash_khr || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cash Sales:</span>
                      <span className="font-semibold">+៛{parseFloat(selectedReport.cash_sales_khr || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-2">
                      <span>Expected Total:</span>
                      <span className="font-bold">៛{(parseFloat(selectedReport.opening_cash_khr || 0) + parseFloat(selectedReport.cash_sales_khr || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Actual Cash:</span>
                      <span className="font-semibold">៛{parseFloat(selectedReport.closing_cash_khr || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-2">
                      <span className="font-bold">Variance:</span>
                      <span className={`font-bold ${(parseFloat(selectedReport.closing_cash_khr || 0) - (parseFloat(selectedReport.opening_cash_khr || 0) + parseFloat(selectedReport.cash_sales_khr || 0))) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ៛{(parseFloat(selectedReport.closing_cash_khr || 0) - (parseFloat(selectedReport.opening_cash_khr || 0) + parseFloat(selectedReport.cash_sales_khr || 0))).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods Breakdown */}
            {selectedReport.payment_breakdown && selectedReport.payment_breakdown.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-4">Payment Methods</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Payment Method</th>
                      <th className="text-right py-2">Count</th>
                      <th className="text-right py-2">Amount (USD)</th>
                      <th className="text-right py-2">Amount (KHR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReport.payment_breakdown.map((method, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 capitalize">{method.payment_method}</td>
                        <td className="text-right py-2">{method.count}</td>
                        <td className="text-right py-2">${parseFloat(method.total_usd || 0).toFixed(2)}</td>
                        <td className="text-right py-2">៛{parseFloat(method.total_khr || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button onClick={handlePrint} className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button onClick={handleExportExcel} className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
              <button onClick={handleCloseReport} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function MobileBlock({ children }) {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="mb-6 flex justify-center">
            <svg className="w-20 h-20 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Desktop Required</h1>
          <p className="text-gray-400 text-base leading-relaxed">
            This POS system cannot be displayed on a mobile phone.
          </p>
          <p className="text-gray-300 font-medium mt-3 text-base">
            Please use a Laptop or iPad.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

function App() {
  const [currentStep, setCurrentStep] = useState('login'); // 'login', 'select', 'pos'
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('posSession');
    const savedUser = localStorage.getItem('posUser');
    const savedStep = localStorage.getItem('posStep');

    if (savedSession && savedUser) {
      try {
        setSession(JSON.parse(savedSession));
        setUser(JSON.parse(savedUser));
        setCurrentStep(savedStep || 'pos');
      } catch (err) {
        console.error('Error loading session:', err);
        // Clear invalid session data
        localStorage.removeItem('posSession');
        localStorage.removeItem('posUser');
        localStorage.removeItem('posStep');
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentStep('select');
    localStorage.setItem('posUser', JSON.stringify(userData));
    localStorage.setItem('posStep', 'select');
  };

  const handleSelectionComplete = (selectionData) => {
    const newSession = {
      user,
      company: selectionData.company,
      location: selectionData.location,
    };
    setSession(newSession);
    setCurrentStep('pos');
    localStorage.setItem('posSession', JSON.stringify(newSession));
    localStorage.setItem('posStep', 'pos');
  };

  const handleLogout = () => {
    setUser(null);
    setSession(null);
    setCurrentStep('login');
    // Clear localStorage on logout
    localStorage.removeItem('posSession');
    localStorage.removeItem('posUser');
    localStorage.removeItem('posStep');
  };

  return (
    <MobileBlock>
    <BrowserRouter>
      {currentStep === 'login' ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : currentStep === 'select' ? (
        <CompanyLocationSelector user={user} onSelectionComplete={handleSelectionComplete} />
      ) : (
        <Routes>
          <Route
            path="/"
            element={<POSSaleScreen session={session} onLogout={handleLogout} />}
          />
          <Route
            path="/sale"
            element={
              <POSPageTemplate session={session} onLogout={handleLogout}>
                <TransactionsScreen session={session} />
              </POSPageTemplate>
            }
          />
          <Route
            path="/report"
            element={
              <POSPageTemplate session={session} onLogout={handleLogout}>
                <ReportScreen session={session} />
              </POSPageTemplate>
            }
          />
          {/* Redirect any unmatched to POS */}
          <Route path="*" element={<POSSaleScreen session={session} onLogout={handleLogout} />} />
        </Routes>
      )}
    </BrowserRouter>
    </MobileBlock>
  );
}

export default App;