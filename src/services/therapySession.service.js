import api from "./api";
import { SESSION_STATUS } from "../constants/enums";
import { MOCK_SESSIONS, MOCK_AVAILABILITY_SUMMARY } from "./mockData";

/**
 * Normalizes a session object from the API.
 * Ensures consistent property names and data types.
 */
const normalizeSession = (session) => {
    if (!session) return null;

    // Handle nested data property if present
    const data = session.data || session;
    
    return {
        ...data,
        id: data.id || data.Id,
        therapistId: data.therapistId || data.TherapistId,
        userId: data.userId || data.UserId,
        status: data.status ?? data.Status ?? SESSION_STATUS.PENDING,
        // Backend sahəni sessionStartTime adı ilə qaytarır (həqiqi UTC)
        startTime: data.startTime || data.StartTime || data.sessionStartTime || data.SessionStartTime,
        endTime: data.endTime || data.EndTime || data.sessionEndTime || data.SessionEndTime,
        meetingLink: data.meetingLink || data.MeetingLink,
        // Ensure nested user/therapist objects are handled if they exist
        user: data.user || data.User,
        therapist: data.therapist || data.Therapist,
    };
};

// User Endpoints
export const createSession = async (data) => {
    return await api.post("/therapy-sessions", data);
};

export const getAvailableSlots = async (therapistId, from, to) => {
    try {
        return await api.get(`/therapy-sessions/therapist/${therapistId}/available-slots`, {
            params: { from, to }
        });
    } catch (error) {
        console.warn(`⚠️ Using mock data for available slots (API failed)`);
        return MOCK_SESSIONS.filter(s => s.therapistId === therapistId && s.status === "Available");
    }
};

export const getAvailabilitySummary = async (therapistId, year, month) => {
    try {
        return await api.get(`/therapy-sessions/therapist/${therapistId}/availability-summary`, {
            params: { year, month }
        });
    } catch (error) {
        console.warn(`⚠️ Using mock data for availability summary (API failed)`, error?.message);
        return MOCK_AVAILABILITY_SUMMARY;
    }
};

export const getMySessions = async () => {
    const sessions = await api.get("/therapy-sessions/my-sessions");
    return (Array.isArray(sessions) ? sessions : sessions?.data || []).map(normalizeSession);
};

export const confirmSessionAsUser = async (sessionId) => {
    return api.post(`/therapy-sessions/${sessionId}/confirm-user`);
};

export const cancelSession = async (sessionId) => {
    return await api.post(`/therapy-sessions/${sessionId}/cancel`);
};

export const rateSession = async (sessionId, rating, review) => {
    return api.post(`/therapy-sessions/${sessionId}/rate`, { rating, review });
};

// Therapist Endpoints
export const getMyTherapistSessions = async () => {
    const sessions = await api.get("/therapy-sessions/my-therapist-sessions");
    return (Array.isArray(sessions) ? sessions : sessions?.data || []).map(normalizeSession);
};

export const confirmSessionAsTherapist = async (sessionId, data) => {
    return api.post(`/therapy-sessions/${sessionId}/confirm-therapist`, data);
};

export const rejectSessionAsTherapist = async (sessionId) => {
    return api.post(`/therapy-sessions/${sessionId}/reject-therapist`);
};

export const completeSession = async (sessionId) => {
    return api.post(`/therapy-sessions/${sessionId}/complete`);
};

// Time Slot Management
export const setWorkingHours = async (data) => {
    return api.post("/therapy-sessions/working-hours", data);
};

export const getMyReservedSlots = async () => {
    return api.get("/therapy-sessions/my-reserved-slots");
};
