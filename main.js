// main.js

import { boardData } from './boardData.js';

// --- DOM ELEMENTS --- //
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const numPlayersInput = document.getElementById('num-players');
const playerNameInputs = document.getElementById('player-name-inputs');
const startGameBtn = document.getElementById('start-game-btn');

const gameBoard = document.getElementById('game-board');
const messageLog = document.getElementById('message-log');
const playerListContainer = document.getElementById('player-list-container');

const currentPlayerDisplay = document.getElementById('current-player-display');
const diceDisplay = document.getElementById('dice-display');
const rollDiceBtn = document.getElementById('roll-dice-btn');
const endTurnBtn = document.getElementById('end-turn-btn');

// Property Actions
const propertyActions = document.getElementById('property-actions');
const buyPropertyBtn = document.getElementById('buy-property-btn');
const mortgagePropertyBtn = document.getElementById('mortgage-property-btn');

// Jail Actions
const jailActions = document.getElementById('jail-actions');
const payBailBtn = document.getElementById('pay-bail-btn');

// Debug
const toggleDebugBtn = document.getElementById('toggle-debug-btn');
const debugControls = document.getElementById('debug-controls');

// --- GAME STATE --- //
let gameState = {};

const initialGameState = {
    players: [],
    properties: [],
    currentPlayerIndex: 0,
    turnHasRolled: false,
    doublesCount: 0, // NEW: For tracking doubles
    isGameOver: false,
};

// --- SETUP PHASE --- //

function initializeSetup() {
    numPlayersInput.addEventListener('input', generatePlayerNameInputs);
    startGameBtn.addEventListener('click', startGame);
    toggleDebugBtn.addEventListener('click', () => {
        const isHidden = debugControls.style.display === 'none';
        debugControls.style.display = isHidden ? 'flex' : 'none';
    });
    generatePlayerNameInputs();
}

function generatePlayerNameInputs() {
    const numPlayers = parseInt(numPlayersInput.value);
    playerNameInputs.innerHTML = '';
    for (let i = 0; i < numPlayers; i++) {
        const div = document.createElement('div');
        div.className = 'player-input-group';
        div.innerHTML = `
            <label for="player-name-${i}">Player ${i + 1} Name:</label>
            <input type="text" id="player-name-${i}" value="Player ${i + 1}">
        `;
        playerNameInputs.appendChild(div);
    }
}

function startGame() {
    // 1. Initialize Game State
    gameState = JSON.parse(JSON.stringify(initialGameState)); // Deep copy to reset
    
    // 2. Create Players
    const numPlayers = parseInt(numPlayersInput.value);
    for (let i = 0; i < numPlayers; i++) {
        const name = document.getElementById(`player-name-${i}`).value;
        gameState.players.push({
            id: i,
            name: name,
            money: 1500,
            position: 0,
            properties: [],
            inJail: false,
            jailTurns: 0,
            getOutOfJailCards: 0,
            isBankrupt: false
        });
    }

    // 3. Initialize Properties from boardData
    gameState.properties = boardData.map((space, index) => ({
        ...space,
        boardIndex: index,
        owner: null,
        houses: 0,
        isMortgaged: false
    }));

    // 4. Render UI
    renderGameBoard();
    
    // 5. Switch to Game Screen
    setupScreen.style.display = 'none';
    gameScreen.style.display = 'flex';

    // 6. Start the first turn
    startTurn();
}

// --- RENDERING & UI UPDATES --- //

function renderGameBoard() {
    gameBoard.innerHTML = '';
    gameState.properties.forEach(space => {
        const spaceEl = document.createElement('div');
        spaceEl.id = space.id;
        spaceEl.className = `board-space ${space.type === 'corner' ? 'corner' : ''}`;
        
        let content = `<div class="space-name">${space.name}</div>`;
        if (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') {
            content += `<div class="space-price">₡${space.price}</div>`;
            if (space.group) {
                content += `<div class="property-color-bar ${space.group}"></div>`;
            }
            content += `<div class="dwelling-container"></div>`;
        }
        if (space.type === 'tax') {
            content += `<div class="space-price">Pay ₡${space.amount}</div>`;
        }
        content += `<div class="space-owner"></div>`;

        spaceEl.innerHTML = content;
        gameBoard.appendChild(spaceEl);
    });
}

function updateUI() {
    updatePlayerList();
    updateBoardTokens();
    updateBoardOwnership(); // NEW: Call function to update board state
    updateControls();
}

