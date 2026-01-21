// --- KONFIGURACE A KONSTANTY ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Barvy
const CERNA = "#000000";
const BILA = "#FFFFFF";
const SEDA_RAM = "#E6E6E6";
const SEDA_MRIZKA = "#646464";
const CERVENA_VYTYCKA = "#DC2828";
const MODRA_TEXT = "#000096";
const CERVENA_MESSAGE = "#D53250";
const ZELENA_START = "#228B22";

// Rozměry a okraje
const sirka_okna = 900;
const vyska_okna = 700;
const OKRAJ_LEV = 40;
const OKRAJ_PRAV = 90;
const OKRAJ_HOR = 60;
const OKRAJ_DOL = 40;

const hraci_sirka = sirka_okna - OKRAJ_LEV - OKRAJ_PRAV;
const hraci_vyska = vyska_okna - OKRAJ_HOR - OKRAJ_DOL;

// S-JTSK
const POCATEK_Y_JTSK = 740000;
const POCATEK_X_JTSK = 1040000;
const MERITKO = 0.5;

// Herní nastavení
const velikost_hada = 15;
const rychlost_hada = 15; // FPS
const limit_casu = 60;

// --- PROMĚNNÉ STAVU HRY ---
let gameLoop;
let gameState = 'START'; // START, RUNNING, GAMEOVER
let gameCloseReason = ''; // 'TIME' nebo 'CRASH'

let had = [];
let delka_hada = 1;
let smer = { x: 0, y: 0 };
let pristi_smer = { x: 0, y: 0 }; // Buffer pro klávesy
let jidlo = { x: 0, y: 0 };

let startTime = 0;
let zbyvajici_cas = limit_casu;

// Načtení obrázku mapy
const mapaImg = new Image();
// Pokud proměnná není definována (testování lokálně), použije se placeholder, jinak cesta z window
mapaImg.src = window.MAPA_IMG_SRC || ''; 
let mapaNactena = false;
mapaImg.onload = () => { mapaNactena = true; };

// --- FUNKCE ---

function novyBod() {
    // Grid zarovnání na 15px
    const cols = Math.floor((hraci_sirka - velikost_hada) / 15);
    const rows = Math.floor((hraci_vyska - velikost_hada) / 15);

    const rX = Math.floor(Math.random() * cols);
    const rY = Math.floor(Math.random() * rows);

    return {
        x: OKRAJ_LEV + rX * 15,
        y: OKRAJ_HOR + rY * 15
    };
}

function resetHry() {
    // Startovní pozice hada (střed)
    const startX = OKRAJ_LEV + Math.round(hraci_sirka / 2 / 15) * 15;
    const startY = OKRAJ_HOR + Math.round(hraci_vyska / 2 / 15) * 15;

    had = [{ x: startX, y: startY }];
    delka_hada = 1;
    smer = { x: 0, y: 0 };
    pristi_smer = { x: 0, y: 0 };

    jidlo = novyBod();
    gameState = 'START';
    zbyvajici_cas = limit_casu;
    
    // Reset flagu pro odeslání skóre
    window.scoreSent = false;
}

// CSRF token z cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function sendScoreToBackend(finalScore) {
    // Zabránění vícenásobnému odeslání
    if (window.scoreSent) return;
    
    window.scoreSent = true; // Nastavíme flag, že se odesílá
    
    const csrftoken = getCookie('csrftoken');
    console.log(`Attempting to save score: ${finalScore}`);
    
    fetch('/score/save_score/', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({
            score: finalScore, 
            hra: 'had' // Identifikátor hry pro backend
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            console.log('Score saved successfully to database!');
        } else {
            console.error('Failed to save score:', data.message);
        }
    })
    .catch((error) => {
        console.error('Network or system error during save:', error);
    });
}

