class MemoryGame {
    constructor() {
        this.images = [];
        this.gameCards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.score = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.gameStarted = false;
        
        this.initializeElements();
        this.bindEvents();
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
        const files = Array.from(event.target.files);
        this.images = [];
        
        if (files.length === 0) {
            this.updateUploadCount(0);
            return;
        }
        
        // Limit to 8 images maximum for a 4x4 grid
        const maxImages = 8;
        const selectedFiles = files.slice(0, maxImages);
        
        let loadedImages = 0;
        
        selectedFiles.forEach((file) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.images.push(e.target.result);
                    loadedImages++;
                    
                    if (loadedImages === selectedFiles.length) {
                        this.updateUploadCount(this.images.length);
                        this.startBtn.disabled = this.images.length < 2;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    updateUploadCount(count) {
        this.uploadCount.textContent = `${count} תמונות הועלו`;
        if (count >= 2) {
            this.uploadCount.style.color = '#4CAF50';
        } else {
            this.uploadCount.style.color = '#666';
        }
    }
    
    startGame() {
        if (this.images.length < 2) {
            alert('אנא העלה לפחות 2 תמונות כדי להתחיל את המשחק!');
            return;
        }
        
        this.resetGameState();
        this.createGameCards();
        this.renderGameBoard();
        this.startTimer();
        this.gameStarted = true;
        this.startBtn.disabled = true;
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
        // Use available images, but limit to create pairs
        const availableImages = this.images.slice();
        const pairsNeeded = Math.min(8, availableImages.length); // Max 8 pairs for 4x4 grid
        
        // Create pairs
        this.gameCards = [];
        for (let i = 0; i < pairsNeeded; i++) {
            const image = availableImages[i];
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
        
        // Adjust grid based on number of cards
        const cardCount = this.gameCards.length;
        const cols = cardCount <= 8 ? 4 : 4; // Keep 4 columns
        this.gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        
        this.gameCards.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            this.gameBoard.appendChild(cardElement);
        });
    }
    
    createCardElement(card, index) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.index = index;
        
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        cardFront.textContent = '?';
        
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
        this.startBtn.disabled = this.images.length < 2;
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
    
    // Add some example instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
        background: #e3f2fd;
        padding: 15px;
        border-radius: 10px;
        margin-bottom: 20px;
        text-align: center;
        color: #1565c0;
        font-size: 0.9em;
    `;
    instructions.innerHTML = `
        <strong>איך לשחק:</strong><br>
        1. העלה לפחות 2 תמונות (עד 8 תמונות שונות)<br>
        2. לחץ על "התחל משחק" כדי להתחיל<br>
        3. לחץ על קלפים כדי להפוך אותם ולמצוא זוגות תואמים<br>
        4. התאם את כל הזוגות כדי לנצח!
    `;
    
    const container = document.querySelector('.container');
    const header = container.querySelector('header');
    header.appendChild(instructions);
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
    }
    
    function unhighlight() {
        uploadArea.style.background = '';
        uploadArea.style.border = '';
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
