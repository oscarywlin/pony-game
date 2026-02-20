import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { gasService } from '../../api/gasService';

// ─── 可購買的造型清單（含預設造型，方便隨時換回） ───────────────
const AVAILABLE_SKINS = [
    { id: 'skin_default', seed: 'default_1', label: '預設', price: 0 },
    ...Array.from({ length: 12 }, (_, i) => ({
        id: `skin_${i + 1}`,
        seed: `Felix${i + 1}`,
        label: `造型 ${i + 1}`,
        price: 50,
    })),
];

interface StoreProps {
    onClose: () => void;
}

// ─── 小型 Modal 元件 ────────────────────────────────────────────
interface ModalProps {
    emoji: string;
    title: string;
    message: string;
    onClose: () => void;
    type?: 'success' | 'error' | 'info';
}

const Modal: React.FC<ModalProps> = ({ emoji, title, message, onClose, type = 'info' }) => {
    const colors = {
        success: 'from-green-400 to-emerald-500',
        error: 'from-red-400 to-pink-500',
        info: 'from-pink-400 to-purple-500',
    };
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.7, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.7, y: 30 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-3xl p-8 shadow-2xl border-4 border-white max-w-sm w-full mx-4 text-center"
            >
                <div className={`text-5xl mb-3`}>{emoji}</div>
                <h3 className={`text-2xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r ${colors[type]}`}>
                    {title}
                </h3>
                <p className="text-gray-600 font-medium mb-6">{message}</p>
                <button
                    onClick={onClose}
                    className={`px-8 py-3 bg-gradient-to-r ${colors[type]} text-white font-bold rounded-full shadow-md hover:scale-105 active:scale-95 transition-transform`}
                >
                    好的！
                </button>
            </motion.div>
        </motion.div>
    );
};

// ─── 商店主元件 ─────────────────────────────────────────────────
export const Store: React.FC<StoreProps> = ({ onClose }) => {
    const { userProfile, inventory, buySkin, equipSkin, updateCoins } = useGameStore();
    const [isLoading, setIsLoading] = useState(false);
    const [modal, setModal] = useState<Omit<ModalProps, 'onClose'> | null>(null);

    if (!userProfile) return null;

    const showModal = (props: Omit<ModalProps, 'onClose'>) => setModal(props);
    const closeModal = () => setModal(null);

    const handlePurchase = async (skinSeed: string, price: number) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            if (buySkin(skinSeed, price)) {
                const newCoins = userProfile.coins - price;

                // 同步 Inventory 到 GAS
                await gasService.updateInventory(
                    userProfile.id,
                    [...inventory.ownedSkins, skinSeed]
                );

                // 同步 Coins 到 GAS（這行之前漏掉了）
                await gasService.updateCoins(userProfile.id, newCoins);

                showModal({ emoji: '🎉', title: '購買成功！', message: `新造型入手！剩餘 ${newCoins} 枚星星幣。`, type: 'success' });
            } else {
                showModal({ emoji: '💔', title: '哎呀！', message: '星星幣不足，或這個造型已經擁有囉！', type: 'error' });
            }
        } catch {
            showModal({ emoji: '🌩️', title: '網路出錯了', message: '購買失敗，請稍後再試！', type: 'error' });
            // 若 API 失敗，退款（回滾本地狀態）
            updateCoins(price);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEquip = (skinSeed: string) => {
        equipSkin(skinSeed);
        showModal({ emoji: '✨', title: '換裝成功！', message: `新造型已上身，超可愛的～`, type: 'success' });
    };

    return (
        <>
            {/* Modal 層 */}
            <AnimatePresence>
                {modal && <Modal {...modal} onClose={closeModal} />}
            </AnimatePresence>

            <div className="p-8 bg-gradient-to-br from-purple-100 to-pink-100 min-h-screen">
                <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur rounded-3xl p-6 shadow-xl border-4 border-white">
                    <header className="flex justify-between items-center mb-8">
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 drop-shadow-sm">
                            🦄 夢幻造型商店
                        </h1>
                        <div className="flex items-center gap-4">
                            <div className="bg-yellow-100 px-6 py-2 rounded-full border-2 border-yellow-400 font-bold text-yellow-700 text-xl shadow-inner">
                                💰 {userProfile.coins} 枚星星幣
                            </div>
                            <button
                                onClick={onClose}
                                className="bg-pink-100 hover:bg-pink-200 text-pink-600 font-bold px-4 py-2 rounded-full transition-colors border-2 border-pink-300"
                            >
                                ✖ 關閉商店
                            </button>
                        </div>
                    </header>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {AVAILABLE_SKINS.map((skin) => {
                            const isOwned = skin.price === 0 || inventory.ownedSkins.includes(skin.seed);
                            const isEquipped = userProfile.currentSkinSeed === skin.seed;

                            return (
                                <motion.div
                                    key={skin.id}
                                    whileHover={{ y: -5 }}
                                    className={`flex flex-col items-center bg-white p-4 rounded-2xl shadow-md border-4 ${isEquipped ? 'border-green-400 bg-green-50' : 'border-pink-200'}`}
                                >
                                    <img
                                        src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${skin.seed}`}
                                        alt={skin.label}
                                        className="w-24 h-24 bg-blue-50 rounded-full mb-3"
                                    />
                                    <span className="text-xs font-bold text-gray-500 mb-2">{skin.label}</span>

                                    {isEquipped ? (
                                        <span className="text-green-500 font-bold py-2">⭐ 使用中</span>
                                    ) : isOwned ? (
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleEquip(skin.seed)}
                                            className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 rounded-xl transition-colors"
                                        >
                                            換上
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handlePurchase(skin.seed, skin.price)}
                                            disabled={userProfile.coins < skin.price || isLoading}
                                            className={`w-full font-bold py-2 rounded-xl text-white transition-colors ${userProfile.coins >= skin.price
                                                    ? 'bg-pink-500 hover:bg-pink-600'
                                                    : 'bg-gray-300 cursor-not-allowed'
                                                }`}
                                        >
                                            {isLoading ? '...' : `${skin.price} 幣`}
                                        </motion.button>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
};
