import React, { useState, useEffect } from 'react';

const CompanyLocationSelector = ({ user, onSelectionComplete }) => {
  const [companies, setCompanies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch companies on component mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/companies');
      const data = await response.json();

      if (!response.ok) {
        setError('Failed to load companies');
        return;
      }

      setCompanies(data);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = async (companyId) => {
    console.log('Selected company ID:', companyId);
    const company = companies.find(c => c.id === companyId);
    console.log('Found company:', company);
    setSelectedCompany(company);
    setSelectedLocation(null);
    setLocations([]);

    if (!companyId) return;

    setLoading(true);
    setError('');

    try {
      console.log('Fetching locations for company:', companyId);
      const response = await fetch(`http://localhost:5000/api/companies/${companyId}/locations`);
      const data = await response.json();
      console.log('Locations response:', data);

      if (!response.ok) {
        setError('Failed to load locations');
        return;
      }

      setLocations(data);
    } catch (err) {
      console.error('Error fetching locations:', err);
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
      onSelectionComplete({
        company: selectedCompany,
        location: selectedLocation,
      });
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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Company Selection */}
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <select
              id="company"
              value={selectedCompany?.id || ''}
              onChange={(e) => handleCompanySelect(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              disabled={loading}
            >
              <option value="">Select a company...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Location Selection */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <select
              id="location"
              value={selectedLocation?.id || ''}
              onChange={(e) => handleLocationSelect(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              disabled={!selectedCompany || loading || locations.length === 0}
            >
              <option value="">
                {!selectedCompany
                  ? 'Select a company first...'
                  : locations.length === 0
                    ? 'No locations available'
                    : 'Select a location...'}
              </option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} - {location.city}
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

        {/* Display selection info */}
        {selectedCompany && selectedLocation && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Selected:</h3>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Company:</span> {selectedCompany.name}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Location:</span> {selectedLocation.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyLocationSelector;
