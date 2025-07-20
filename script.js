class MemoryGame {
    constructor() {
        this.staticImages = [];
        this.userImages = [];
        this.gameCards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.score = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.gameStarted = false;
        this.difficulty = 'medium';

        this.initializeElements();
        this.bindEvents();
        this.loadStaticImages();

        // Add resize handler for responsive layout
        window.addEventListener('resize', () => {
            if (this.gameCards.length > 0) {
                this.setDynamicLayout(this.gameCards.length);
            }
        });
    }

    async loadStaticImages() {
        // Try to load image pairs from the static images folder
        // Each pair should be named like: image1a.jpg, image1b.jpg or image1a.png, image1b.png
        const imageExtensions = ['jpg', 'png'];
        this.staticImages = [];

        for (let i = 1; i <= 50; i++) {
            for (const ext of imageExtensions) {
                const imageA = `images/image${i}a.${ext}`;
                const imageB = `images/image${i}b.${ext}`;

                // Try to load both images in the pair
                const [resultA, resultB] = await Promise.allSettled([
                    this.tryLoadImage(imageA),
                    this.tryLoadImage(imageB)
                ]);

                // If both images in the pair loaded successfully, add them as a set
                if (resultA.status === 'fulfilled' && resultA.value &&
                    resultB.status === 'fulfilled' && resultB.value) {
                    this.staticImages.push({
                        setId: i,
                        imageA: resultA.value,
                        imageB: resultB.value
                    });
                }
            }
        }

        // No fallback - only use images from folder
    }

    tryLoadImage(src) {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                resolve(src);
            };
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    playSuccessSound() {
        try {
            // Create audio context for generating sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create a happy ascending melody (like a celebration)
            const melody = [
                { freq: 523.25, time: 0.0, duration: 0.15 },  // C5
                { freq: 659.25, time: 0.1, duration: 0.15 },  // E5
                { freq: 783.99, time: 0.2, duration: 0.15 },  // G5
                { freq: 1046.5, time: 0.3, duration: 0.25 }   // C6 (octave higher)
            ];

            melody.forEach((note) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime);
                oscillator.type = 'triangle'; // Warmer, happier sound than sine

                // Create bouncy envelope for happy sound
                gainNode.gain.setValueAtTime(0, audioContext.currentTime + note.time);
                gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + note.time + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + note.time + note.duration);

                oscillator.start(audioContext.currentTime + note.time);
                oscillator.stop(audioContext.currentTime + note.time + note.duration);
            });

            // Add a little sparkle effect with higher frequencies
            const sparkle = [1318.5, 1568]; // E6, G6
            sparkle.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.4 + index * 0.05);
                gainNode.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.42 + index * 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.55 + index * 0.05);

                oscillator.start(audioContext.currentTime + 0.4 + index * 0.05);
                oscillator.stop(audioContext.currentTime + 0.55 + index * 0.05);
            });

        } catch (error) {
            // Silent fallback if audio context is not supported
            console.log('Audio not supported');
        }
    }

    playVictorySound() {
        try {
            // Create audio context for generating sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create an epic victory fanfare with multiple layers
            const mainMelody = [
                { freq: 523.25, time: 0.0, duration: 0.3, vol: 0.25 },   // C5
                { freq: 659.25, time: 0.2, duration: 0.3, vol: 0.25 },   // E5
                { freq: 783.99, time: 0.4, duration: 0.3, vol: 0.25 },   // G5
                { freq: 1046.5, time: 0.6, duration: 0.4, vol: 0.3 },    // C6
                { freq: 1318.5, time: 1.0, duration: 0.3, vol: 0.25 },   // E6
                { freq: 1568.0, time: 1.3, duration: 0.4, vol: 0.25 },   // G6
                { freq: 2093.0, time: 1.7, duration: 0.6, vol: 0.3 }     // C7 (final triumphant note)
            ];

            // Play main melody with square wave for boldness
            mainMelody.forEach((note) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime);
                oscillator.type = 'square'; // Bold, triumphant sound

                // Create powerful envelope
                gainNode.gain.setValueAtTime(0, audioContext.currentTime + note.time);
                gainNode.gain.linearRampToValueAtTime(note.vol, audioContext.currentTime + note.time + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + note.time + note.duration);

                oscillator.start(audioContext.currentTime + note.time);
                oscillator.stop(audioContext.currentTime + note.time + note.duration);
            });

            // Add harmonies (fifths)
            const harmonies = [
                { freq: 783.99, time: 0.0, duration: 0.3, vol: 0.15 },   // G5
                { freq: 987.77, time: 0.2, duration: 0.3, vol: 0.15 },   // B5
                { freq: 1174.7, time: 0.4, duration: 0.3, vol: 0.15 },   // D6
                { freq: 1568.0, time: 0.6, duration: 0.4, vol: 0.2 },    // G6
                { freq: 1976.0, time: 1.0, duration: 0.3, vol: 0.15 },   // B6
                { freq: 2349.3, time: 1.3, duration: 0.4, vol: 0.15 },   // D7
                { freq: 3136.0, time: 1.7, duration: 0.6, vol: 0.2 }     // G7
            ];

            harmonies.forEach((note) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime);
                oscillator.type = 'triangle';

                gainNode.gain.setValueAtTime(0, audioContext.currentTime + note.time);
                gainNode.gain.linearRampToValueAtTime(note.vol, audioContext.currentTime + note.time + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + note.time + note.duration);

                oscillator.start(audioContext.currentTime + note.time);
                oscillator.stop(audioContext.currentTime + note.time + note.duration);
            });

            // Add magical sparkle cascade
            const sparkles = [];
            for (let i = 0; i < 12; i++) {
                sparkles.push({
                    freq: 1046.5 * Math.pow(2, Math.random() * 2), // Random notes in high range
                    time: 1.2 + i * 0.08,
                    duration: 0.15,
                    vol: 0.08
                });
            }

            sparkles.forEach((note) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime);
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0, audioContext.currentTime + note.time);
                gainNode.gain.linearRampToValueAtTime(note.vol, audioContext.currentTime + note.time + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + note.time + note.duration);

                oscillator.start(audioContext.currentTime + note.time);
                oscillator.stop(audioContext.currentTime + note.time + note.duration);
            });

            // Add deep bass foundation
            const bassLine = [130.8, 164.8, 196.0, 261.6]; // C3, E3, G3, C4
            bassLine.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                oscillator.type = 'sine';

                const startTime = index * 0.6;
                gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
                gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + startTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + 0.5);

                oscillator.start(audioContext.currentTime + startTime);
                oscillator.stop(audioContext.currentTime + startTime + 0.5);
            });

        } catch (error) {
            // Silent fallback if audio context is not supported
            console.log('Audio not supported');
        }
    }

    initializeElements() {
        this.imageUpload = document.getElementById('imageUpload');
        this.uploadCount = document.getElementById('uploadCount');
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.gameBoard = document.getElementById('gameBoard');
        this.scoreElement = document.getElementById('score');
        this.movesElement = document.getElementById('moves');
        this.timerElement = document.getElementById('timer');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.finalScore = document.getElementById('finalScore');
        this.finalMoves = document.getElementById('finalMoves');
        this.finalTime = document.getElementById('finalTime');
    }

    bindEvents() {
        this.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());

        // Close modal when clicking outside
        this.gameOverModal.addEventListener('click', (e) => {
            if (e.target === this.gameOverModal) {
                this.closeModal();
            }
        });
    }

    handleImageUpload(event) {
        // Prevent upload during active game
        if (this.gameStarted) {
            event.target.value = ''; // Clear the file input
            return;
        }

        const files = Array.from(event.target.files);

        if (files.length === 0) return;

        let loadedImages = 0;
        const newImages = [];

        files.forEach((file) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    newImages.push(e.target.result);
                    loadedImages++;

                    if (loadedImages === files.length) {
                        this.userImages = [...this.userImages, ...newImages];
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    startGame() {
        this.resetGameState();
        
        // Clean up any existing celebration animations
        this.cleanupCelebrationAnimations();
        
        this.createGameCards();
        this.renderGameBoard();
        this.startTimer();
        this.gameStarted = true;
        this.startBtn.disabled = true;

        // Disable upload functionality during game
        const uploadBtn = document.querySelector('.upload-btn');
        uploadBtn.disabled = true;
        uploadBtn.style.opacity = '0.5';
        uploadBtn.style.cursor = 'not-allowed';
    }

    resetGameState() {
        this.gameCards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.score = 0;
        this.timer = 0;
        this.gameStarted = false;

        this.updateDisplay();
        this.stopTimer();
    }

    createGameCards() {
        // Create pairs from image sets and user images
        this.gameCards = [];
        let cardId = 0;

        // Handle static image sets (pairs of different but related images)
        this.staticImages.forEach((imageSet) => {
            this.gameCards.push({
                id: cardId++,
                image: imageSet.imageA,
                setId: imageSet.setId,
                matched: false
            });
            this.gameCards.push({
                id: cardId++,
                image: imageSet.imageB,
                setId: imageSet.setId,
                matched: false
            });
        });

        // Handle uploaded images (create identical pairs)
        for (let i = 0; i < this.userImages.length; i++) {
            const image = this.userImages[i];
            this.gameCards.push({
                id: cardId++,
                image,
                setId: `user_${i}`,
                matched: false
            });
            this.gameCards.push({
                id: cardId++,
                image,
                setId: `user_${i}`,
                matched: false
            });
        }

        // Shuffle the cards
        this.shuffleArray(this.gameCards);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    renderGameBoard() {
        this.gameBoard.innerHTML = '';

        // Calculate dynamic layout based on card count
        const cardCount = this.gameCards.length;
        this.setDynamicLayout(cardCount);

        this.gameCards.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            this.gameBoard.appendChild(cardElement);
        });
    }

    setDynamicLayout(cardCount) {
        const root = document.documentElement;

        // Calculate optimal grid columns
        let cols = 4;
        if (cardCount <= 8) cols = 4;
        else if (cardCount <= 16) cols = 4;
        else if (cardCount <= 24) cols = 6;
        else if (cardCount <= 36) cols = 6;
        else if (cardCount <= 50) cols = 8;
        else if (cardCount <= 72) cols = 9;
        else cols = 10;

        // Calculate card size based on screen width and number of columns
        const screenWidth = window.innerWidth;
        const maxBoardWidth = Math.min(screenWidth * 0.9, 1200);
        const cardSize = Math.max(50, Math.min(120, (maxBoardWidth - (cols + 1) * 15) / cols));

        // Calculate gap and padding based on card size
        const gap = Math.max(5, Math.min(15, cardSize * 0.12));
        const padding = Math.max(10, Math.min(20, cardSize * 0.15));

        // Calculate board width and container width
        const boardWidth = cols * cardSize + (cols - 1) * gap + padding * 2;
        const containerWidth = boardWidth + 40; // Extra space for container padding

        // Calculate font size based on card size
        const fontSize = Math.max(0.8, Math.min(2, cardSize / 60));

        // Set CSS variables
        root.style.setProperty('--grid-columns', cols);
        root.style.setProperty('--card-size', `${cardSize}px`);
        root.style.setProperty('--card-gap', `${gap}px`);
        root.style.setProperty('--board-padding', `${padding}px`);
        root.style.setProperty('--board-width', `${boardWidth}px`);
        root.style.setProperty('--container-width', `${containerWidth}px`);
        root.style.setProperty('--card-radius', `${Math.max(6, cardSize * 0.1)}px`);
        root.style.setProperty('--card-font-size', `${fontSize}em`);
    }

    createCardElement(card, index) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.index = index;

        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';

        const backImg = document.createElement('img');
        backImg.alt = 'גב קלף';
        backImg.style.width = '100%';
        backImg.style.height = '100%';
        backImg.style.objectFit = 'cover';

        // Try different image formats for card back
        const cardBackFormats = ['png', 'jpg', 'jpeg'];
        let formatIndex = 0;

        const tryNextFormat = () => {
            if (formatIndex < cardBackFormats.length) {
                backImg.src = `images/card-back.${cardBackFormats[formatIndex]}`;
                formatIndex++;
            } else {
                // All formats failed, use fallback
                cardFront.removeChild(backImg);
                cardFront.textContent = '?';
                cardFront.style.display = 'flex';
                cardFront.style.alignItems = 'center';
                cardFront.style.justifyContent = 'center';
                cardFront.style.fontSize = '2em';
                cardFront.style.color = 'white';
            }
        };

        backImg.onerror = tryNextFormat;
        tryNextFormat(); // Start with first format

        cardFront.appendChild(backImg);

        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';

        const img = document.createElement('img');
        img.src = card.image;
        img.alt = 'קלף זיכרון';
        cardBack.appendChild(img);

        cardDiv.appendChild(cardFront);
        cardDiv.appendChild(cardBack);

        cardDiv.addEventListener('click', () => this.flipCard(index));

        return cardDiv;
    }

    flipCard(index) {
        if (!this.gameStarted) return;
        if (this.flippedCards.length >= 2) return;
        if (this.gameCards[index].matched) return;
        if (this.flippedCards.includes(index)) return;

        const cardElement = this.gameBoard.children[index];
        cardElement.classList.add('flipped');
        this.flippedCards.push(index);

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateDisplay();

            // Check for immediate match and play sound right away
            const [firstIndex, secondIndex] = this.flippedCards;
            const firstCard = this.gameCards[firstIndex];
            const secondCard = this.gameCards[secondIndex];

            if (firstCard.setId === secondCard.setId) {
                // Play success sound immediately when match is found
                this.playSuccessSound();
            }

            setTimeout(() => {
                this.checkMatch();
            }, 1000);
        }
    }

    checkMatch() {
        const [firstIndex, secondIndex] = this.flippedCards;
        const firstCard = this.gameCards[firstIndex];
        const secondCard = this.gameCards[secondIndex];

        if (firstCard.setId === secondCard.setId) {
            // Match found (same set/pair)
            firstCard.matched = true;
            secondCard.matched = true;
            this.matchedPairs++;
            this.score += 100;

            const firstElement = this.gameBoard.children[firstIndex];
            const secondElement = this.gameBoard.children[secondIndex];

            firstElement.classList.add('matched');
            secondElement.classList.add('matched');

            // Check if game is complete
            if (this.matchedPairs === this.gameCards.length / 2) {
                this.gameComplete();
            }
        } else {
            // No match - flip cards back
            const firstElement = this.gameBoard.children[firstIndex];
            const secondElement = this.gameBoard.children[secondIndex];

            firstElement.classList.remove('flipped');
            secondElement.classList.remove('flipped');
        }

        this.flippedCards = [];
        this.updateDisplay();
    }

    gameComplete() {
        this.stopTimer();
        this.gameStarted = false;
        this.startBtn.disabled = false;

        // Play victory sound when game is completed
        this.playVictorySound();

        // Start celebration animations
        this.startCelebrationAnimations();

        // Re-enable upload functionality when game completes
        const uploadBtn = document.querySelector('.upload-btn');
        uploadBtn.disabled = false;
        uploadBtn.style.opacity = '';
        uploadBtn.style.cursor = '';

        // Calculate bonus score based on time and moves
        const timeBonus = Math.max(0, 300 - this.timer);
        const moveBonus = Math.max(0, (this.gameCards.length - this.moves) * 10);
        this.score += timeBonus + moveBonus;

        this.updateDisplay();

        // Delay modal show to let animations start
        setTimeout(() => {
            this.showGameOverModal();
        }, 1000);
    }

    startCelebrationAnimations() {
        // Create confetti effect
        this.createConfetti();

        // Add pulsing effect to score
        this.animateScoreCounter();

        // Make all matched cards sparkle
        this.sparkleMatchedCards();

        // Add screen flash effect
        this.createScreenFlash();
    }

    createConfetti() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'];
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        confettiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
        `;
        document.body.appendChild(confettiContainer);

        // Create 50 confetti pieces
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 10 + 5;
            const startX = Math.random() * window.innerWidth;
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 2;

            confetti.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                left: ${startX}px;
                top: -10px;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                animation: confettiFall ${duration}s ${delay}s ease-out forwards;
                transform: rotate(${Math.random() * 360}deg);
            `;

            confettiContainer.appendChild(confetti);
        }

        // Add CSS animation keyframes
        if (!document.getElementById('confetti-styles')) {
            const style = document.createElement('style');
            style.id = 'confetti-styles';
            style.textContent = `
                @keyframes confettiFall {
                    0% {
                        transform: translateY(-10px) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
                @keyframes scoreGlow {
                    0%, 100% { 
                        transform: scale(1);
                        color: inherit;
                        text-shadow: none;
                    }
                    50% { 
                        transform: scale(1.2);
                        color: #FFD700;
                        text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
                    }
                }
                @keyframes cardSparkle {
                    0%, 100% { 
                        filter: brightness(1) saturate(1);
                        transform: scale(1);
                    }
                    50% { 
                        filter: brightness(1.3) saturate(1.5);
                        transform: scale(1.05);
                    }
                }
                @keyframes screenFlash {
                    0%, 100% { opacity: 0.1; }
                    50% { opacity: 0.3; }
                }
            `;
            document.head.appendChild(style);
        }

        // Store reference to confetti container for cleanup on reset/new game
        this.confettiContainer = confettiContainer;

        // Create continuous confetti generation
        this.confettiInterval = setInterval(() => {
            if (this.confettiContainer && this.confettiContainer.parentNode) {
                const confetti = document.createElement('div');
                const color = colors[Math.floor(Math.random() * colors.length)];
                const size = Math.random() * 10 + 5;
                const startX = Math.random() * window.innerWidth;
                const duration = Math.random() * 3 + 2;

                confetti.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    left: ${startX}px;
                    top: -10px;
                    border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                    animation: confettiFall ${duration}s ease-out forwards;
                    transform: rotate(${Math.random() * 360}deg);
                `;

                this.confettiContainer.appendChild(confetti);

                // Remove individual confetti pieces after they fall
                setTimeout(() => {
                    if (confetti && confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, duration * 1000 + 500);
            }
        }, 300);
    }

    animateScoreCounter() {
        const scoreElement = this.scoreElement;
        scoreElement.style.animation = 'scoreGlow 2s ease-in-out infinite';
    }

    sparkleMatchedCards() {
        const matchedCards = document.querySelectorAll('.card.matched');
        matchedCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = 'cardSparkle 1.5s ease-in-out infinite';
            }, index * 100);
        });
    }

    createScreenFlash() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0) 70%);
            pointer-events: none;
            z-index: 9998;
            animation: screenFlash 4s ease-in-out infinite;
        `;
        document.body.appendChild(flash);

        // Store reference for cleanup on reset/new game
        this.screenFlash = flash;
    }

    showGameOverModal() {
        // Add celebratory content to modal
        this.finalScore.textContent = this.score;
        this.finalMoves.textContent = this.moves;
        this.finalTime.textContent = this.formatTime(this.timer);

        const modalContent = this.gameOverModal.querySelector('.modal-content');

        // Add floating animation keyframe if not exists
        if (!document.getElementById('modal-animations')) {
            const style = document.createElement('style');
            style.id = 'modal-animations';
            style.textContent = `
                @keyframes modalBounceIn {
                    0% { 
                        transform: translate(-50%, -50%) scale(0.3);
                        opacity: 0;
                    }
                    50% { 
                        transform: translate(-50%, -50%) scale(1.1);
                    }
                    100% { 
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Animate modal entrance
        modalContent.style.animation = 'modalBounceIn 0.6s ease-out';
        this.gameOverModal.style.display = 'block';
    }

    closeModal() {
        this.gameOverModal.style.display = 'none';
    }

    resetGame() {
        this.resetGameState();
        this.gameBoard.innerHTML = '';
        this.startBtn.disabled = false;

        // Clean up persistent celebration animations
        this.cleanupCelebrationAnimations();

        // Re-enable upload functionality
        const uploadBtn = document.querySelector('.upload-btn');
        uploadBtn.disabled = false;
        uploadBtn.style.opacity = '';
        uploadBtn.style.cursor = '';
    }

    cleanupCelebrationAnimations() {
        // Stop confetti generation
        if (this.confettiInterval) {
            clearInterval(this.confettiInterval);
            this.confettiInterval = null;
        }

        // Remove confetti container
        if (this.confettiContainer && this.confettiContainer.parentNode) {
            this.confettiContainer.parentNode.removeChild(this.confettiContainer);
            this.confettiContainer = null;
        }

        // Remove screen flash
        if (this.screenFlash && this.screenFlash.parentNode) {
            this.screenFlash.parentNode.removeChild(this.screenFlash);
            this.screenFlash = null;
        }

        // Reset score glow animation
        if (this.scoreElement) {
            this.scoreElement.style.animation = '';
        }

        // Reset card sparkle animations
        const matchedCards = document.querySelectorAll('.card.matched');
        matchedCards.forEach(card => {
            card.style.animation = '';
        });
    }

    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateDisplay() {
        this.scoreElement.textContent = this.score;
        this.movesElement.textContent = this.moves;
        this.timerElement.textContent = this.formatTime(this.timer);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new MemoryGame();
});

// Add drag and drop functionality
document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.querySelector('.file-upload');
    const fileInput = document.getElementById('imageUpload');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        uploadArea.style.background = '#f0f8ff';
        uploadArea.style.border = '2px dashed #4CAF50';
        uploadArea.style.borderRadius = '15px';
        uploadArea.style.padding = '10px';
    }

    function unhighlight() {
        uploadArea.style.background = '';
        uploadArea.style.border = '';
        uploadArea.style.borderRadius = '';
        uploadArea.style.padding = '';
    }

    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;

        // Trigger change event
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
    }
});