// Pomocná funkce pro bezpečné ukončení hry a uložení
function triggerGameOver(reason) {
    gameState = 'GAMEOVER';
    gameCloseReason = reason;
    // Odeslat skóre (délka hada mínus hlava/start)
    sendScoreToBackend(delka_hada - 1);
}


// --- VYKRESLOVÁNÍ ---

function vykresliRamAOsy() {
    // 1. Okraje (šedé plochy)
    ctx.fillStyle = SEDA_RAM;
    ctx.fillRect(0, 0, OKRAJ_LEV, vyska_okna);
    ctx.fillRect(sirka_okna - OKRAJ_PRAV, 0, OKRAJ_PRAV, vyska_okna);
    ctx.fillRect(0, 0, sirka_okna, OKRAJ_HOR);
    ctx.fillRect(0, vyska_okna - OKRAJ_DOL, sirka_okna, OKRAJ_DOL);

    // 2. Rám hrací plochy
    ctx.strokeStyle = CERNA;
    ctx.lineWidth = 2;
    ctx.strokeRect(OKRAJ_LEV, OKRAJ_HOR, hraci_sirka, hraci_vyska);

    // --- 3. OSA Y (Nahoře, roste doleva) ---
    ctx.fillStyle = CERNA;
    ctx.font = "12px Consolas";
    ctx.textAlign = "center";
    ctx.fillText("Souřadnice Y [m]", sirka_okna / 2, 20);

    const krok_px = 100;
    ctx.lineWidth = 1;

    for (let i = 0; i <= hraci_sirka; i += krok_px) {
        let px_x = sirka_okna - OKRAJ_PRAV - i;
        let hodnota_y = POCATEK_Y_JTSK + (i * MERITKO);

        ctx.beginPath();
        ctx.moveTo(px_x, OKRAJ_HOR);
        ctx.lineTo(px_x, OKRAJ_HOR - 5);
        ctx.stroke();

        ctx.fillText(Math.floor(hodnota_y), px_x, OKRAJ_HOR - 8);
    }

    // --- 4. OSA X (Vpravo, roste dolů) ---
    // Rotace textu
    ctx.save();
    ctx.translate(sirka_okna - 15, vyska_okna / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Souřadnice X [m]", 0, 0);
    ctx.restore();

    ctx.textAlign = "left";
    for (let i = 0; i <= hraci_vyska; i += krok_px) {
        let px_y = OKRAJ_HOR + i;
        let hodnota_x = POCATEK_X_JTSK + (i * MERITKO);
        let pos_x_ram = sirka_okna - OKRAJ_PRAV;

        ctx.beginPath();
        ctx.moveTo(pos_x_ram, px_y);
        ctx.lineTo(pos_x_ram + 5, px_y);
        ctx.stroke();

        ctx.fillText(Math.floor(hodnota_x), pos_x_ram + 8, px_y + 3);
    }
}

function vykresliMrizku() {
    const rozestup = 50;
    const delka_krizku = 4;
    ctx.strokeStyle = SEDA_MRIZKA;
    ctx.lineWidth = 1;

    for (let x = 0; x < hraci_sirka; x += rozestup) {
        for (let y = 0; y < hraci_vyska; y += rozestup) {
            let sx = OKRAJ_LEV + x;
            let sy = OKRAJ_HOR + y;

            ctx.beginPath();
            ctx.moveTo(sx - delka_krizku, sy);
            ctx.lineTo(sx + delka_krizku, sy);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(sx, sy - delka_krizku);
            ctx.lineTo(sx, sy + delka_krizku);
            ctx.stroke();
        }
    }
}

function vykresliHada() {
    for (let i = 0; i < had.length; i++) {
        // Střídání barev (červená/bílá)
        ctx.fillStyle = (i % 2 === 0) ? CERVENA_VYTYCKA : BILA;

        ctx.fillRect(had[i].x, had[i].y, velikost_hada, velikost_hada);
        ctx.strokeStyle = CERNA;
        ctx.lineWidth = 1;
        ctx.strokeRect(had[i].x, had[i].y, velikost_hada, velikost_hada);
    }
}

function vykresliJidlo() {
    const stredX = jidlo.x + velikost_hada / 2;
    const stredY = jidlo.y + velikost_hada / 2;
    const radius = velikost_hada / 2;

    ctx.fillStyle = CERNA;
    ctx.beginPath();
    ctx.arc(stredX, stredY, radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = BILA;
    ctx.beginPath();
    ctx.arc(stredX, stredY, 2, 0, 2 * Math.PI);
    ctx.fill();
}

function zobrazInfoPanel() {
    // Body
    ctx.font = "20px sans-serif";
    ctx.fillStyle = CERVENA_MESSAGE;
    ctx.textAlign = "left";
    ctx.fillText(`Body: ${delka_hada - 1}`, OKRAJ_LEV, 35);

    // Čas
    let barvaCasu = (zbyvajici_cas < 10) ? CERVENA_MESSAGE : CERNA;
    ctx.fillStyle = barvaCasu;
    ctx.textAlign = "right";
    ctx.fillText(`Čas: ${Math.ceil(zbyvajici_cas)} s`, sirka_okna - OKRAJ_PRAV, 35);
}

function zobrazAktualniSouradnice(headX, headY) {
    const dist_x_px = headY - OKRAJ_HOR;
    const jtsk_x = POCATEK_X_JTSK + (dist_x_px * MERITKO);

    const dist_y_px = (sirka_okna - OKRAJ_PRAV) - headX;
    const jtsk_y = POCATEK_Y_JTSK + (dist_y_px * MERITKO);

    ctx.font = "18px Consolas";
    ctx.fillStyle = CERNA;
    ctx.textAlign = "center";
    ctx.fillText(`Y: ${jtsk_y.toFixed(2)}   X: ${jtsk_x.toFixed(2)}`, sirka_okna / 2, vyska_okna - 15);
}

function drawMessageCentered(text, color, fontSize, yOffset) {
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    const textMetrics = ctx.measureText(text);
    const textHeight = fontSize;

    const centerX = sirka_okna / 2;
    const centerY = vyska_okna / 2 + yOffset;

    // Pozadí textu
    const padX = 15;
    const padY = 10;
    const rectW = textMetrics.width + padX * 2;
    const rectH = textHeight + padY * 2;

    ctx.fillStyle = BILA;
    ctx.fillRect(centerX - rectW / 2, centerY - rectH / 1.5, rectW, rectH);
    ctx.strokeStyle = CERNA;
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - rectW / 2, centerY - rectH / 1.5, rectW, rectH);

    // Text
    ctx.fillStyle = color;
    ctx.fillText(text, centerX, centerY);
}

// --- HLAVNÍ SMYČKA ---

function update() {
    if (gameState === 'RUNNING') {
        // Časovač
        const now = Date.now() / 1000;
        zbyvajici_cas = limit_casu - (now - startTime);

        if (zbyvajici_cas <= 0) {
            zbyvajici_cas = 0;
            triggerGameOver('TIME'); // Upraveno: volání funkce pro konec a uložení
            return;
        }

        // Aplikace pohybu
        if (pristi_smer.x !== 0 || pristi_smer.y !== 0) {
            smer = pristi_smer;
        }

        // Výpočet nové hlavy
        const head = had[had.length - 1];
        const newHead = {
            x: head.x + smer.x,
            y: head.y + smer.y
        };

        // Kolize se stěnou
        if (newHead.x < OKRAJ_LEV || newHead.x >= sirka_okna - OKRAJ_PRAV ||
            newHead.y < OKRAJ_HOR || newHead.y >= vyska_okna - OKRAJ_DOL) {
            triggerGameOver('CRASH'); // Upraveno: volání funkce pro konec a uložení
            return;
        }

        // Kolize s vlastním tělem
        for (let segment of had) {
            if (newHead.x === segment.x && newHead.y === segment.y) {
                if (delka_hada > 1) {
                    triggerGameOver('CRASH'); // Upraveno: volání funkce pro konec a uložení
                    return;
                }
            }
        }

        had.push(newHead);

        // Jídlo
        if (Math.abs(newHead.x - jidlo.x) < velikost_hada && Math.abs(newHead.y - jidlo.y) < velikost_hada) {
            delka_hada++;
            jidlo = novyBod();
        } else {
            // Odstranit ocas
            had.shift();
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pozadí mapy
    if (mapaNactena) {
        ctx.drawImage(mapaImg, OKRAJ_LEV, OKRAJ_HOR, hraci_sirka, hraci_vyska);
        ctx.globalAlpha = 150 / 255;
        ctx.fillStyle = BILA;
        ctx.fillRect(OKRAJ_LEV, OKRAJ_HOR, hraci_sirka, hraci_vyska);
        ctx.globalAlpha = 1.0;
    } else {
        ctx.fillStyle = BILA;
        ctx.fillRect(OKRAJ_LEV, OKRAJ_HOR, hraci_sirka, hraci_vyska);
    }

    vykresliMrizku();
    vykresliRamAOsy();
    vykresliJidlo();
    vykresliHada();

    const head = had[had.length - 1];
    zobrazInfoPanel();
    zobrazAktualniSouradnice(head.x, head.y);

    if (gameState === 'START') {
        drawMessageCentered("OBEJDI S PÁSMEM ZA MINUTU CO NEJVÍC BODŮ", CERNA, 30, -50);
        drawMessageCentered("STISKNI ŠIPKU PRO START", ZELENA_START, 20, 40);
    }
    
    if (gameState === 'GAMEOVER') {
        const msg = (gameCloseReason === 'TIME') ? "ČAS VYPRŠEL!" : "MIMO MAPOVÝ LIST!";
        drawMessageCentered(msg, CERVENA_MESSAGE, 40, -60);
        drawMessageCentered(`Skóre: ${delka_hada - 1}`, CERNA, 40, 15);
        drawMessageCentered("Q-Konec  C-Znovu", MODRA_TEXT, 20, 90);
    }
}

// Game Loop
setInterval(() => {
    update();
    draw();
}, 1000 / rychlost_hada);


// --- OVLÁDÁNÍ ---
window.addEventListener('keydown', e => {
    // Zákaz scrollování
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }

    if (gameState === 'START') {
        if (e.code.startsWith('Arrow')) {
            gameState = 'RUNNING';
            startTime = Date.now() / 1000;
            if (e.code === 'ArrowLeft') pristi_smer = { x: -velikost_hada, y: 0 };
            if (e.code === 'ArrowRight') pristi_smer = { x: velikost_hada, y: 0 };
            if (e.code === 'ArrowUp') pristi_smer = { x: 0, y: -velikost_hada };
            if (e.code === 'ArrowDown') pristi_smer = { x: 0, y: velikost_hada };
        }
    } else if (gameState === 'RUNNING') {
        if (e.code === 'ArrowLeft' && smer.x === 0) pristi_smer = { x: -velikost_hada, y: 0 };
        if (e.code === 'ArrowRight' && smer.x === 0) pristi_smer = { x: velikost_hada, y: 0 };
        if (e.code === 'ArrowUp' && smer.y === 0) pristi_smer = { x: 0, y: -velikost_hada };
        if (e.code === 'ArrowDown' && smer.y === 0) pristi_smer = { x: 0, y: velikost_hada };
    } else if (gameState === 'GAMEOVER') {
        if (e.key.toLowerCase() === 'c') {
            resetHry();
        }
        if (e.key.toLowerCase() === 'q') {
            // TOTO VÁS PŘESMĚRUJE NA DOMOVSKOU STRÁNKU:
            window.location.href = "/"; 
        }
    }
});

// Spuštění
resetHry();