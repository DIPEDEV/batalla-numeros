// --- GENERADOR DE NÚMEROS (0 - 100) ---
export const generateFrenchNumberName = (n) => {
    const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
    const tens = {
        10: "dix", 20: "vingt", 30: "trente", 40: "quarante", 50: "cinquante", 
        60: "soixante", 70: "soixante-dix", 80: "quatre-vingts", 90: "quatre-vingt-dix"
    };
    const special = {
        0: "Zéro", 10: "dix", 11: "Onze", 12: "Douze", 13: "Treize", 14: "Quatorze", 15: "Quinze", 16: "Seize"
    };

    if (n === 0) return "Zéro";
    if (n <= 16) return special[n] || units[n];
    
    // 17-19
    if (n < 20) return `dix-${units[n-10]}`;

    // 70s
    if (n >= 70 && n < 80) {
        const sub = n - 60; // 10-19
        if (n === 71) return "soixante et onze";
        
        let subText = "";
        if (sub <= 16) subText = special[sub] || units[sub];
        else subText = `dix-${units[sub-10]}`; // 17-19
        
        return `soixante-${subText}`;
    }

    // 80s
    if (n >= 80 && n < 90) {
        if (n === 80) return "quatre-vingts";
        return `quatre-vingt-${units[n-80]}`;
    }

    // 90s
    if (n >= 90 && n < 100) {
        const sub = n - 80; // 10-19
        let subText = "";
        if (sub <= 16) subText = special[sub] || units[sub];
        else subText = `dix-${units[sub-10]}`;
        
        return `quatre-vingt-${subText}`;
    }

    // 100
    if (n === 100) return "Cent";
    if (Math.abs(n) > 100) return n.toString(); // Fallback for safety

    // Standard Tens (20-69 exc 70,80,90 handled above)
    const tenVal = Math.floor(n / 10) * 10;
    const unitVal = n % 10;
    
    if (unitVal === 0) return tens[tenVal];
    if (unitVal === 1) return `${tens[tenVal]} et un`;
    return `${tens[tenVal]}-${units[unitVal]}`;
};

export const FRENCH_NUMBERS_FULL = Array.from({ length: 101 }, (_, i) => ({
    val: i,
    text: generateFrenchNumberName(i).charAt(0).toUpperCase() + generateFrenchNumberName(i).slice(1)
}));

// Helper to get random item
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getText = (n) => generateFrenchNumberName(n).charAt(0).toUpperCase() + generateFrenchNumberName(n).slice(1);

const generateReverseExpression = (targetVal) => {
    const isSum = Math.random() > 0.5;
    let a, b;
    if (isSum) {
        a = Math.floor(Math.random() * (targetVal + 1));
        b = targetVal - a;
        return `${getText(a)} + ${getText(b)}`;
    } else {
        // Target = a - b. a = target + b.
        // b can be anything, but let's keep a <= 100.
        // so b <= 100 - target.
        const maxB = 100 - targetVal;
        if (maxB < 0) return `${getText(targetVal)} + Zéro`; // fallback for targetVal > 100, though we cap at 100
        b = Math.floor(Math.random() * (maxB + 1));
        a = targetVal + b;
        return `${getText(a)} - ${getText(b)}`;
    }
};