function updatePlayerList() {
    playerListContainer.innerHTML = '<h3>Players</h3>';
    gameState.players.forEach((player, index) => {
        if (player.isBankrupt) return;
        const playerStatus = document.createElement('div');
        playerStatus.className = 'player-status' + (index === gameState.currentPlayerIndex ? ' current' : '');
        playerStatus.innerHTML = `
            <h4><div class="token p${player.id}" style="position: static; display: inline-block; vertical-align: middle;"></div> ${player.name}</h4>
            <ul>
                <li>Credits: ₡${player.money}</li>
                <li>Position: ${gameState.properties[player.position].name}</li>
                ${player.inJail ? '<li>(In Detention)</li>' : ''}
            </ul>
        `;
        playerListContainer.appendChild(playerStatus);
    });
}

function updateBoardTokens() {
    // Clear existing tokens
    document.querySelectorAll('.token').forEach(t => t.remove());

    gameState.players.forEach(player => {
        if (player.isBankrupt) return;
        const token = document.createElement('div');
        token.className = `token p${player.id}`;
        
        // If in jail, use special positioning
        if (player.inJail) {
            token.classList.add('in-jail-position');
        }

        const currentSpaceEl = document.getElementById(gameState.properties[player.position].id);
        if (currentSpaceEl) {
            currentSpaceEl.appendChild(token);
        }
    });
}

// NEW: Function to update visual state of properties on the board (owner, mortgaged)
function updateBoardOwnership() {
    gameState.properties.forEach(prop => {
        const spaceEl = document.getElementById(prop.id);
        if (!spaceEl) return;
        
        const ownerEl = spaceEl.querySelector('.space-owner');
        if (ownerEl) {
            if (prop.owner !== null) {
                ownerEl.textContent = `Owner: ${gameState.players[prop.owner].name}`;
                ownerEl.style.color = ['red', 'blue', 'green', 'gold', 'purple', 'orange'][prop.owner];
            } else {
                ownerEl.textContent = '';
            }
        }
        
        // ENHANCEMENT: Add/remove 'mortgaged' class for visual indicator
        if (prop.isMortgaged) {
            spaceEl.classList.add('mortgaged');
        } else {
            spaceEl.classList.remove('mortgaged');
        }
    });
}


function updateControls() {
    const player = getCurrentPlayer();
    
    currentPlayerDisplay.textContent = `Current Player: ${player.name}'s Turn`;
    
    rollDiceBtn.disabled = gameState.turnHasRolled;
    endTurnBtn.disabled = !gameState.turnHasRolled || (gameState.doublesCount > 0 && gameState.doublesCount < 3);

    // If player is in jail
    if (player.inJail) {
        rollDiceBtn.textContent = 'Roll for Doubles';
        endTurnBtn.disabled = true; // Can't end turn until roll/pay
        jailActions.style.display = 'block';
        payBailBtn.disabled = player.money < 50;
    } else {
        rollDiceBtn.textContent = 'Roll Dice';
        jailActions.style.display = 'none';
    }

    // Hide buy button by default
    propertyActions.style.display = 'none';
    buyPropertyBtn.style.display = 'none';

    // Show buy button if on unowned property
    const currentProperty = gameState.properties[player.position];
    if (['property', 'railroad', 'utility'].includes(currentProperty.type) && currentProperty.owner === null) {
        propertyActions.style.display = 'block';
        buyPropertyBtn.style.display = 'block';
        buyPropertyBtn.disabled = player.money < currentProperty.price;
    }
}


function logMessage(message) {
    const msgDiv = document.createElement('div');
    msgDiv.textContent = message;
    messageLog.appendChild(msgDiv);
    messageLog.scrollTop = messageLog.scrollHeight; // Auto-scroll
}

// --- GAME FLOW --- //

function startTurn() {
    const player = getCurrentPlayer();
    if (player.isBankrupt) {
        endTurn();
        return;
    }
    
    logMessage(`--- It's ${player.name}'s turn. ---`);
    gameState.turnHasRolled = false;
    gameState.doublesCount = 0; // NEW: Reset doubles count at start of turn
    updateUI();
}

