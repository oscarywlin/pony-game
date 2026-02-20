import fs from 'fs';

// 新增 UTF-8 BOM (\uFEFF) 讓 Excel 能夠正確識別正體中文編碼
const CSV_HEADER = '\uFEFF科目,年級,題號,題目,A,B,C,D,解答\n';
const subjects = ['國語', '英文', '數學'];
const grades = [1, 2, 3, 4, 5, 6];
const questionsPerGrade = 10;

// 小馬名字集合
const ponies = ['紫悅(Twilight Sparkle)', '蘋果嘉兒(Applejack)', '雲寶(Rainbow Dash)', '珍奇(Rarity)', '柔柔(Fluttershy)', '碧琪(Pinkie Pie)'];
// === English Unique Topics ===
const EN_VOCAB = {
    1: [
        { w: 'Apple', t: '蘋果', w1: 'Banana', w2: 'Pear', w3: 'Grape' }, { w: 'Cat', t: '貓咪', w1: 'Dog', w2: 'Bird', w3: 'Fish' }, { w: 'Red', t: '紅色', w1: 'Blue', w2: 'Green', w3: 'Yellow' }, { w: 'Sun', t: '太陽', w1: 'Moon', w2: 'Star', w3: 'Cloud' }, { w: 'Book', t: '書本', w1: 'Pen', w2: 'Bag', w3: 'Eraser' },
        { w: 'Boy', t: '男孩', w1: 'Girl', w2: 'Man', w3: 'Woman' }, { w: 'Eye', t: '眼睛', w1: 'Ear', w2: 'Nose', w3: 'Mouth' }, { w: 'Car', t: '車子', w1: 'Bus', w2: 'Train', w3: 'Boat' }, { w: 'One', t: '數字1', w1: 'Two', w2: 'Three', w3: 'Four' }, { w: 'Tree', t: '樹', w1: 'Flower', w2: 'Grass', w3: 'Leaf' }
    ],
    2: [
        { w: 'Happy', t: '開心', w1: 'Sad', w2: 'Angry', w3: 'Tired' }, { w: 'Big', t: '大', w1: 'Small', w2: 'Tall', w3: 'Short' }, { w: 'Run', t: '跑', w1: 'Walk', w2: 'Jump', w3: 'Swim' }, { w: 'Sing', t: '唱歌', w1: 'Dance', w2: 'Read', w3: 'Draw' }, { w: 'Water', t: '水', w1: 'Milk', w2: 'Juice', w3: 'Tea' },
        { w: 'House', t: '房子', w1: 'School', w2: 'Park', w3: 'Store' }, { w: 'Mother', t: '媽媽', w1: 'Father', w2: 'Brother', w3: 'Sister' }, { w: 'Head', t: '頭', w1: 'Hand', w2: 'Foot', w3: 'Leg' }, { w: 'Black', t: '黑色', w1: 'White', w2: 'Gray', w3: 'Brown' }, { w: 'Desk', t: '書桌', w1: 'Chair', w2: 'Bed', w3: 'Sofa' }
    ],
    3: [
        { q: '"Good morning!" 你該回答？', a: 'Good morning!', w1: 'Good night.', w2: 'Goodbye.', w3: 'Hello.' }, { q: '"Thank you!" 你該回答？', a: 'You are welcome.', w1: 'Sorry.', w2: 'Please.', w3: 'No, thanks.' }, { q: '"How old are you?" 你該回答？', a: 'I am eight.', w1: 'I am a boy.', w2: 'I am fine.', w3: 'I am from Taiwan.' }, { q: '"What is your name?" 你該回答？', a: 'My name is Tom.', w1: 'I am ten.', w2: 'Nice to meet you.', w3: 'Good morning.' }, { q: '"Where are you from?" 你該回答？', a: "I'm from Taiwan.", w1: 'I go to school.', w2: 'I like Taiwan.', w3: 'Yes, I do.' },
        { q: '"Do you like apples?" 你該回答？', a: 'Yes, I do.', w1: 'Yes, I am.', w2: 'No, I don\'t like bananas.', w3: 'I have an apple.' }, { q: '"What color is it?" 你該回答？', a: 'It is red.', w1: 'It is a dog.', w2: 'I like red.', w3: 'It is big.' }, { q: '"Is this your book?" 你該回答？', a: 'Yes, it is.', w1: 'Yes, I am.', w2: 'No, I am not.', w3: 'It is a pen.' }, { q: '"How are you?" 你該回答？', a: 'I am fine, thank you.', w1: 'I am ten.', w2: 'I am a student.', w3: 'Nice to meet you.' }, { q: '"Nice to meet you." 你該回答？', a: 'Nice to meet you, too.', w1: 'Good morning.', w2: 'Thank you.', w3: 'Goodbye.' }
    ],
    4: [
        { q: 'Let\'s ___ to the park.', a: 'go', w1: 'goes', w2: 'going', w3: 'went' }, { q: 'She ___ a book now.', a: 'is reading', w1: 'read', w2: 'reads', w3: 'reading' }, { q: '___ you like dogs?', a: 'Do', w1: 'Does', w2: 'Are', w3: 'Is' }, { q: 'He ___ play baseball.', a: 'doesn\'t', w1: 'don\'t', w2: 'isn\'t', w3: 'aren\'t' }, { q: 'There ___ a cat on the table.', a: 'is', w1: 'are', w2: 'am', w3: 'be' },
        { q: '___ are they doing?', a: 'What', w1: 'Where', w2: 'Who', w3: 'How' }, { q: 'The bird is flying ___ the sky.', a: 'in', w1: 'on', w2: 'at', w3: 'under' }, { q: 'I ___ an apple every day.', a: 'eat', w1: 'eats', w2: 'eating', w3: 'ate' }, { q: 'Look ___ the beautiful rainbow!', a: 'at', w1: 'in', w2: 'on', w3: 'to' }, { q: '___ pen is this?', a: 'Whose', w1: 'Who', w2: 'What', w3: 'Where' }
    ],
    5: [
        { q: 'Yesterday, we ___ a great time.', a: 'had', w1: 'have', w2: 'has', w3: 'having' }, { q: '___ he go to school yesterday?', a: 'Did', w1: 'Do', w2: 'Does', w3: 'Is' }, { q: 'I was sleeping ___ you called me.', a: 'when', w1: 'while', w2: 'where', w3: 'who' }, { q: 'She is ___ than her sister.', a: 'taller', w1: 'tall', w2: 'tallest', w3: 'the tallest' }, { q: 'He is the ___ boy in the class.', a: 'tallest', w1: 'tall', w2: 'taller', w3: 'more tall' },
        { q: '___ ever been to Japan?', a: 'Have you', w1: 'Did you', w2: 'Were you', w3: 'Are you' }, { q: 'I don\'t know ___ she lives.', a: 'where', w1: 'what', w2: 'when', w3: 'who' }, { q: 'They ___ playing basketball at 5 PM yesterday.', a: 'were', w1: 'are', w2: 'was', w3: 'will be' }, { q: 'If it rains tomorrow, we ___ stay home.', a: 'will', w1: 'would', w2: 'can', w3: 'could' }, { q: 'This is the book ___ I bought yesterday.', a: 'which', w1: 'who', w2: 'what', w3: 'whose' }
    ],
    6: [
        { q: 'By the time we arrived, the train ___ left.', a: 'had', w1: 'has', w2: 'have', w3: 'was' }, { q: 'She ___ TV for two hours.', a: 'has been watching', w1: 'watches', w2: 'is watching', w3: 'watched' }, { q: 'The house ___ built in 1990.', a: 'was', w1: 'is', w2: 'has', w3: 'were' }, { q: 'He said that he ___ come to the party.', a: 'would', w1: 'will', w2: 'can', w3: 'may' }, { q: 'I wish I ___ fly.', a: 'could', w1: 'can', w2: 'will', w3: 'am able to' },
        { q: '___ of the students passed the exam.', a: 'Most', w1: 'Almost', w2: 'The most', w3: 'Mostly' }, { q: 'You must finish the work ___ Friday.', a: 'by', w1: 'until', w2: 'in', w3: 'on' }, { q: 'It is important that everyone ___ on time.', a: 'be', w1: 'is', w2: 'are', w3: 'will be' }, { q: 'Hardly had I arrived when the phone ___.', a: 'rang', w1: 'rings', w2: 'ring', w3: 'ringing' }, { q: 'He acts as if he ___ the boss.', a: 'were', w1: 'is', w2: 'was', w3: 'be' }
    ]
};

