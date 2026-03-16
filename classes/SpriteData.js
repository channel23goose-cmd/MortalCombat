export const SpriteData = {
    // P = Primary Color (Ninja suit color, or main color)
    // S = Skin tone
    // B = Black / Dark cloth
    // A = Accent (e.g. metal arms for Jax, white hat for Raiden)
    // W = White / Eyes

    ninja: { // Base for Scorpion, Sub-Zero, Reptile
        idle: [
            "....BBBB....",
            "...BPPPpB...",
            "...BPSSPB...",
            "...BPPpPB...",
            "....BBBB....",
            ".....PP.....",
            "....BBPB....",
            "...BPPPPB...",
            "...BPPPPB...",
            "...BBBBBB...",
            "....BBBB....",
            "....B..B....",
            "....B..B....",
            "...BB..BB...",
            "...BB..BB..."
        ],
        crouch: [
            "............",
            "............",
            "............",
            "............",
            "....BBBB....",
            "...BPPPpB...",
            "...BPSSPB...",
            "...BPPpPB...",
            "....BBBB....",
            "...BBP...B..",
            "..BPPPP...B.",
            "..BPPPP.BB..",
            "..BBBBBB....",
            "...BBB.BBB.."
        ],
        punch: [
            "....BBBB....",
            "...BPPPpB...",
            "...BPSSPB...",
            "...BPPpPB...",
            "....BBBB....",
            "...BBPB.....",
            "..BPPPPPBBBB",
            "..BPPPPB....",
            "...BBBBB....",
            "....BBBB....",
            "....B..B....",
            "...BB..B....",
            "...BB..BB...",
            ".......BB..."
        ]
    },
    liukang: {
        idle: [
            "....BBBB....",
            "...PPPPPP...", // Red Headband
            "...BSSwSB...",
            "...OSSSSO...", // O=Outfit Accent? Just use S for skin
            "....SSSS....",
            ".....SS.....",
            "....BSSB....",
            "...BSSSSB...",
            "...BSBBBS...", // bare chest
            "...BPBBPB...", // Red pants
            "....BPPB....",
            "....B..B....",
            "....B..B....",
            "...BB..BB...",
            "...BB..BB..."
        ],
        crouch: [
            "............",
            "............",
            "............",
            "....BBBB....",
            "...PPPPPP...",
            "...BSSwSB...",
            "...OSSSSO...",
            "....SSSS....",
            "....SB..SB..",
            "...BPSS..S..",
            "..BPPPPS.SS.",
            "..BPPPP.BB..",
            "..BBBBBB....",
            "...BBB.BBB.."
        ],
        punch: [
            "....BBBB....",
            "...PPPPPP...",
            "...BSSwSB...",
            "...OSSSSO...",
            "....SSSS....",
            "...BSSB.....",
            "..BSSSSSSSSS",
            "..BSSS.S....",
            "...SBBBS....",
            "...BPBBPB...",
            "....BPPB....",
            "....B..B....",
            "...BB..BB...",
            ".......BB..."
        ]
    },
    jax: {
        idle: [
            "....BBBB....",
            "...BSSSSB...",
            "...SSSwSS...",
            "...BSSSSB...",
            "....BBBB....",
            ".....SS.....",
            "....BSSB....",
            "...ASSSSA...", // A = metal arms
            "...ASSSSA...",
            "...ASSSSA...",
            "....BPPB....", // P = purple/black pants
            "....B..B....",
            "....B..B....",
            "...BB..BB...",
            "...BB..BB..."
        ],
        crouch: [
            "............",
            "............",
            "............",
            "....BBBB....",
            "...BSSSSB...",
            "...SSSwSS...",
            "...BSSSSB...",
            "....BBBB....",
            "....AA..A...",
            "...ASS...A..",
            "..BPPPPA....",
            "..BPPPP.PP..",
            "..BBBBBB....",
            "...BBB.BBB.."
        ],
        punch: [
            "....BBBB....",
            "...BSSSSB...",
            "...SSSwSS...",
            "...BSSSSB...",
            "....BBBB....",
            "...BSSA.....",
            "..ASSSBAAAAA",
            "..ASSSSA....",
            "...ASSSA....",
            "....BPPB....", // pants
            "....B..B....",
            "....B..B....",
            "...BB..BB...",
            ".......BB..."
        ]
    },
    raiden: {
        idle: [
            "...AAAAAA...", // Straw hat
            "..AAAAAAAA..", // Straw hat
            "...PSSSSP...", // P = White/Blue
            "...BSSwSB...",
            "....BBBB....",
            ".....PP.....",
            "....BPPB....",
            "...BPPPPB...",
            "...BPPPPB...",
            "...BPPPpB...",
            "....BBBB....",
            "....B..B....",
            "....B..B....",
            "...BB..BB...",
            "...BB..BB..."
        ],
        crouch: [
            "............",
            "............",
            "...AAAAAA...",
            "..AAAAAAAA..",
            "...PSSSSP...",
            "...BSSwSB...",
            "....BBBB....",
            "....BB..B...",
            "...BPPP..P..",
            "..BPPPPB.BB.",
            "..BPPPP.BB..",
            "..BBBBBB....",
            "...BBB.BBB.."
        ],
        punch: [
            "...AAAAAA...",
            "..AAAAAAAA..",
            "...PSSSSP...",
            "...BSSwSB...",
            "....BBBB....",
            "...BPPB.....",
            "..BPPPPPBBBB",
            "..BPPPPB....",
            "...BPPPpB...",
            "....BBBB....",
            "....B..B....",
            "....B..B....",
            "...BB..BB...",
            ".......BB..."
        ]
    }
};

// Maps letters to fillStyles based on the character's properties
export function getPixelColor(charId, pixelCode, primaryColor) {
    if (pixelCode === '.') return null;
    
    const colors = {
        'B': '#1a1a1a',          // Dark clothing
        'S': '#fcd2b6',          // Skin
        'w': '#ffffff',          // White eye dot
        'p': '#555555',          // Belt/Secondary
        'A': '#cccccc',          // Accent (metal/hat)
        'O': '#222222',          // Other Details
    };

    if (pixelCode === 'P') return primaryColor;
    if (pixelCode === 'A' && charId === 'raiden') return '#dcd2aa'; // Straw color
    if (pixelCode === 'p' && charId === 'liukang') return '#1a1a1a'; // Belt
    
    // Skin variants
    if (charId === 'jax' && pixelCode === 'S') return '#5c3a21'; // Darker skin
    if (charId === 'liukang' && pixelCode === 'S') return '#edb68b'; // Med skin

    return colors[pixelCode] || '#ff00ff';
}
