import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '../../types';
import { useGameStore } from '../../store/useGameStore';

interface QuizCardProps {
    question: Question;
    onNext: () => void;
}

const QuizCardComponent: React.FC<QuizCardProps> = ({ question, onNext }) => {
    const { decrementHeart, addScore } = useGameStore();
    const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
    const [isErrorShake, setIsErrorShake] = useState(false);
    const [showStars, setShowStars] = useState(false);

    const handleAnswer = useCallback((optKey: string) => {
        if (selectedOpt) return; // 防止連點

        setSelectedOpt(optKey);
        const isCorrect = optKey === question.answer;

        if (isCorrect) {
            setShowStars(true);
            addScore(10);
            setTimeout(() => {
                setShowStars(false);
                onNext();
                setSelectedOpt(null);
            }, 1500);
        } else {
            setIsErrorShake(true);
            decrementHeart();
            setTimeout(() => {
                setIsErrorShake(false);
                onNext();
                setSelectedOpt(null);
            }, 1500);
        }
    }, [question, onNext, addScore, decrementHeart, selectedOpt]);

    return (
        <div className="relative w-full max-w-2xl mx-auto">
            {/* 答對星星特效 */}
            <AnimatePresence>
                {showStars && (
                    <motion.div
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: [1, 1.5, 2], opacity: [1, 0.8, 0] }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 text-5xl pointer-events-none z-50"
                    >
                        ✨⭐✨
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                animate={isErrorShake ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-[0_8px_30px_rgb(255,182,193,0.5)] border-4 ${isErrorShake ? 'border-red-400 bg-red-50/90' : 'border-pink-300'
                    }`}
            >
                <h2 className="text-2xl font-bold text-purple-700 mb-6 text-center">
                    {question.text}
                </h2>

                <div className="grid grid-cols-2 gap-4">
                    {(Object.entries(question.options) as [string, string][]).map(([key, val]) => {
                        let btnColor = "bg-pink-100 hover:bg-pink-200 text-pink-800 border-pink-300";

                        // 點擊後的顏色反饋
                        if (selectedOpt) {
                            if (key === question.answer) {
                                btnColor = "bg-green-300 text-green-900 border-green-500 scale-105";
                            } else if (key === selectedOpt) {
                                btnColor = "bg-red-400 text-white border-red-600 scale-95";
                            } else {
                                btnColor = "bg-gray-100 text-gray-400 border-gray-200";
                            }
                        }

                        return (
                            <motion.button
                                key={key}
                                whileHover={!selectedOpt ? { scale: 1.05 } : {}}
                                whileTap={!selectedOpt ? { scale: 0.95 } : {}}
                                onClick={() => handleAnswer(key)}
                                disabled={!!selectedOpt}
                                className={`flex items-center p-4 rounded-2xl border-4 font-bold text-lg transition-colors duration-300 ${btnColor}`}
                            >
                                <span className="bg-white/50 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                                    {key}
                                </span>
                                {val}
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};

export const QuizCard = React.memo(QuizCardComponent);