// === Chinese Unique Topics ===
const ZH_VOCAB = {
    1: [
        { q: '請找出錯字：「今天天氣真豪」', a: '豪(好)', w1: '真', w2: '天', w3: '氣' }, { q: '請找出錯字：「我想去公園丸」', a: '丸(玩)', w1: '想', w2: '公', w3: '園' }, { q: '請找出錯字：「我的小苟很可愛」', a: '苟(狗)', w1: '可', w2: '愛', w3: '很' }, { q: '請找出錯字：「他是一位好老師」', a: '沒有錯字', w1: '他', w2: '是', w3: '師' }, { q: '請找出錯字：「妹妹喜歡吃平果」', a: '平(蘋)', w1: '妹', w2: '喜', w3: '歡' },
        { q: '「木」加上「口」是什麼字？', a: '杏', w1: '林', w2: '休', w3: '呆' }, { q: '「日」加上「月」是什麼字？', a: '明', w1: '星', w2: '早', w3: '旦' }, { q: '請找出錯字：「哥哥在看書本」', a: '沒有錯字', w1: '哥', w2: '看', w3: '本' }, { q: '請找出錯字：「天空的雲很白」', a: '沒有錯字', w1: '天', w2: '空', w3: '白' }, { q: '請找出錯字：「我愛我的家挺」', a: '挺(庭)', w1: '家', w2: '我', w3: '愛' }
    ],
    2: [
        { q: '量詞測驗：一(  )筆。', a: '枝', w1: '把', w2: '張', w3: '本' }, { q: '量詞測驗：一(  )牛。', a: '頭', w1: '匹', w2: '隻', w3: '張' }, { q: '量詞測驗：一(  )狗。', a: '隻', w1: '頭', w2: '匹', w3: '張' }, { q: '量詞測驗：一(  )紙。', a: '張', w1: '本', w2: '枝', w3: '把' }, { q: '量詞測驗：一(  )樹。', a: '棵', w1: '顆', w2: '枝', w3: '把' },
        { q: '反義詞：大的相反是？', a: '小', w1: '中', w2: '多', w3: '少' }, { q: '反義詞：高的相反是？', a: '低/矮', w1: '胖', w2: '瘦', w3: '長' }, { q: '反義詞：長的相反是？', a: '短', w1: '高', w2: '低', w3: '寬' }, { q: '反義詞：多的相反是？', a: '少', w1: '大', w2: '小', w3: '無' }, { q: '反義詞：美的相反是？', a: '醜', w1: '好', w2: '壞', w3: '惡' }
    ],
    3: [
        { q: '「人山人海」是形容？', a: '人非常多', w1: '山很高', w2: '海很大', w3: '風景很美' }, { q: '「七上八下」是形容？', a: '心情不安', w1: '數字很大', w2: '樓層很高', w3: '動作很快' }, { q: '「五顏六色」是形容？', a: '色彩繽紛', w1: '顏色很少', w2: '數字很多', w3: '形狀很怪' }, { q: '「一石二鳥」是形容？', a: '做一件事達到兩個目的', w1: '用石頭打鳥', w2: '鳥很多', w3: '石頭很多' }, { q: '「半途而廢」是形容？', a: '中途放棄', w1: '做完事情', w2: '走到一半', w3: '道路損壞' },
        { q: '選出正確的字音：「銀行」的「行」', a: 'ㄏㄤˊ', w1: 'ㄒㄧㄥˊ', w2: 'ㄏㄤˋ', w3: 'ㄒㄧㄥˋ' }, { q: '選出正確的字音：「快樂」的「樂」', a: 'ㄌㄜˋ', w1: 'ㄩㄝˋ', w2: 'ㄌㄠˋ', w3: 'ㄧㄠˋ' }, { q: '選出正確的字音：「音樂」的「樂」', a: 'ㄩㄝˋ', w1: 'ㄌㄜˋ', w2: 'ㄌㄠˋ', w3: 'ㄧㄠˋ' }, { q: '選出正確的字音：「睡覺」的「覺」', a: 'ㄐㄧㄠˋ', w1: 'ㄐㄩㄝˊ', w2: 'ㄐㄧㄠˇ', w3: 'ㄐㄩㄝˇ' }, { q: '選出正確的字音：「覺得」的「覺」', a: 'ㄐㄩㄝˊ', w1: 'ㄐㄧㄠˋ', w2: 'ㄐㄧㄠˇ', w3: 'ㄐㄩㄝˇ' }
    ],
    4: [
        { q: '這句話哪裡有語病？「他今天很高興地開心地笑了。」', a: '語意重複', w1: '詞不達意', w2: '主語缺失', w3: '沒有語病' }, { q: '這句話哪裡有語病？「我把功課寫完了，所以老師誇獎我。」', a: '沒有語病', w1: '因果顛倒', w2: '語意重複', w3: '主語缺失' }, { q: '這句話是哪一種修辭？「星星在天上對我眨眼睛。」', a: '擬人', w1: '譬喻', w2: '誇飾', w3: '排比' }, { q: '這句話是哪一種修辭？「他的脾氣像牛一樣倔強。」', a: '譬喻', w1: '擬人', w2: '誇飾', w3: '排比' }, { q: '這句話是哪一種修辭？「教室裡安靜得連一根針掉在地上的聲音都聽得見。」', a: '誇飾', w1: '擬人', w2: '譬喻', w3: '排比' },
        { q: '「畫蛇添足」的故事告訴我們什麼道理？', a: '多此一舉', w1: '畫畫要認真', w2: '蛇有腳', w3: '不能添油加醋' }, { q: '「守株待兔」的故事告訴我們什麼道理？', a: '不可不勞而獲', w1: '兔子會自己撞樹', w2: '種樹很重要', w3: '要愛護小動物' }, { q: '「掩耳盜鈴」的故事告訴我們什麼道理？', a: '自欺欺人', w1: '鈴鐺很吵', w2: '耳朵聽不見', w3: '偷東西不好' }, { q: '「亡羊補牢」的故事告訴我們什麼道理？', a: '及時補救', w1: '羊會逃跑', w2: '籬笆很堅固', w3: '要多養羊' }, { q: '「井底之蛙」的故事告訴我們什麼道理？', a: '見識淺薄', w1: '青蛙住在井裡', w2: '天空很小', w3: '井水很冷' }
    ],
    5: [
        { q: '「白日依山盡，黃河入海流」的作者是？', a: '王之渙', w1: '李白', w2: '杜甫', w3: '孟浩然' }, { q: '「床前明月光，疑是地上霜」的作者是？', a: '李白', w1: '王之渙', w2: '杜甫', w3: '白居易' }, { q: '「春眠不覺曉，處處聞啼鳥」的作者是？', a: '孟浩然', w1: '李白', w2: '王維', w3: '杜甫' }, { q: '「少小離家老大回，鄉音無改鬢毛衰」的作者是？', a: '賀知章', w1: '李白', w2: '白居易', w3: '杜甫' }, { q: '「誰言寸草心，報得三春暉」的作者是？', a: '孟郊', w1: '李白', w2: '杜甫', w3: '王維' },
        { q: '下列哪個成語的意思與「破釜沉舟」相近？', a: '背水一戰', w1: '知難而退', w2: '半途而廢', w3: '順其自然' }, { q: '下列哪個成語的意思與「朝三暮四」相近？', a: '反覆無常', w1: '從一而終', w2: '專心一志', w3: '堅忍不拔' }, { q: '下列哪個成語的意思與「杞人憂天」相近？', a: '庸人自擾', w1: '高瞻遠矚', w2: '未雨綢繆', w3: '心安理得' }, { q: '下列哪個成語的意思與「望梅止渴」相近？', a: '畫餅充飢', w1: '實事求是', w2: '眼見為憑', w3: '心想事成' }, { q: '下列哪個成語的意思與「刻舟求劍」相近？', a: '食古不化', w1: '與時俱進', w2: '隨機應變', w3: '見風轉舵' }
    ],
    6: [
        { q: '「孔子」是古代哪一個學派的創始人？', a: '儒家', w1: '道家', w2: '墨家', w3: '法家' }, { q: '「老子」是古代哪一個學派的創始人？', a: '道家', w1: '儒家', w2: '墨家', w3: '法家' }, { q: '被稱為「詩仙」的唐代詩人是誰？', a: '李白', w1: '杜甫', w2: '白居易', w3: '蘇軾' }, { q: '被稱為「詩聖」的唐代詩人是誰？', a: '杜甫', w1: '李白', w2: '王維', w3: '白居易' }, { q: '《三國演義》的作者是誰？', a: '羅貫中', w1: '施耐庵', w2: '吳承恩', w3: '曹雪芹' },
        { q: '下列哪一個是不符合邏輯的句子？', a: '因為天下雨，所以我出去了。', w1: '因為天下雨，所以我沒出去。', w2: '雖然天下雨，我還是出去了。', w3: '如果天下雨，我就不出去。' }, { q: '下列哪一個是遞進複句？', a: '他不但聰明，而且很用功。', w1: '因為他聰明，所以很用功。', w2: '雖然他聰明，但是不用功。', w3: '他不是聰明，就是用功。' }, { q: '下列哪一個是假設複句？', a: '如果明天下雨，我們就不去郊遊。', w1: '因為明天下雨，我們不去郊遊。', w2: '即使明天下雨，我們也要去郊遊。', w3: '明天下雨，我們要去郊遊。' }, { q: '下列哪個標點符號使用正確？', a: '他說：「你好嗎？」', w1: '他說(你好嗎)', w2: '他說、你好嗎？', w3: '他說；你好嗎。' }, { q: '「飛流直下三千尺，疑是銀河落九天」描寫的是哪個名勝？', a: '廬山瀑布', w1: '黃河', w2: '長江', w3: '太湖' }
    ]
};

