
        // Nastavení hry
        const TOTAL_TARGETS = 5;  // Počet cílů 
        const SCOPE_RADIUS = 150; // Velikost průhledu
        
        // Stav
        let targetsFound = 0; // Počet nalezených cílů
        let startTime = 0;    // Čas v začátku hry
        let timerInterval;   // Interval pro časovač
        let isMeasuring = false;  // Stav měření
        // Pozice myši
        let mouseX = window.innerWidth / 2;    // Výchozí na střed
        let mouseY = window.innerHeight / 2;
        let animationFrameId;                   // ID pro animaci

        // DOM Elementy
        const canvas = document.getElementById('scope-canvas'); 
        const ctx = canvas.getContext('2d');
        const crosshair = document.getElementById('crosshair');
        const bgElement = document.getElementById('game-background');
        const targetsContainer = document.getElementById('targets-container');
        const statusInd = document.getElementById('status-indicator');
        const timeDisplay = document.getElementById('time-display');
        const scoreDisplay = document.getElementById('score-display');
        const resultScreen = document.getElementById('result-screen');
        const startScreen = document.getElementById('start-screen');

        // Inicializace velikosti canvasu
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            drawScope();
        }
        window.addEventListener('resize', resizeCanvas);

        // Sledování myši
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            // Aktualizace pozice kříže
            crosshair.style.left = mouseX + 'px';
            crosshair.style.top = mouseY + 'px';
            
            // Aktualizace pozice status textu
            statusInd.style.left = mouseX + 'px';
            statusInd.style.top = mouseY + 'px';

            drawScope();
        });

        // Vykreslení pohledu dalekohledem
        function drawScope() {
            // Vyčistíme canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Vyplníme celý canvas černou
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Nastavíme režim pro "vymazání" kruhu
            ctx.globalCompositeOperation = 'destination-out';
            // Nakreslíme kruh na pozici myši (průhled)
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, SCOPE_RADIUS, 0, Math.PI * 2, false);
            ctx.fill();
            // Resetujeme režim zpět na normální
            ctx.globalCompositeOperation = 'source-over';
            // Efekt čočky - vignetace
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, SCOPE_RADIUS, 0, Math.PI * 2, false);
            const gradient = ctx.createRadialGradient(mouseX, mouseY, SCOPE_RADIUS * 0.8, mouseX, mouseY, SCOPE_RADIUS);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
            ctx.fillStyle = gradient;
            ctx.fill(); 
            
        }

        // Generování cílů
        function spawnTargets() {
            targetsContainer.innerHTML = ''; // Vyčistit staré
            const padding = 100;             // Odsazení od kraje
            for (let i = 0; i < TOTAL_TARGETS; i++) {
                const target = document.createElement('div');
                target.classList.add('prism');
                // Náhodná pozice
                const x = Math.floor(Math.random() * (window.innerWidth - padding * 2)) + padding;
                const y = Math.floor(Math.random() * (window.innerHeight - padding * 2)) + padding;
                target.style.left = x + 'px';
                target.style.top = y + 'px';
                // Event pro kliknutí
                target.addEventListener('click', (e) => {
                    handleTargetClick(e, target);
                });
                targetsContainer.appendChild(target);
            }
        }

        // Logika kliknutí na cíl
        function handleTargetClick(e, targetElement) {
            // Pokud už měříme nebo je cíl změřený, ignorovat
            if (isMeasuring || targetElement.classList.contains('measured')) return;
            // Kontrola, zda je cíl uvnitř průhledu 
            const rect = targetElement.getBoundingClientRect();
            const targetCenterX = rect.left + rect.width / 2;
            const targetCenterY = rect.top + rect.height / 2;
            const dist = Math.hypot(mouseX - targetCenterX, mouseY - targetCenterY);
            if (dist > 30) return; // Tolerance 30px
            // Spustit měření
            startMeasurement(targetElement);
        }

        function startMeasurement(targetElement) {
            isMeasuring = true;
            statusInd.textContent = "MĚŘÍM...";
            statusInd.style.display = 'block';
            statusInd.style.color = '#ffcc00'; 

            playBeep(); // Přehrát zvukový efekt při zahájení měření
            const delay = 500;
            setTimeout(() => {
                completeMeasurement(targetElement);
            }, delay);
        }

        function completeMeasurement(targetElement) {
            isMeasuring = false;
            targetElement.classList.add('measured');
            targetsFound++; // Připočet nalezených cílů
            statusInd.textContent = "ZAMĚŘENO [OK]";
            statusInd.style.color = '#00ffcc'; // Zelená při úspěchu
            updateHUD();
            // Skrýt text po chvíli
            setTimeout(() => {
                if (!isMeasuring) statusInd.style.display = 'none';
            }, 1000);
            // Kontrola výhry
            if (targetsFound >= TOTAL_TARGETS) {
                endGame();
            }
        }

        // Časovač
        function updateTimer() {
            const currentTime = Date.now();
            const elapsed = (currentTime - startTime) / 1000;
            timeDisplay.textContent = elapsed.toFixed(2);
        }

        function updateHUD() {
            scoreDisplay.textContent = `${targetsFound} / ${TOTAL_TARGETS}`;
        }

        // Spuštění hry
        function startGame() {
            startScreen.style.display = 'none';
            resultScreen.style.display = 'none';
            // Reset stavu
            targetsFound = 0;
            isMeasuring = false;
            updateHUD();
            // Náhodné pozadí
            const randomBg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
            bgElement.style.backgroundImage = `url('${randomBg}')`;
            // Canvas setup
            resizeCanvas();
            // Vygenerovat cíle
            spawnTargets();
            // Start časovače
            startTime = Date.now();
            timerInterval = setInterval(updateTimer, 10);
        }
        // Ukončení hry
        function endGame() {
            clearInterval(timerInterval);
            const finalTime = timeDisplay.textContent;
            
            document.getElementById('final-time').textContent = finalTime + "s";
            
            // Generování hlášky podle času
            const timeNum = parseFloat(finalTime);
            const commentEl = document.getElementById('comment');
            if(timeNum < 5) commentEl.textContent = "Nereálně rychlé! Jsi robot?";
            else if(timeNum < 10) commentEl.textContent = "Výborná práce, stíháš pivo po šichtě.";
            else if(timeNum < 20) commentEl.textContent = "Standardní výkon geodeta.";
            else commentEl.textContent = "Moc pomalé. Šéf nebude mít radost.";
            resultScreen.style.display = 'flex';
            sendScoreToBackend(finalTime); 
        }
        // Restart hry
        function restartGame() {
            startGame();
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
        function sendScoreToBackend(finalTime) {
            const csrftoken = getCookie('csrftoken');
            console.log(`Attempting to save score: ${finalTime}`);
            fetch('/score/save_score/', { // URL k ukládání skóre 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken 
                },
                body: JSON.stringify({
                    // Data k odeslání
                    score: parseFloat(finalTime), // Skóre 
                    hra: 'mereni' // Název hry 
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

            function playBeep() {
                // Simple oscillator beep using Web Audio API
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                osc.connect(ctx.destination);
                osc.frequency.value = 800;
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            }

        // inicializace hry při načtení stránky
        resizeCanvas();