// Generador de preguntas aleatorias con Rango
export const generateRound = (difficulty = "0-69") => {
    // Determine bounds and mode
    let min = 0, max = 69, mode = "normal"; // normal, mixed, sum, sub, reverse-math

    if (difficulty === "0-10") { max = 10; }
    else if (difficulty === "0-100") { max = 100; }
    else if (difficulty === "0-50-mixed") { max = 50; mode = "mixed"; }
    else if (difficulty === "0-100-mixed") { max = 100; mode = "mixed"; }
    else if (difficulty === "0-100-sum") { max = 100; mode = "sum"; }
    else if (difficulty === "0-100-sub") { max = 100; mode = "sub"; }
    else if (difficulty === "0-100-math-mixed") { 
        max = 100; 
        mode = Math.random() > 0.5 ? "sum" : "sub"; 
    }
    else if (difficulty === "crazy-mode") {
        max = 100;
        const roll = Math.random();
        if (roll < 0.3) {
             mode = "mixed";
        } else if (roll < 0.6) {
             mode = Math.random() > 0.5 ? "sum" : "sub";
        } else {
             mode = "reverse-math";
        }
    }
    // Fallback for old configs or default
    else if (difficulty.includes("-")) {
         const parts = difficulty.split('-');
         if (parts.length === 2 && !isNaN(parts[1])) {
             min = Number(parts[0]);
             max = Number(parts[1]);
         }
    }

    // Filter available numbers based on range (for options pool)
    const available = FRENCH_NUMBERS_FULL.filter(n => n.val >= min && n.val <= max);
    
    // --- MODE LOGIC ---

    // 1. MATH MODES (Sum / Sub)
    if (mode === "sum" || mode === "sub") {
        let a, b, answer;
        let trials = 0;
        
        do {
            trials++;
            // Generate two numbers
            a = Math.floor(Math.random() * (max + 1)); 
            b = Math.floor(Math.random() * (max + 1));
            
            if (mode === "sum") {
                answer = a + b;
            } else {
                // Ensure positive result for subtraction
                if (a < b) [a, b] = [b, a];
                answer = a - b;
            }
        } while ((answer > max || answer < min) && trials < 20); // Keep answer within range

        // Target Text: "Word(A) +/- Word(B)"
        const sign = mode === "sum" ? "+" : "-";
        const targetText = `${getText(a)} ${sign} ${getText(b)}`;
        
        // Options are NUMBERS
        // Generate options close to answer
        let options = [answer];
        while (options.length < 4) {
             const offset = Math.floor(Math.random() * 20) - 10; // -10 to +10
             let fake = answer + offset;
             if (fake < 0) fake = 0;
             if (fake > 100) fake = 100; // Cap at 100 for consistency? or max? Let's use max
             if (fake > max + 20) fake = max; // Loose cap
             
             if (!options.includes(fake)) {
                 options.push(fake);
             }
        }
        
        return {
            targetVal: answer,
            targetText: targetText,
            displayMode: 'math',
            operand1: getText(a),
            operand2: getText(b),
            operator: sign,
            options: options.sort(() => Math.random() - 0.5)
        };
    }

    // 2. MIXED MODE (Number -> Word OR Word -> Number)
    if (mode === "mixed") {
        const target = getRandom(available);
        const isWordToNum = Math.random() > 0.5;

        // If Word -> Num (Traditional): Show Word, Options are Numbers
        if (isWordToNum) {
            return generateStandardRound(target, available);
        } else {
            // Num -> Word: Show Number "25", Options are "Vingt-cinq", ...
            // Validating that options are distinct text is important
            let options = [target];
            while (options.length < 4) {
                const random = getRandom(available);
                if (!options.find(o => o.val === random.val)) {
                    options.push(random);
                }
            }
            
            return {
                targetVal: target.text, // The correct answer value for comparison (button value)
                targetText: target.val.toString(), // Display (Big Text)
                options: options.sort(() => Math.random() - 0.5).map(o => o.text)
            };
        }
    }

    // 3. REVERSE MATH MODE (Target = Number, Options = Expressions)
    if (mode === 'reverse-math') {
        const target = getRandom(available);
        const targetVal = target.val; 
        
        // 1 Correct Option
        const correctOpt = generateReverseExpression(targetVal);
        
        // 3 Incorrect Options
        let options = [correctOpt];
        while (options.length < 4) {
             const offset = Math.floor(Math.random() * 20) - 10;
             let fakeVal = targetVal + (offset === 0 ? 5 : offset);
             fakeVal = Math.max(0, Math.min(100, fakeVal));
             
             const fakeExpr = generateReverseExpression(fakeVal);
             if (!options.includes(fakeExpr)) {
                 options.push(fakeExpr);
             }
        }
        
        return {
            targetVal: correctOpt, 
            targetText: targetVal.toString(),
            displayMode: 'reverse-math',
            options: options.sort(() => Math.random() - 0.5)
        };
    }

    // 4. NORMAL MODE (Default)
    const target = getRandom(available);
    return generateStandardRound(target, available);
};

// Helper for standard Word -> Number round
const generateStandardRound = (target, pool) => {
    let options = [target];
    while (options.length < 4) {
        const random = getRandom(pool);
        if (!options.find(o => o.val === random.val)) {
            options.push(random);
        }
    }
    return {
        targetVal: target.val,
        targetText: target.text,
        options: options.sort(() => Math.random() - 0.5).map(o => o.val)
    };
};

export const getCheatSheetRules = () => [
    {
      title: "Unidades (0 - 9)",
      description: "La base de todo.",
      examples: [
        { val: 0, text: "Zéro" }, { val: 1, text: "Un" }, { val: 2, text: "Deux" },
        { val: 3, text: "Trois" }, { val: 4, text: "Quatre" }, { val: 5, text: "Cinq" },
        { val: 6, text: "Six" }, { val: 7, text: "Sept" }, { val: 8, text: "Huit" },
        { val: 9, text: "Neuf" }
      ]
    },
    {
      title: "Decenas (10 - 90)",
      description: "Los pilares.",
      examples: [
        { val: 10, text: "Dix" }, { val: 20, text: "Vingt" }, { val: 30, text: "Trente" },
        { val: 40, text: "Quarante" }, { val: 50, text: "Cinquante" }, { val: 60, text: "Soixante" },
        { val: 70, text: "Soixante-dix" }, { val: 80, text: "Quatre-vingts" }, { val: 90, text: "Quatre-vingt-dix" }
      ]
    },
    {
      title: "Reglas de Combinación",
      description: "Cómo formar el resto.",
      details: "Usa 'et un' para el 1 (21, 31...). Usa guión para el resto (22, 34...).",
      examples: [
        { val: 17, text: "Dix-sept (10+7)" },
        { val: 21, text: "Vingt et un (20+1)" },
        { val: 35, text: "Trente-cinq (30-5)" },
        { val: 75, text: "Soixante-quinze (60+15)" },
        { val: 95, text: "Quatre-vingt-quinze (80+15)" }
      ]
    },
    {
      title: "Centenas (100 - 999)",
      description: "Igual que las decenas.",
      details: "Cent (100). Si multiplicas 100, agrega 's' fin (Deux cents), pero si sigue algo, quita la 's' (Deux cent un).",
      examples: [
        { val: 100, text: "Cent" },
        { val: 101, text: "Cent un" },
        { val: 200, text: "Deux cents" },
        { val: 205, text: "Deux cent cinq" },
        { val: 999, text: "Neuf cent quatre-vingt-dix-neuf" }
      ]
    }
];
