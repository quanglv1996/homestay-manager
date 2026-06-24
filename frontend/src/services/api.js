import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');

// Houses
export const getHouses = () => api.get('/houses');
export const getHouseById = (id) => api.get(`/houses/${id}`);
export const createHouse = (data) => api.post('/houses', data);
export const updateHouse = (id, data) => api.put(`/houses/${id}`, data);
export const deleteHouse = (id) => api.delete(`/houses/${id}`);

// Rooms
export const getRooms = (houseId) => api.get('/rooms', { params: { houseId } });
export const getRoomById = (id) => api.get(`/rooms/${id}`);
export const createRoom = (data) => api.post('/rooms', data);
export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data);
export const deleteRoom = (id) => api.delete(`/rooms/${id}`);

// Beds
export const getBeds = (roomId) => api.get('/beds', { params: { roomId } });
export const getBedById = (id) => api.get(`/beds/${id}`);
export const createBed = (data) => api.post('/beds', data);
export const updateBed = (id, data) => api.put(`/beds/${id}`, data);
export const deleteBed = (id) => api.delete(`/beds/${id}`);

// Contracts
export const getContracts = () => api.get('/contracts');
export const getContractsWithAssignments = () => api.get('/contracts/with-assignments');
export const getContractById = (id) => api.get(`/contracts/${id}`);
export const createContract = (data) => api.post('/contracts', data);
export const updateContract = (id, data) => api.put(`/contracts/${id}`, data);
export const deleteContract = (id) => api.delete(`/contracts/${id}`);

// Assignments
export const getAssignments = () => api.get('/assignments');
export const getAssignmentsByBedId = (bedId) => api.get(`/assignments/bed/${bedId}`);
export const createAssignment = (data) => api.post('/assignments', data);
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`);
export const deleteAssignmentByBedLevel = (bedId, level) => api.delete(`/assignments/bed/${bedId}/level/${level}`);

// Utility Bills
export const getUtilityBills = (contractId, month) => api.get('/utility-bills', { params: { contract_id: contractId, month } });
export const getUtilityBillById = (id) => api.get(`/utility-bills/${id}`);
export const createUtilityBill = (data) => api.post('/utility-bills', data);
export const updateUtilityBill = (id, data) => api.put(`/utility-bills/${id}`, data);
export const deleteUtilityBill = (id) => api.delete(`/utility-bills/${id}`);

// Expenses
export const getExpenses = (houseId, month) => api.get('/expenses', { params: { house_id: houseId, month } });
export const getExpenseById = (id) => api.get(`/expenses/${id}`);
export const createExpense = (data) => api.post('/expenses', data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

// Rent Expenses
export const getRentExpenses = (houseId, month) => api.get('/rent-expenses', { params: { house_id: houseId, month } });
export const getRentExpenseById = (id) => api.get(`/rent-expenses/${id}`);
export const createRentExpense = (data) => api.post('/rent-expenses', data);
export const updateRentExpense = (id, data) => api.put(`/rent-expenses/${id}`, data);
export const deleteRentExpense = (id) => api.delete(`/rent-expenses/${id}`);

// Rent Collections
export const getRentCollections = (contractId, month) => api.get('/rent-collections', { params: { contract_id: contractId, month } });
export const getRentCollectionById = (id) => api.get(`/rent-collections/${id}`);
export const createRentCollection = (data) => api.post('/rent-collections', data);
export const updateRentCollection = (id, data) => api.put(`/rent-collections/${id}`, data);
export const deleteRentCollection = (id) => api.delete(`/rent-collections/${id}`);

// Revenue Statistics
export const getRevenueStats = (month) => api.get('/dashboard/revenue', { params: { month } });
export const getRevenueStatsByDome = (month) => api.get('/dashboard/revenue-by-dome', { params: { month } });
export const getRevenueHistory = (months = 12, houseId = null) => api.get('/dashboard/revenue-history', { params: { months, house_id: houseId } });

export default api;
