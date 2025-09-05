import { useState, useEffect } from "react";

const API = "/api";

export default function App() {
  const [gateways, setGateways] = useState([]);
  const [form, setForm] = useState({ serial_number: "", name: "", ipv4_address: "" });
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [deviceForm, setDeviceForm] = useState({ uid: "", vendor: "", status: "online" });
  const [editingGatewayId, setEditingGatewayId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", ipv4_address: "", status: "active" });
  const [errors, setErrors] = useState({});
  const [deviceErrors, setDeviceErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchGateways = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API}/gateways`);
      const data = await res.json();
      setGateways(data);
    } catch (error) {
      console.error('Error fetching gateways:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchGateways(); }, []);

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const clearErrors = () => setErrors({});
  const clearDeviceErrors = () => setDeviceErrors({});

  const createGateway = async (e) => {
    e.preventDefault();
    clearErrors();
    setIsLoading(true);
    
    try {
      const payload = { ...form, status: "active" };
      const res = await fetch(`${API}/gateways`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.message && Array.isArray(errorData.message)) {
          const fieldErrors = {};
          errorData.message.forEach(msg => {
            if (msg.includes('serial_number')) fieldErrors.serial_number = msg;
            else if (msg.includes('name')) fieldErrors.name = msg;
            else if (msg.includes('ipv4_address')) fieldErrors.ipv4_address = msg;
            else fieldErrors.general = msg;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: errorData.error || 'Failed to create gateway' });
        }
        return;
      }
      
      setForm({ serial_number: "", name: "", ipv4_address: "" });
      await fetchGateways();
      showSuccessMessage("Gateway created successfully!");
    } catch (error) {
      setErrors({ general: 'Network error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteGateway = async (id) => {
    if (!window.confirm("Are you sure you want to delete this gateway?")) return;
    
    try {
      const res = await fetch(`${API}/gateways/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedGateway?.id === id) setSelectedGateway(null);
        await fetchGateways();
        showSuccessMessage("Gateway deleted successfully!");
      }
    } catch (error) {
      setErrors({ general: 'Failed to delete gateway' });
    }
  };

  const startEdit = (gw) => {
    setEditingGatewayId(gw.id);
    setEditForm({ name: gw.name, ipv4_address: gw.ipv4_address, status: gw.status });
    clearErrors();
  };

  const saveEdit = async (id) => {
    clearErrors();
    setIsLoading(true);
    
    try {
      const res = await fetch(`${API}/gateways/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.message && Array.isArray(errorData.message)) {
          const fieldErrors = {};
          errorData.message.forEach(msg => {
            if (msg.includes('name')) fieldErrors.name = msg;
            else if (msg.includes('ipv4_address')) fieldErrors.ipv4_address = msg;
            else fieldErrors.general = msg;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: errorData.error || 'Failed to update gateway' });
        }
        return;
      }
      
      setEditingGatewayId(null);
      await fetchGateways();
      showSuccessMessage("Gateway updated successfully!");
    } catch (error) {
      setErrors({ general: 'Network error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const attachDevice = async (e) => {
    e.preventDefault();
    if (!selectedGateway) return;
    
    clearDeviceErrors();
    setIsLoading(true);
    
    try {
      const payload = { ...deviceForm, uid: Number(deviceForm.uid) };
      const res = await fetch(`${API}/gateways/${selectedGateway.id}/devices`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.message && Array.isArray(errorData.message)) {
          const fieldErrors = {};
          errorData.message.forEach(msg => {
            if (msg.includes('uid')) fieldErrors.uid = msg;
            else if (msg.includes('vendor')) fieldErrors.vendor = msg;
            else if (msg.includes('status')) fieldErrors.status = msg;
            else fieldErrors.general = msg;
          });
          setDeviceErrors(fieldErrors);
        } else {
          setDeviceErrors({ general: errorData.message || 'Failed to add device' });
        }
        return;
      }
      
      setDeviceForm({ uid: "", vendor: "", status: "online" });
      setDeviceErrors({});
      await fetchGateways();
      showSuccessMessage("Device added successfully!");
    } catch (error) {
      setDeviceErrors({ general: 'Network error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const detachDevice = async (gatewayId, deviceId) => {
    if (!window.confirm("Remove this device?")) return;
    
    try {
      const res = await fetch(`${API}/gateways/${gatewayId}/devices/${deviceId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchGateways();
        showSuccessMessage("Device removed successfully!");
      }
    } catch (error) {
      setErrors({ general: 'Failed to remove device' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gateway Manager</h1>
              <p className="text-gray-600 mt-1">Manage your IoT gateways and devices</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">System Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Gateway Error Message */}
        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        {/* Create Gateway Card */}
        <div className="card p-6 mb-8">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900">Add New Gateway</h2>
              <p className="text-sm text-gray-500">Create a new IoT gateway</p>
            </div>
          </div>
          
          <form onSubmit={createGateway} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                <input 
                  className={errors.serial_number ? 'input-field-error' : 'input-field'}
                  placeholder="Enter serial number"
                  value={form.serial_number} 
                  onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                />
                {errors.serial_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.serial_number}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input 
                  className={errors.name ? 'input-field-error' : 'input-field'}
                  placeholder="Enter gateway name"
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IPv4 Address</label>
                <input 
                  className={errors.ipv4_address ? 'input-field-error' : 'input-field'}
                  placeholder="192.168.1.1"
                  value={form.ipv4_address} 
                  onChange={(e) => setForm({ ...form, ipv4_address: e.target.value })}
                />
                {errors.ipv4_address && (
                  <p className="mt-1 text-sm text-red-600">{errors.ipv4_address}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Gateway
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Gateways List */}
        <div className="space-y-6">
          {isLoading && gateways.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-400 transition ease-in-out duration-150 cursor-not-allowed">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading gateways...
              </div>
            </div>
          ) : gateways.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No gateways</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new gateway.</p>
            </div>
          ) : (
            gateways.map((gw) => (
              <div key={gw.id} className="card">
                {editingGatewayId === gw.id ? (
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <h3 className="ml-3 text-lg font-semibold text-gray-900">Edit Gateway</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input 
                          className={errors.name ? 'input-field-error' : 'input-field'}
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">IPv4 Address</label>
                        <input 
                          className={errors.ipv4_address ? 'input-field-error' : 'input-field'}
                          value={editForm.ipv4_address}
                          onChange={(e) => setEditForm({ ...editForm, ipv4_address: e.target.value })}
                        />
                        {errors.ipv4_address && (
                          <p className="mt-1 text-sm text-red-600">{errors.ipv4_address}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select 
                          className="input-field"
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="decommissioned">Decommissioned</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => saveEdit(gw.id)} 
                        disabled={isLoading}
                        className="btn-primary bg-green-600 hover:bg-green-700 focus:ring-green-500"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save Changes
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => setEditingGatewayId(null)} 
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{gw.name}</h3>
                          <span className={`ml-3 status-badge ${
                            gw.status === 'active' ? 'status-active' :
                            gw.status === 'inactive' ? 'status-inactive' :
                            'status-decommissioned'
                          }`}>
                            {gw.status.charAt(0).toUpperCase() + gw.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span className="font-medium">Serial:</span> {gw.serial_number}
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            <span className="font-medium">IP:</span> {gw.ipv4_address}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button 
                          onClick={() => setSelectedGateway(gw)}
                          className="btn-primary bg-green-600 hover:bg-green-700 focus:ring-green-500"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                          </svg>
                          Devices
                        </button>
                        <button 
                          onClick={() => startEdit(gw)}
                          className="btn-secondary"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button 
                          onClick={() => deleteGateway(gw.id)}
                          className="btn-danger"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Devices Section */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">Connected Devices ({gw.devices.length})</h4>
                        {gw.devices.length > 0 && (
                          <span className="text-xs text-gray-500">Max: 10 devices</span>
                        )}
                      </div>
                      
                      {gw.devices.length === 0 ? (
                        <div className="text-center py-4">
                          <svg className="mx-auto h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                          </svg>
                          <p className="mt-1 text-sm text-gray-500">No devices connected</p>
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          {gw.devices.map((d) => (
                            <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  d.status === 'online' ? 'bg-green-400' :
                                  d.status === 'offline' ? 'bg-red-400' :
                                  'bg-yellow-400'
                                }`}></div>
                                <div>
                                  <span className="text-sm font-medium text-gray-900">{d.vendor}</span>
                                  <span className="text-xs text-gray-500 ml-2">UID: {d.uid}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`status-badge ${
                                  d.status === 'online' ? 'status-online' :
                                  d.status === 'offline' ? 'status-offline' :
                                  'status-maintenance'
                                }`}>
                                  {d.status}
                                </span>
                                <button 
                                  onClick={() => detachDevice(gw.id, d.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                  title="Remove device"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Device Modal */}
        {selectedGateway && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-xl bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Device to {selectedGateway.name}</h3>
                <button 
                  onClick={() => {
                    setSelectedGateway(null);
                    clearDeviceErrors();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Device Error Message */}
              {deviceErrors.general && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 animate-fade-in">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{deviceErrors.general}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={attachDevice} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Device UID</label>
                  <input 
                    className={deviceErrors.uid ? 'input-field-error' : 'input-field'}
                    placeholder="Enter device UID"
                    value={deviceForm.uid}
                    onChange={(e) => setDeviceForm({ ...deviceForm, uid: e.target.value })}
                  />
                  {deviceErrors.uid && (
                    <p className="mt-1 text-sm text-red-600">{deviceErrors.uid}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
                  <input 
                    className={deviceErrors.vendor ? 'input-field-error' : 'input-field'}
                    placeholder="Enter vendor name"
                    value={deviceForm.vendor}
                    onChange={(e) => setDeviceForm({ ...deviceForm, vendor: e.target.value })}
                  />
                  {deviceErrors.vendor && (
                    <p className="mt-1 text-sm text-red-600">{deviceErrors.vendor}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select 
                    className="input-field"
                    value={deviceForm.status}
                    onChange={(e) => setDeviceForm({ ...deviceForm, status: e.target.value })}
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex-1"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </>
                    ) : (
                      'Add Device'
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedGateway(null);
                      clearDeviceErrors();
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
