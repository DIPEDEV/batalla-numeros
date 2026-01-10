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

// Generador de preguntas aleatorias con Rango
export const generateRound = (rangeStr = "0-69") => {
    const [min, max] = rangeStr.split('-').map(Number);
    
    // Filter available numbers based on range
    const available = FRENCH_NUMBERS_FULL.filter(n => n.val >= min && n.val <= max);
    if (available.length < 4) {
        // Fallback if range is too small (should prevent in UI but safety here)
        return { targetVal: 0, targetText: "Error Range", options: [0,0,0,0] };
    }

    const target = available[Math.floor(Math.random() * available.length)];
    let options = [target];
    
    while (options.length < 4) {
        const random = available[Math.floor(Math.random() * available.length)];
        if (!options.find(o => o.val === random.val)) {
            options.push(random);
        }
    }
    
    // Mezclar opciones
    options = options.sort(() => Math.random() - 0.5);
    return {
        targetVal: target.val,
        targetText: target.text,
        options: options.map(o => o.val)
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

