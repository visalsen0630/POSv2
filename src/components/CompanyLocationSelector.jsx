import React, { useState, useEffect } from 'react';
import { getUserCompanies, getUserLocations } from '../firebase/db';

const CompanyLocationSelector = ({ user, onSelectionComplete }) => {
  const [companies, setCompanies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserCompanies();
  }, []);

  const fetchUserCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const companyData = await getUserCompanies(user.id);
      setCompanies(companyData);
      if (companyData.length === 1) {
        handleCompanySelect(companyData[0].id, companyData);
      }
    } catch (err) {
      setError('Unable to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = async (companyId, companiesList = companies) => {
    const company = companiesList.find(c => c.id === companyId);
    setSelectedCompany(company);
    setSelectedLocation(null);
    setLocations([]);
    if (!companyId) return;

    setLoading(true);
    setError('');
    try {
      const locationsData = await getUserLocations(user.id, companyId);
      setLocations(locationsData);
    } catch (err) {
      setError('Unable to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    setSelectedLocation(location);
  };

  const handleContinue = () => {
    if (selectedCompany && selectedLocation) {
      onSelectionComplete({ company: selectedCompany, location: selectedLocation });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-teal-600">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {user.full_name}!</h1>
          <p className="text-gray-600">Select your company and location</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <select
              value={selectedCompany?.id || ''}
              onChange={(e) => handleCompanySelect(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              disabled={loading}
            >
              <option value="">Select a company...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <select
              value={selectedLocation?.id || ''}
              onChange={(e) => handleLocationSelect(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              disabled={!selectedCompany || loading || locations.length === 0}
            >
              <option value="">
                {!selectedCompany ? 'Select a company first...' : locations.length === 0 ? 'No locations available' : 'Select a location...'}
              </option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}{location.city ? ` - ${location.city}` : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleContinue}
            disabled={!selectedCompany || !selectedLocation || loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Continue to POS'}
          </button>
        </div>

        {selectedCompany && selectedLocation && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Selected:</h3>
            <p className="text-sm text-gray-600"><span className="font-medium">Company:</span> {selectedCompany.name}</p>
            <p className="text-sm text-gray-600"><span className="font-medium">Location:</span> {selectedLocation.name}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyLocationSelector;
