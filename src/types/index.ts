export interface UserProfile {
    id: string;
    username: string;
    grade: number;
    score: number;
    coins: number;
    currentSkinSeed: string;
}

export interface Inventory {
    ownedSkins: string[]; // 存放 Skin Seed
}

export interface GameState {
    currentHearts: number;
    score: number;
    subject: string;
    grade: number;
    status: 'idle' | 'playing' | 'gameover' | 'victory';
}

export interface Question {
    id: number;
    subject: string;
    grade: number;
    text: string;
    options: {
        A: string;
        B: string;
        C: string;
        D: string;
    };
    answer: 'A' | 'B' | 'C' | 'D';
}

export interface GasResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
