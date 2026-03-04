import axios from "axios";

// Instância base do Axios apontando para o Backend FastAPI
export const api = axios.create({
    baseURL: "http://localhost:8000",
    headers: {
        "Content-Type": "application/json",
    },
});

// Funções Helpers para as Fases do Jogo

// --- FASE 1 & FASE 6: Heroes ---
export const fetchPlayerHeroes = async (playerId: string) => {
    const response = await api.get(`/players/${playerId}/heroes`);
    return response.data;
};

// --- FASE 7: Economy & Gacha ---
export const fetchPlayerWallet = async (playerId: string) => {
    const response = await api.get(`/economy/wallet/${playerId}`);
    return response.data;
};

export const pullGacha = async (playerId: string, amount: number, currency: "crystal" | "ticket") => {
    const response = await api.post(`/economy/gacha/${playerId}/pull`, {
        amount,
        use_currency: currency,
    });
    return response.data; // { heroes_pulled, wallet_state, message }
};
