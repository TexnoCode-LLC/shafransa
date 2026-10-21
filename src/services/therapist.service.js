import api from "./api";

// Xəta olanda mock data qaytarılmır — əks halda saytda saxta fitoterapevtlər görünür.
// Admin əməliyyatları pages/admin/queries.js-dədir.
export const getVerifiedTherapists = async () => {
    return await api.get("/therapists/verified");
};

export const getTherapistById = async (id) => {
    return await api.get(`/therapists/${id}`);
};

export const registerAsTherapist = async (data) => {
    return api.post("/therapists/register", data);
};

export const getMyTherapistProfile = async () => {
    return api.get("/therapists/me");
};

export const updateMyProfile = async (data) => {
    return api.put("/therapists/me", data);
};