function generateEnglishQuestion(grade, qNum) {
    const list = EN_VOCAB[grade];
    // Guarantee uniqueness by using qNum directly since we have exactly 10 items
    const data = list[(qNum - 1) % list.length];

    let a, b, c, d, ans;
    // 隨機排列選項，保證不重複
    // Fix: specifically support the object structure of grade 1-2 where we have {w, w1, w2, w3, wp}
    const correctAns = data.a || data.wp || data.w; // data.a is for grade 3+, data.wp/w for grade 1-2
    const opt1 = data.w1 || data.w || 'Option B';   // fallback structure
    const opt2 = data.w2 || 'Option C';
    const opt3 = data.w3 || 'Option D';

    const options = [
        { text: correctAns, isCorrect: true },
        { text: opt1, isCorrect: false },
        { text: opt2, isCorrect: false },
        { text: opt3, isCorrect: false }
    ].sort(() => Math.random() - 0.5);

    a = options[0].text; b = options[1].text; c = options[2].text; d = options[3].text;
    ans = options.findIndex(o => o.isCorrect) === 0 ? 'A' : options.findIndex(o => o.isCorrect) === 1 ? 'B' : options.findIndex(o => o.isCorrect) === 2 ? 'C' : 'D';

    let q = data.q || `請問「${data.t}」的英文是什麼？`;
    return [q, a, b, c, d, ans];
}

