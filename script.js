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
        // Try to load images from the static images folder
        const imageExtensions = ['jpg', 'png'];
        const staticImagePaths = [];
        for (let i = 1; i <= 50; i++) {
            for (const ext of imageExtensions) {
                staticImagePaths.push(`images/image${i}.${ext}`);
            }
        }

        // Try to load each image and use only those that succeed
        const loadPromises = staticImagePaths.map(path => this.tryLoadImage(path));
        const results = await Promise.allSettled(loadPromises);
        this.staticImages = results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value);

        // Fallback: if no images found, use default SVGs
        if (this.staticImages.length === 0) {
            this.createDefaultImages();
        }
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

    createDefaultImages() {
        // Fallback: Create some default images if no static images found
        const patterns = ['🎯', '🎮', '🎲', '🎪', '🎨', '🎭', '🎸', '🎺', '🎻', '🎹',
            '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🏒', '🏑',
            '🌟', '⭐', '✨', '🌙', '☀️', '🌈', '⚡', '🔥', '💧', '🌸',
            '🦋', '🐝', '🐞', '🦄', '🐰', '🐸', '🐻', '🦊', '🐯', '🦁',
            '🍎', '🍊', '🍋', '🍌', '🍇', '🍓', '🍑', '🍒', '🥝', '🍍'];

        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
            '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'];

        for (let i = 0; i < Math.min(patterns.length, 50); i++) {
            const pattern = patterns[i];
            const color = colors[i % colors.length];
            const svg = this.createDefaultImage(pattern, color, i + 1);
            this.staticImages.push(svg);
        }
    } createDefaultImage(pattern, color, number) {
        const svg = `
            <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad${number}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${this.darkenColor(color, 20)};stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100" height="100" fill="url(#grad${number})" rx="15"/>
                <circle cx="50" cy="30" r="15" fill="rgba(255,255,255,0.2)"/>
                <text x="50" y="35" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle">${pattern}</text>
                <text x="50" y="75" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">${number}</text>
            </svg>
        `;
        return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
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
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.finalScore = document.getElementById('finalScore');
        this.finalMoves = document.getElementById('finalMoves');
        this.finalTime = document.getElementById('finalTime');
    }

    bindEvents() {
        this.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.playAgainBtn.addEventListener('click', () => this.playAgain());

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
        // Use all available images (static + uploaded)
        const allImages = [...this.staticImages, ...this.userImages];

        // Only pairs (each image appears twice)
        this.gameCards = [];
        for (let i = 0; i < allImages.length; i++) {
            const image = allImages[i];
            this.gameCards.push({ id: i * 2, image, matched: false });
            this.gameCards.push({ id: i * 2 + 1, image, matched: false });
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

            setTimeout(() => {
                this.checkMatch();
            }, 1000);
        }
    }

    checkMatch() {
        const [firstIndex, secondIndex] = this.flippedCards;
        const firstCard = this.gameCards[firstIndex];
        const secondCard = this.gameCards[secondIndex];

        if (firstCard.image === secondCard.image) {
            // Match found
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
        this.showGameOverModal();
    }

    showGameOverModal() {
        this.finalScore.textContent = this.score;
        this.finalMoves.textContent = this.moves;
        this.finalTime.textContent = this.formatTime(this.timer);
        this.gameOverModal.style.display = 'block';
    }

    closeModal() {
        this.gameOverModal.style.display = 'none';
    }

    playAgain() {
        this.closeModal();
        this.startGame();
    }

    resetGame() {
        this.resetGameState();
        this.gameBoard.innerHTML = '';
        this.startBtn.disabled = false;

        // Re-enable upload functionality
        const uploadBtn = document.querySelector('.upload-btn');
        uploadBtn.disabled = false;
        uploadBtn.style.opacity = '';
        uploadBtn.style.cursor = '';
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
