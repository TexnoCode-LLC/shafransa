import api from "./api";

export const getMe = async () => {
    return api.get("/user/me");
};

export const updateMe = async (data) => {
    return api.put("/user/me", data);
};

export const getAllUsers = async () => {
    return api.get("/user");
};

// Profil şəkli fayl kimi yüklənir (əvvəl base64 mətn kimi PUT /user/me ilə göndərilirdi)
export const uploadMyAvatar = async (file) => {
    const form = new FormData();
    form.append("file", file);
    return api.put("/user/me/avatar", form);
};

export const deleteMyAvatar = async () => {
    return api.delete("/user/me/avatar");
};
