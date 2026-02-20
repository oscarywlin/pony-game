import { Question, UserProfile, Inventory } from '../types';

// 開發模式使用 Vite proxy 路徑避免 CORS；正式環境（如 GitHub Pages）直接呼叫 .env 裡的網址
const GAS_URL = import.meta.env.DEV
    ? '/api/gas'
    : import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL;

// 通用 Fetch 封裝
async function fetchGas<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
    try {
        // GAS 的 doPost 會強制 redirect，必須使用 'follow' 讓 fetch 跟隨
        const response = await fetch(GAS_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action, ...payload }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // GAS 直接回傳資料物件，不包在 { success, data } 裡
        const result = await response.json() as T;
        console.log(`[GAS Response ${action}]:`, result);
        return result;
    } catch (error) {
        console.error(`[GAS Error Action: ${action}]:`, error);
        throw new Error('伺服器小馬似乎迷路了，請稍後再試！');
    }
}


export const gasService = {
    loginOrCreateUser: (username: string, grade: number) =>
        fetchGas<{ profile: UserProfile, inventory: Inventory }>('login', { data: { username, grade } }),

    getQuestions: (subject: string, grade: number) =>
        fetchGas<{ questions: Question[] }>('getQuestions', { data: { subject, grade } }),

    updateCoins: (userId: string, amount: number) =>
        fetchGas<void>('updateCoins', { data: { userId, amount } }),

    updateInventory: (userId: string, ownedSkins: string[]) =>
        fetchGas<void>('updateInventory', { data: { userId, ownedSkins } }),
};
