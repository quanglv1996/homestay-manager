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

export default api;
