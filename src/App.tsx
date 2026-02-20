import { useState } from 'react';
import { QuizCard } from './components/game/QuizCard';
import { Store } from './components/store/Store';
import { GameModal, GameModalProps } from './components/ui/GameModal';
import { useGameStore } from './store/useGameStore';
import { gasService } from './api/gasService';
import { Question } from './types';

function App() {
    const { userProfile, login, gameState, startGame, updateCoins } = useGameStore();
    const [currentView, setCurrentView] = useState<'login' | 'home' | 'store' | 'game'>('login');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedSubject, setSelectedSubject] = useState('數學');
    const [selectedGrade, setSelectedGrade] = useState(1);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Modal 狀態
    const [modal, setModal] = useState<(Omit<GameModalProps, 'onClose' | 'visible'>) | null>(null);
    const showModal = (m: Omit<GameModalProps, 'onClose' | 'visible'>) => setModal(m);
    const closeModal = () => setModal(null);

    // 登入頁的輸入狀態
    const [inputUsername, setInputUsername] = useState('');
    const [inputGrade, setInputGrade] = useState(1);
    const [isLoginLoading, setIsLoginLoading] = useState(false);

    const handleLogin = async () => {
        if (!inputUsername.trim()) {
            showModal({ emoji: '🦄', title: '先告訴我你叫什麼名字！', message: '請輸入你的名字才能進入彩虹樂園喔！', type: 'info' });
            return;
        }
        setIsLoginLoading(true);
        try {
            const response = await gasService.loginOrCreateUser(inputUsername.trim(), inputGrade);
            if (response.profile) {
                login(response.profile, response.inventory);
            } else {
                // GAS 未連線時的 fallback（Mock 模式）
                login(
                    { id: 'local_' + Date.now(), username: inputUsername.trim(), grade: inputGrade, coins: 0, score: 0, currentSkinSeed: 'pony1' },
                    { ownedSkins: ['default_1'] }
                );
            }
            setCurrentView('home');
        } catch {
            // fallback: 允許離線遊玩
            login(
                { id: 'local_' + Date.now(), username: inputUsername.trim(), grade: inputGrade, coins: 0, score: 0, currentSkinSeed: 'pony1' },
                { ownedSkins: ['default_1'] }
            );
            setCurrentView('home');
        } finally {
            setIsLoginLoading(false);
        }
    };

    const handleStartGame = async () => {
        setIsLoading(true);
        try {
            const response = await gasService.getQuestions(selectedSubject, selectedGrade);
            if (response.questions && response.questions.length > 0) {
                // 將 GAS 回傳的 [{text, isCorrect}] 格式轉換成 QuizCard 需要的 {A,B,C,D} + answer 格式
                const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;
                const transformed = (response.questions as unknown as { id: unknown; text: string; options: { text: string; isCorrect: boolean }[] }[]).map((q, idx) => {
                    const opts: Record<string, string> = {};
                    let answer = 'A';
                    q.options.forEach((opt, i) => {
                        const key = OPTION_KEYS[i];
                        opts[key] = opt.text;
                        if (opt.isCorrect) answer = key;
                    });
                    return { id: idx + 1, text: q.text, options: opts, answer, subject: selectedSubject, grade: selectedGrade };
                });
                setQuestions(transformed as unknown as Question[]);
                startGame(selectedSubject, selectedGrade);
                setCurrentQuestionIndex(0);
                setCurrentView('game');
            } else {
                showModal({ emoji: '📚', title: '題庫空空的', message: '這個年級跟科目目前還沒有題庫喔！請更換後再試試看！', type: 'info' });
            }
        } catch (error) {
            console.error('Failed to start game:', error);
            showModal({ emoji: '🌩️', title: '哎呀！', message: '無法載入題庫，請檢查網路連線或稍後再試。', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleNextQuestion = async () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // 關卡結束 - 分數轉換為金幣 (1分 = 1枚金幣)
            const earnedCoins = gameState.score;
            const newTotal = (userProfile?.coins ?? 0) + earnedCoins;

            // 更新本地 Zustand 狀態
            updateCoins(earnedCoins);

            // 同步到 GAS (背景執行，不強制等待)
            if (userProfile?.id) {
                gasService.updateCoins(userProfile.id, newTotal).catch(err =>
                    console.warn('[GAS] Failed to sync coins:', err)
                );
            }

            showModal({
                emoji: '🎉',
                title: '恭喜完成！',
                message: `獲得 ${gameState.score} 分 → +${earnedCoins} 枚金幣！\n目前總金幣：${newTotal} 枚`,
                type: 'success',
            });
            setCurrentView('home');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-100 to-indigo-200">
            {/* 登入畫面 */}
            {currentView === 'login' && (
                <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
                    <h1 className="text-5xl font-extrabold text-white drop-shadow-[0_4px_4px_rgba(236,72,153,0.8)] text-center">
                        🦄 彩虹小馬樂園
                    </h1>
                    <div className="bg-white/70 backdrop-blur p-8 rounded-3xl shadow-xl border-4 border-white w-full max-w-sm flex flex-col gap-5">
                        <h2 className="text-2xl font-black text-center text-pink-500">歡迎登入！</h2>
                        <div className="flex flex-col gap-2">
                            <label className="font-bold text-pink-600">你的名字</label>
                            <input
                                type="text"
                                value={inputUsername}
                                onChange={e => setInputUsername(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                placeholder="例如：小花、阿明..."
                                className="px-4 py-3 rounded-xl border-2 border-pink-300 focus:outline-none focus:border-pink-500 font-bold text-gray-700 bg-white text-lg"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-bold text-violet-600">你的年級</label>
                            <select
                                value={inputGrade}
                                onChange={e => setInputGrade(Number(e.target.value))}
                                className="px-4 py-3 rounded-xl border-2 border-violet-300 focus:outline-none focus:border-violet-500 font-bold text-gray-700 bg-white text-lg"
                            >
                                {[1, 2, 3, 4, 5, 6].map(g => (
                                    <option key={g} value={g}>{g} 年級</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleLogin}
                            disabled={isLoginLoading}
                            className={`py-4 font-black text-white text-xl rounded-full shadow-lg transition-all ${isLoginLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-105 active:scale-95 shadow-[0_6px_0_rgb(192,38,211)]'}`}
                        >
                            {isLoginLoading ? '登入中 🌟...' : '✨ 進入樂園！'}
                        </button>
                    </div>
                </div>
            )}

            {/* 主遊戲介面 (Home / Store / Game) */}
            {currentView !== 'login' && (
                <>
                    {/* 導航列 */}
                    <nav className="p-4 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm border-b-2 border-pink-100">
                        <div
                            className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 cursor-pointer drop-shadow-sm"
                            onClick={() => setCurrentView('home')}
                        >
                            🦄 彩虹小馬樂園
                        </div>
                        <div className="flex gap-4">
                            {userProfile && (
                                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border-2 border-pink-100">
                                    <img
                                        src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${userProfile.currentSkinSeed}`}
                                        alt="玩家"
                                        className="w-8 h-8 rounded-full bg-pink-50"
                                    />
                                    <span className="font-bold text-gray-700">{userProfile.username} | 💰 {userProfile.coins}</span>
                                </div>
                            )}
                            <button
                                onClick={() => setCurrentView('store')}
                                className="bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-bold px-6 py-2 rounded-full transition-transform hover:scale-105 active:scale-95 shadow-md border-2 border-yellow-500"
                            >
                                🏪 造型商店
                            </button>
                        </div>
                    </nav>

                    {/* 主要內容區 */}
                    <main className="container mx-auto py-8 px-4">
                        {currentView === 'home' && (
                            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-fade-in-up">
                                <h1 className="text-5xl font-extrabold text-white drop-shadow-[0_4px_4px_rgba(236,72,153,0.8)] text-center">
                                    歡迎來到彩虹小馬問答挑戰！
                                </h1>

                                <div className="flex gap-4 bg-white/60 p-6 rounded-3xl shadow-md border-4 border-white backdrop-blur">
                                    <div className="flex flex-col">
                                        <label className="font-bold text-pink-600 mb-2">選擇科目</label>
                                        <select
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            className="px-4 py-2 rounded-xl border-2 border-pink-300 focus:outline-none focus:border-pink-500 font-bold text-gray-700 bg-white"
                                        >
                                            <option value="數學">數學</option>
                                            <option value="國語">國語</option>
                                            <option value="英文">英文</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="font-bold text-violet-600 mb-2">選擇年級</label>
                                        <select
                                            value={selectedGrade}
                                            onChange={(e) => setSelectedGrade(Number(e.target.value))}
                                            className="px-4 py-2 rounded-xl border-2 border-violet-300 focus:outline-none focus:border-violet-500 font-bold text-gray-700 bg-white"
                                        >
                                            {[1, 2, 3, 4, 5, 6].map(grade => (
                                                <option key={grade} value={grade}>{grade} 年級</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleStartGame}
                                    disabled={isLoading}
                                    className={`px-12 py-6 text-white text-3xl font-black rounded-full transition-all ${isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-[0_8px_0_rgb(192,38,211)] hover:translate-y-1 hover:shadow-[0_4px_0_rgb(192,38,211)] active:translate-y-2 active:shadow-none'}`}
                                >
                                    {isLoading ? '題庫載入中 🦄...' : '🚀 開始冒險 🚀'}
                                </button>
                            </div>
                        )}

                        {currentView === 'store' && <Store onClose={() => setCurrentView('home')} />}

                        {currentView === 'game' && (
                            <div className="flex flex-col items-center">
                                {/* 遊戲狀態列 */}
                                <div className="flex justify-between w-full max-w-2xl mb-8 bg-white/70 p-4 rounded-3xl shadow-sm border-4 border-white">
                                    <div className="text-2xl font-bold text-pink-500 flex items-center">
                                        {'❤️'.repeat(gameState.currentHearts)}
                                        {'🤍'.repeat(3 - gameState.currentHearts)}
                                    </div>
                                    <div className="text-2xl font-bold text-violet-600 bg-violet-100 px-6 py-1 rounded-full">
                                        分數: {gameState.score}
                                    </div>
                                </div>

                                {/* 問答卡片 */}
                                {questions[currentQuestionIndex] && (
                                    <QuizCard
                                        question={questions[currentQuestionIndex]}
                                        onNext={handleNextQuestion}
                                    />
                                )}
                            </div>
                        )}
                    </main>
                </>
            )}
            {/* 全域 Modal */}
            <GameModal
                visible={!!modal}
                {...(modal || { emoji: '', title: '', message: '' })}
                onClose={closeModal}
            />
        </div>
    );
}

export default App;
