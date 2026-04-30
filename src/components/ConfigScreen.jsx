import React, { useState, useEffect } from 'react';
import { getConfig, setConfig } from '../firebase/db';

const ConfigScreen = ({ session }) => {
  const [taxRate, setTaxRate] = useState('');
  const [serviceCharge, setServiceCharge] = useState('');
  const [membershipDiscounts, setMembershipDiscounts] = useState({
    Silver: 0,
    Gold: 0,
    Platinum: 0
  });
  const [activeTab, setActiveTab] = useState('tax'); // 'tax' or 'discount'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.company?.id) {
      fetchConfigs();
      fetchMembershipDiscounts();
    }
  }, [session?.company?.id]);

  const fetchConfigs = async () => {
    try {
      const tax = await getConfig(session.company.id, session.location?.id, 'tax_rate');
      const charge = await getConfig(session.company.id, session.location?.id, 'service_charge');
      setTaxRate(tax ?? '8.75');
      setServiceCharge(charge ?? '0.00');
    } catch (error) {
      console.error('Error fetching configs:', error);
      setTaxRate('8.75');
      setServiceCharge('0.00');
    }
  };

  const fetchMembershipDiscounts = async () => {
    try {
      const discounts = await getConfig(session.company.id, session.location?.id, 'membership_discounts');
      if (discounts) {
        setMembershipDiscounts(discounts);
      }
    } catch (error) {
      console.error('Error fetching membership discounts:', error);
    }
  };

  const handleSaveTaxConfig = async () => {
    try {
      setLoading(true);
      await setConfig(session.company.id, session.location?.id, 'tax_rate', taxRate);
      await setConfig(session.company.id, session.location?.id, 'service_charge', serviceCharge);
      alert('Tax configuration saved successfully!');
    } catch (error) {
      console.error('Error saving tax config:', error);
      alert('Failed to save tax configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDiscountConfig = async () => {
    try {
      setLoading(true);
      await setConfig(session.company.id, session.location?.id, 'membership_discounts', membershipDiscounts);
      alert('Membership discounts saved successfully!');
    } catch (error) {
      console.error('Error saving membership discounts:', error);
      alert('Failed to save membership discounts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-700">Configuration</h1>

      {/* Tab Selection */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('tax')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'tax'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Tax & Service Charge
        </button>
        <button
          onClick={() => setActiveTab('discount')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'discount'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Membership Discounts
        </button>
      </div>

      {/* Tax Configuration Tab */}
      {activeTab === 'tax' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold mb-4">Tax & Service Charge Settings</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="8.75"
            />
            <p className="text-sm text-gray-500 mt-1">Applied to all sales in this company</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Charge (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={serviceCharge}
              onChange={(e) => setServiceCharge(e.target.value)}
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
            <p className="text-sm text-gray-500 mt-1">Additional service charge added before tax</p>
          </div>

          <button
            onClick={handleSaveTaxConfig}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Tax Configuration'}
          </button>
        </div>
      )}

      {/* Discount Configuration Tab */}
      {activeTab === 'discount' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold mb-4">Membership Discount Settings</h2>

          <p className="text-sm text-gray-600 mb-4">
            Configure default discount percentages for each membership tier. These will be automatically
            applied when a customer with a membership is selected.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                  Silver Membership Discount (%)
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={membershipDiscounts.Silver}
                onChange={(e) => setMembershipDiscounts({ ...membershipDiscounts, Silver: parseFloat(e.target.value) || 0 })}
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                  Gold Membership Discount (%)
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={membershipDiscounts.Gold}
                onChange={(e) => setMembershipDiscounts({ ...membershipDiscounts, Gold: parseFloat(e.target.value) || 0 })}
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 bg-purple-400 rounded-full"></span>
                  Platinum Membership Discount (%)
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={membershipDiscounts.Platinum}
                onChange={(e) => setMembershipDiscounts({ ...membershipDiscounts, Platinum: parseFloat(e.target.value) || 0 })}
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="20.00"
              />
            </div>
          </div>

          <button
            onClick={handleSaveDiscountConfig}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Membership Discounts'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ConfigScreen;
