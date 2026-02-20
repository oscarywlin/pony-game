import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface GameModalProps {
    emoji: string;
    title: string;
    message: string;
    onClose: () => void;
    type?: 'success' | 'error' | 'info';
}

const COLORS: Record<string, string> = {
    success: 'from-green-400 to-emerald-500',
    error: 'from-red-400 to-pink-500',
    info: 'from-pink-400 to-purple-500',
};

export const GameModal: React.FC<GameModalProps & { visible: boolean }> = ({
    visible, emoji, title, message, onClose, type = 'info',
}) => {
    const color = COLORS[type];
    return (
        <AnimatePresence>
            {visible && (
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
                        <div className="text-5xl mb-3">{emoji}</div>
                        <h3 className={`text-2xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r ${color}`}>
                            {title}
                        </h3>
                        <p className="text-gray-600 font-medium mb-6 whitespace-pre-line">{message}</p>
                        <button
                            onClick={onClose}
                            className={`px-8 py-3 bg-gradient-to-r ${color} text-white font-bold rounded-full shadow-md hover:scale-105 active:scale-95 transition-transform`}
                        >
                            好的！
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