function generateChineseQuestion(grade, qNum) {
    const list = ZH_VOCAB[grade];
    const data = list[(qNum - 1) % list.length];

    let a, b, c, d, ans;
    const options = [
        { text: data.a, isCorrect: true },
        { text: data.w1, isCorrect: false },
        { text: data.w2, isCorrect: false },
        { text: data.w3, isCorrect: false }
    ].sort(() => Math.random() - 0.5);

    a = options[0].text; b = options[1].text; c = options[2].text; d = options[3].text;
    ans = options.findIndex(o => o.isCorrect) === 0 ? 'A' : options.findIndex(o => o.isCorrect) === 1 ? 'B' : options.findIndex(o => o.isCorrect) === 2 ? 'C' : 'D';

    let q = data.q;
    return [q, a, b, c, d, ans];
}

function generateMathQuestion(grade, qNum) {
    // 數學題使用數學公式隨機生成，透過獨特的隨機基底搭配 qNum 保證 10 題唯一性
    let q = '', a = '', b = '', c = '', d = '', ans = '';
    const base1 = (qNum * 13) % 40 + grade * 5 + qNum;
    const base2 = (qNum * 7) % 20 + grade * 2 + qNum;

    // Use mod 4 purely off qNum to guarantee variant distribution
    const opIdx = (qNum - 1) % 4;

    if (grade <= 2) {
        if (opIdx % 2 === 0) {
            q = `皮皮有${base1}顆糖果，又買了${base2}顆，總共有幾顆？`;
            let res = base1 + base2;
            a = `${res}`; b = `${res + 1}`; c = `${res - 1}`; d = `${res + 2}`;
            ans = 'A';
        } else {
            let v1 = Math.max(base1, base2) + 10;
            let v2 = Math.min(base1, base2);
            q = `多多有${v1}顆蘋果，吃掉了${v2}顆，還剩下幾顆？`;
            let res = v1 - v2;
            a = `${res + 2}`; b = `${res}`; c = `${res - 1}`; d = `${res + 1}`;
            ans = 'B';
        }
    } else if (grade <= 4) {
        if (opIdx % 2 === 0) {
            let v1 = (base1 % 10) + 2;
            let v2 = (base2 % 10) + 2;
            q = `老師準備了${v1}盒鉛筆，每盒有${v2}枝，總共有幾枝？`;
            let res = v1 * v2;
            a = `${res - 1}`; b = `${res + 2}`; c = `${res}`; d = `${res + 1}`;
            ans = 'C';
        } else {
            let v2 = (base2 % 8) + 2;
            let total = ((base1 % 5) + 3) * v2;
            q = `有${total}個布丁，平分給${v2}個人，每個人可以拿到幾個？`;
            let res = total / v2;
            a = `${res + 1}`; b = `${res - 1}`; c = `${res + 2}`; d = `${res}`;
            ans = 'D';
        }
    } else {
        if (qNum % 2 === 0) {
            let speed = (base1 % 30) + 15;
            let time = (base2 % 10) + 2;
            q = `老鷹的飛行速度是每秒${speed}公尺，飛了${time}秒後，總共飛了多遠？`;
            let res = speed * time;
            a = `${res}公尺`; b = `${res + 10}公尺`; c = `${res - 10}公尺`; d = `${res * 2}公尺`;
            ans = 'A';
        } else {
            let len = (base1 % 50) + 20;
            let cut = (base2 % 15) + 5;
            q = `一條長${len}公尺的繩子，剪去${cut}公尺後，剩下的長度是多少？`;
            let res = len - cut;
            a = `${res - 5}公尺`; b = `${res}公尺`; c = `${res + 5}公尺`; d = `${res * 2}公尺`;
            ans = 'B';
        }
    }

    // 隨機置換正確答案位置 (確保選項順序也是多樣的)
    const options = [
        { text: a, isCorrect: ans === 'A' },
        { text: b, isCorrect: ans === 'B' },
        { text: c, isCorrect: ans === 'C' },
        { text: d, isCorrect: ans === 'D' }
    ].sort(() => Math.random() - 0.5);

    return [
        q,
        options[0].text, options[1].text, options[2].text, options[3].text,
        options.findIndex(o => o.isCorrect) === 0 ? 'A' : options.findIndex(o => o.isCorrect) === 1 ? 'B' : options.findIndex(o => o.isCorrect) === 2 ? 'C' : 'D'
    ];
}

let csvContent = CSV_HEADER;

for (let s of subjects) {
    for (let g of grades) {
        for (let i = 1; i <= questionsPerGrade; i++) {
            let qData;
            if (s === '數學') qData = generateMathQuestion(g, i);
            else if (s === '英文') qData = generateEnglishQuestion(g, i);
            else qData = generateChineseQuestion(g, i);

            // Escape commas and quotes for CSV format
            const escapedQData = qData.map(item => {
                let cell = (item || '').toString();
                if (cell.includes(',') || cell.includes('"') || cell.includes('\\n')) {
                    cell = '"' + cell.replace(/"/g, '""') + '"';
                }
                return cell;
            });

            csvContent += `${s},${g},${i},${escapedQData.join(',')}\n`;
        }
    }
}

fs.writeFileSync('questions.csv', csvContent, 'utf-8');
console.log('成功生成 180 題題庫：questions.csv');
