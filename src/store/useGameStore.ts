import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProfile, Inventory, GameState } from '../types';

interface GameStore {
    userProfile: UserProfile | null;
    inventory: Inventory;
    gameState: GameState;

    // Actions
    login: (profile: UserProfile, inventory: Inventory) => void;
    updateCoins: (amount: number) => void;
    buySkin: (skinSeed: string, cost: number) => boolean;
    equipSkin: (skinSeed: string) => void;
    startGame: (subject: string, grade: number) => void;
    decrementHeart: () => void;
    addScore: (points: number) => void;
    endGame: (victory: boolean) => void;
}

// @ts-ignore
const INITIAL_HEARTS = Number(import.meta.env.VITE_INITIAL_HEARTS) || 3;

export const useGameStore = create<GameStore>()(
    persist(
        (set, get) => ({
            userProfile: null,
            inventory: { ownedSkins: ['default_1'] },
            gameState: { currentHearts: INITIAL_HEARTS, score: 0, subject: '', grade: 1, status: 'idle' },

            login: (profile, inventory) => set({ userProfile: profile, inventory }),

            updateCoins: (amount) => set((state) => ({
                userProfile: state.userProfile ? { ...state.userProfile, coins: state.userProfile.coins + amount } : null
            })),

            buySkin: (skinSeed, cost) => {
                const { userProfile, inventory } = get();
                if (!userProfile || userProfile.coins < cost || inventory.ownedSkins.includes(skinSeed)) {
                    return false;
                }

                set({
                    userProfile: { ...userProfile, coins: userProfile.coins - cost },
                    inventory: { ownedSkins: [...inventory.ownedSkins, skinSeed] }
                });
                return true;
            },

            equipSkin: (skinSeed) => set((state) => ({
                userProfile: state.userProfile ? { ...state.userProfile, currentSkinSeed: skinSeed } : null
            })),

            startGame: (subject, grade) => set({
                gameState: { currentHearts: INITIAL_HEARTS, score: 0, subject, grade, status: 'playing' }
            }),

            decrementHeart: () => set((state) => {
                const newHearts = Math.max(0, state.gameState.currentHearts - 1);
                return {
                    gameState: { ...state.gameState, currentHearts: newHearts, status: newHearts === 0 ? 'gameover' : 'playing' }
                };
            }),

            addScore: (points) => set((state) => ({
                gameState: { ...state.gameState, score: state.gameState.score + points }
            })),

            endGame: (victory) => set((state) => ({
                gameState: { ...state.gameState, status: victory ? 'victory' : 'gameover' }
            })),
        }),
        {
            name: 'pony-game-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