function rollDice() {
    gameState.turnHasRolled = true;
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const total = die1 + die2;
    const isDoubles = die1 === die2;
    
    diceDisplay.textContent = `Dice: ${die1} + ${die2} = ${total}`;
    logMessage(`${getCurrentPlayer().name} rolled a ${total} (${die1} & ${die2}).`);

    // --- ENHANCEMENT: DOUBLES LOGIC --- //
    if (isDoubles) {
        gameState.doublesCount++;
        logMessage(`It's doubles! That's ${gameState.doublesCount} in a row.`);
    } else {
        gameState.doublesCount = 0; // Reset if not doubles
    }

    const player = getCurrentPlayer();

    // Check for 3 doubles in a row -> Go to Jail
    if (gameState.doublesCount === 3) {
        logMessage("Three doubles in a row! Go to Detention!");
        goToJail(player);
        endTurn(); // Turn ends immediately
        return;
    }
    
    // Handle being in Jail
    if (player.inJail) {
        if (isDoubles) {
            logMessage("Doubles! You're out of Detention.");
            player.inJail = false;
            player.jailTurns = 0;
            movePlayer(total);
        } else {
            logMessage("No doubles. You remain in Detention.");
            player.jailTurns++;
            if (player.jailTurns >= 3) {
                logMessage("Third attempt failed. You must pay the bail.");
                payBail();
            }
            endTurn(); // Turn ends
        }
        return;
    }

    // Normal move
    movePlayer(total);
    
    // If player rolled doubles, they get to go again
    if (isDoubles) {
        logMessage(`${player.name} gets to roll again.`);
        gameState.turnHasRolled = false; // Allow another roll
    }

    updateUI();
}

function movePlayer(steps) {
    const player = getCurrentPlayer();
    const oldPosition = player.position;
    player.position = (player.position + steps) % 40;
    
    logMessage(`${player.name} moved from ${gameState.properties[oldPosition].name} to ${gameState.properties[player.position].name}.`);

    // Pass GO
    if (player.position < oldPosition) {
        logMessage(`${player.name} passed GO and collected ₡200.`);
        player.money += 200;
    }

    updateBoardTokens();
    handleSpaceLanding();
}

function handleSpaceLanding() {
    const player = getCurrentPlayer();
    const property = gameState.properties[player.position];

    // Placeholder for landing logic (buy, pay rent, etc.)
    switch (property.type) {
        case 'go-to-jail':
            logMessage("Landed on 'Go To Detention'. Uh oh.");
            goToJail(player);
            break;
        // Other cases (tax, chance, property) would go here
    }

    updateUI();
}

function endTurn() {
    if (gameState.doublesCount > 0 && gameState.doublesCount < 3) {
        logMessage("You rolled doubles, so you must roll again.");
        return;
    }
    
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    startTurn();
}

function goToJail(player) {
    player.position = 10; // The index of the Jail space
    player.inJail = true;
    player.jailTurns = 0;
    logMessage(`${player.name} has been sent to the Detention Block.`);
    updateUI();
}

function payBail() {
    const player = getCurrentPlayer();
    if (player.money >= 50) {
        player.money -= 50;
        player.inJail = false;
        player.jailTurns = 0;
        logMessage(`${player.name} paid ₡50 bail and is now free.`);
    } else {
        logMessage(`${player.name} cannot afford the bail!`);
        // Here you would implement logic for bankruptcy if they can't raise funds
    }
    updateUI();
}

// --- UTILITY FUNCTIONS --- //
function getCurrentPlayer() {
    return gameState.players[gameState.currentPlayerIndex];
}

// --- INITIALIZE --- //
document.addEventListener('DOMContentLoaded', initializeSetup);

// --- EVENT LISTENERS for game actions --- //
rollDiceBtn.addEventListener('click', rollDice);
endTurnBtn.addEventListener('click', endTurn);
payBailBtn.addEventListener('click', payBail);
buyPropertyBtn.addEventListener('click', () => {
    const player = getCurrentPlayer();
    const property = gameState.properties[player.position];
    if (player.money >= property.price) {
        player.money -= property.price;
        property.owner = player.id;
        player.properties.push(property.boardIndex);
        logMessage(`${player.name} bought ${property.name} for ₡${property.price}.`);
        updateUI();
    }
});
// A mock mortgage function to demonstrate the visual change
mortgagePropertyBtn.addEventListener('click', () => {
    // This is a placeholder. In a real game, you'd select a property.
    // We'll just mortgage the first property the player owns.
    const player = getCurrentPlayer();
    const propIndex = player.properties[0];
    if (propIndex !== undefined) {
       const prop = gameState.properties[propIndex];
       if (!prop.isMortgaged) {
           prop.isMortgaged = true;
           player.money += prop.price / 2;
           logMessage(`${player.name} mortgaged ${prop.name} for ₡${prop.price / 2}`);
           updateUI();
       }
    }
});