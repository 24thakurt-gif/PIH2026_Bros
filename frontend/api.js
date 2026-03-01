/* ============================================
   MedVault – API Client + Auth Layer
   Handles backend communication & auth state
   ============================================ */

const API = (() => {
    // Set your backend URL here when hosting backend separately
    // e.g., 'https://your-backend.onrender.com/api' or '/api' for same-origin
    const BASE = window.MEDVAULT_API_BASE || '/api';

    // ==================== TOKEN MANAGEMENT ====================
    function getToken() { return localStorage.getItem('medvault_token'); }
    function setToken(t) { localStorage.setItem('medvault_token', t); }
    function clearAuth() {
        localStorage.removeItem('medvault_token');
        localStorage.removeItem('medvault_user');
    }
    function getUser() {
        try { return JSON.parse(localStorage.getItem('medvault_user')); } catch { return null; }
    }
    function setUser(u) { localStorage.setItem('medvault_user', JSON.stringify(u)); }
    function isLoggedIn() { return !!getToken(); }

    // ==================== HTTP HELPER ====================
    async function request(method, endpoint, body = null) {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        const token = getToken();
        if (token) opts.headers['Authorization'] = `Bearer ${token}`;
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(`${BASE}${endpoint}`, opts);
        const data = await res.json();
        if (!res.ok) {
            if (res.status === 401) { clearAuth(); window.dispatchEvent(new Event('auth:logout')); }
            const err = new Error(data.error || 'Request failed');
            if (data.needsVerification) err.needsVerification = true;
            if (data.email) err.email = data.email;
            throw err;
        }
        return data;
    }

    // ==================== AUTH ====================
    async function register(name, email, password) {
        const data = await request('POST', '/auth/register', { name, email, password });
        setToken(data.token); setUser(data.user);
        return data;
    }

    async function login(email, password) {
        const data = await request('POST', '/auth/login', { email, password });
        setToken(data.token); setUser(data.user);
        return data;
    }

    function logout() { clearAuth(); }

    // ==================== DATA SYNC ====================
    // Pull data from backend into localStorage cache
    async function syncAll() {
        if (!isLoggedIn()) return;
        try {
            const [meds, checkups, docs] = await Promise.all([
                request('GET', '/medicines'),
                request('GET', '/checkups'),
                request('GET', '/documents')
            ]);
            localStorage.setItem('medvault_medicines', JSON.stringify(meds));
            localStorage.setItem('medvault_checkups', JSON.stringify(checkups));
            localStorage.setItem('medvault_documents', JSON.stringify(docs));
        } catch (err) {
            console.warn('Sync failed, using local cache:', err.message);
        }
    }

    // ---- Medicines ----
    async function addMedicine(med) {
        const saved = await request('POST', '/medicines', med);
        const meds = JSON.parse(localStorage.getItem('medvault_medicines') || '[]');
        meds.push(saved);
        localStorage.setItem('medvault_medicines', JSON.stringify(meds));
        return saved;
    }

    async function deleteMedicine(id) {
        await request('DELETE', `/medicines/${id}`);
        let meds = JSON.parse(localStorage.getItem('medvault_medicines') || '[]');
        meds = meds.filter(m => m._id !== id);
        localStorage.setItem('medvault_medicines', JSON.stringify(meds));
    }

    async function takeDose(id) {
        const updated = await request('PATCH', `/medicines/${id}/dose`);
        let meds = JSON.parse(localStorage.getItem('medvault_medicines') || '[]');
        meds = meds.map(m => m._id === id ? updated : m);
        localStorage.setItem('medvault_medicines', JSON.stringify(meds));
        return updated;
    }

    async function restockMedicine(id, amount) {
        const updated = await request('PATCH', `/medicines/${id}/restock`, { amount });
        let meds = JSON.parse(localStorage.getItem('medvault_medicines') || '[]');
        meds = meds.map(m => m._id === id ? updated : m);
        localStorage.setItem('medvault_medicines', JSON.stringify(meds));
        return updated;
    }

    // ---- Checkups ----
    async function addCheckup(checkup) {
        const saved = await request('POST', '/checkups', checkup);
        const checkups = JSON.parse(localStorage.getItem('medvault_checkups') || '[]');
        checkups.push(saved);
        localStorage.setItem('medvault_checkups', JSON.stringify(checkups));
        return saved;
    }

    async function deleteCheckup(id) {
        await request('DELETE', `/checkups/${id}`);
        let checkups = JSON.parse(localStorage.getItem('medvault_checkups') || '[]');
        checkups = checkups.filter(c => c._id !== id);
        localStorage.setItem('medvault_checkups', JSON.stringify(checkups));
    }

    // ---- Documents ----
    async function addDocument(doc) {
        const saved = await request('POST', '/documents', doc);
        const docs = JSON.parse(localStorage.getItem('medvault_documents') || '[]');
        docs.push(saved);
        localStorage.setItem('medvault_documents', JSON.stringify(docs));
        return saved;
    }

    async function getDocument(id) {
        return request('GET', `/documents/${id}`);
    }

    async function deleteDocument(id) {
        await request('DELETE', `/documents/${id}`);
        let docs = JSON.parse(localStorage.getItem('medvault_documents') || '[]');
        docs = docs.filter(d => d._id !== id);
        localStorage.setItem('medvault_documents', JSON.stringify(docs));
    }

    async function updateDocument(id, data) {
        const updated = await request('PUT', `/documents/${id}`, data);
        let docs = JSON.parse(localStorage.getItem('medvault_documents') || '[]');
        docs = docs.map(d => (d._id === id) ? { ...d, ...updated } : d);
        localStorage.setItem('medvault_documents', JSON.stringify(docs));
        return updated;
    }

    async function updateMedicine(id, data) {
        const updated = await request('PUT', `/medicines/${id}`, data);
        let meds = JSON.parse(localStorage.getItem('medvault_medicines') || '[]');
        meds = meds.map(m => (m._id === id) ? updated : m);
        localStorage.setItem('medvault_medicines', JSON.stringify(meds));
        return updated;
    }

    async function updateCheckup(id, data) {
        const updated = await request('PUT', `/checkups/${id}`, data);
        let checkups = JSON.parse(localStorage.getItem('medvault_checkups') || '[]');
        checkups = checkups.map(c => (c._id === id) ? updated : c);
        localStorage.setItem('medvault_checkups', JSON.stringify(checkups));
        return updated;
    }

    // ---- Notifications (Email) ----
    async function sendMedicineReminderEmail(medicines) {
        return request('POST', '/notifications/medicine-reminder', { medicines });
    }

    async function sendLowStockEmail(medicines) {
        return request('POST', '/notifications/low-stock', { medicines });
    }

    return {
        isLoggedIn, getToken, getUser, setUser,
        register, login, logout, syncAll,
        addMedicine, deleteMedicine, takeDose, restockMedicine, updateMedicine,
        addCheckup, deleteCheckup, updateCheckup,
        addDocument, getDocument, deleteDocument, updateDocument,
        sendMedicineReminderEmail, sendLowStockEmail
    };
})();
