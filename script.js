// --- Game Data ---
const board = [
    { id: 0, name: "START", type: "start" },
    { id: 1, name: "Tatooine Homestead", type: "location", colorGroup: "brown", price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, owner: null, houses: 0, mortgaged: false },
    { id: 2, name: "Supply Drop", type: "supply_drop" },
    { id: 3, name: "Jawa Sandcrawler", type: "location", colorGroup: "brown", price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, owner: null, houses: 0, mortgaged: false },
    { id: 4, name: "Imperial Tax", type: "tax", amount: 200 },
    { id: 5, name: "Hyperspace Lane 1", type: "hyperspace_lane", price: 200, rent: [25,50,100,200], owner: null, mortgaged: false },
    { id: 6, name: "Mos Eisley Cantina", type: "location", colorGroup: "light-blue", price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, owner: null, houses: 0, mortgaged: false },
    { id: 7, name: "Force Card", type: "force_card" },
    { id: 8, name: "Dex's Diner", type: "location", colorGroup: "light-blue", price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, owner: null, houses: 0, mortgaged: false },
    { id: 9, name: "Otoh Gunga", type: "location", colorGroup: "light-blue", price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, owner: null, houses: 0, mortgaged: false },
    { id: 10, name: "Detention Block / Just Visiting", type: "detention_block" },
    { id: 11, name: "Cloud City", type: "location", colorGroup: "pink", price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, owner: null, houses: 0, mortgaged: false },
    { id: 12, name: "Power Generator", type: "facility", price: 150, owner: null, mortgaged: false },
    { id: 13, name: "Bespin Platforms", type: "location", colorGroup: "pink", price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, owner: null, houses: 0, mortgaged: false },
    { id: 14, name: "Carbon-Freezing Chamber", type: "location", colorGroup: "pink", price: 160, rent: [12, 60, 180, 500, 700, 800], houseCost: 100, owner: null, houses: 0, mortgaged: false },
    { id: 15, name: "Hyperspace Lane 2", type: "hyperspace_lane", price: 200, rent: [25,50,100,200], owner: null, mortgaged: false },
    { id: 16, name: "Dagobah Swamp", type: "location", colorGroup: "orange", price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, owner: null, houses: 0, mortgaged: false },
    { id: 17, name: "Supply Drop", type: "supply_drop" },
    { id: 18, name: "Yoda's Hut", type: "location", colorGroup: "orange", price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, owner: null, houses: 0, mortgaged: false },
    { id: 19, name: "Jedi Temple", type: "location", colorGroup: "orange", price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, owner: null, houses: 0, mortgaged: false },
    { id: 20, name: "Smuggler's Hideout", type: "smugglers_hideout" },
    { id: 21, name: "Mustafar Volcano", type: "location", colorGroup: "red", price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, owner: null, houses: 0, mortgaged: false },
    { id: 22, name: "Force Card", type: "force_card" },
    { id: 23, name: "Death Star Core", type: "location", colorGroup: "red", price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, owner: null, houses: 0, mortgaged: false },
    { id: 24, name: "Starkiller Base", type: "location", colorGroup: "red", price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, owner: null, houses: 0, mortgaged: false },
    { id: 25, name: "Hyperspace Lane 3", type: "hyperspace_lane", price: 200, rent: [25,50,100,200], owner: null, mortgaged: false },
    { id: 26, name: "Coruscant Underworld", type: "location", colorGroup: "yellow", price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, owner: null, houses: 0, mortgaged: false },
    { id: 27, name: "Galactic Senate Building", type: "location", colorGroup: "yellow", price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, owner: null, houses: 0, mortgaged: false },
    { id: 28, name: "Hydroponics Farm", type: "facility", price: 150, owner: null, mortgaged: false },
    { id: 29, name: "Imperial Palace", type: "location", colorGroup: "yellow", price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, owner: null, houses: 0, mortgaged: false },
    { id: 30, name: "Send to Detention Block", type: "send_to_detention" },
    { id: 31, name: "Endor Forest", type: "location", colorGroup: "green", price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, owner: null, houses: 0, mortgaged: false },
    { id: 32, name: "Ewok Village", type: "location", colorGroup: "green", price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, owner: null, houses: 0, mortgaged: false },
    { id: 33, name: "Supply Drop", type: "supply_drop" },
    { id: 34, name: "Falcon's Hangar", type: "location", colorGroup: "green", price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, owner: null, houses: 0, mortgaged: false },
    { id: 35, name: "Hyperspace Lane 4", type: "hyperspace_lane", price: 200, rent: [25,50,100,200], owner: null, mortgaged: false },
    { id: 36, name: "Force Card", type: "force_card" },
    { id: 37, name: "Alderaan Citadel", type: "location", colorGroup: "dark-blue", price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, owner: null, houses: 0, mortgaged: false },
    { id: 38, name: "Republic Tax", type: "tax", amount: 100 },
    { id: 39, name: "Death Star Throne Room", type: "location", colorGroup: "dark-blue", price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, owner: null, houses: 0, mortgaged: false }
];

let chanceCards = [
    "Advance to START (Collect ₡200)",
    "Advance to Starkiller Base. If you pass START, collect ₡200.",
    "Advance to Cloud City. If you pass START, collect ₡200.",
    "Advance to nearest Facility. If unowned, you may buy it from the Bank. If owned, pay owner 10 times amount shown on dice.",
    "Advance to nearest Hyperspace Lane. If unowned, you may buy it from the Bank. If owned, pay owner twice the rental to which he/she is otherwise entitled.",
    "Bank pays you dividend of ₡50",
    "Get Out of Detention Free Card",
    "Go back 3 spaces",
    "Go to Detention Block – Go directly to Detention Block – Do not pass START, do not collect ₡200",
    "Make general repairs on all your holdings. For each Dwelling pay ₡25. For each Fortress pay ₡100.",
    "Pay poor tax of ₡15",
    "Take a trip to Hyperspace Lane 1. If you pass START, collect ₡200.",
    "Advance to Death Star Throne Room.",
    "You have been elected Chairman of the Galactic Senate – Pay each player ₡50.",
    "Your loan matures. Collect ₡150",
    "You have won a droid race competition. Collect ₡100"
];

let communityChestCards = [
    "Advance to START (Collect ₡200)",
    "Bank error in your favor – Collect ₡200",
    "Healer's fee – Pay ₡50",
    "From sale of stolen goods you get ₡45.",
    "Get Out of Detention Free Card",
    "Go to Detention Block – Go directly to Detention Block – Do not pass START, do not collect ₡200",
    "Rebel Fund matures. Receive ₡100.",
    "Tax refund – Collect ₡20",
    "It is your birth-cycle. Collect ₡10 from each player.",
    "Life insurance matures – Collect ₡100",
    "Pay medical bay ₡100",
    "Pay training fees of ₡50",
    "Receive ₡25 bounty fee",
    "You are assessed for orbital repairs – Pay ₡40 per Dwelling, ₡115 per Fortress",
    "You have won second prize in a beauty contest – Collect ₡10",
    "Inherit ₡100"
];

// --- Game State Variables ---
let players = [];
let currentPlayerIndex = 0;
let diceRoll = [0, 0];
let doublesCount = 0;
let gameOver = false;
let currentActionPending = null; // 'buy', 'manage', 'jail', 'none' (meaning turn over)

let chanceCardsShuffled = [];
let communityChestCardsShuffled = [];

// --- Auction State Variables ---
let isAuctionActive = false;
let auctionPropertyId = null;
let auctionBidders = [];
let currentBid = 0;
let highestBidderId = null;
let auctionCurrentBidderIndex = 0;

// --- Trade State Variables ---
let isTradeActive = false;
let tradePartnerId = null;
let tradeOffer = {};
let tradeRequest = {};


// --- DOM Elements ---
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const numPlayersInput = document.getElementById('num-players');
const playerNameInputsDiv = document.getElementById('player-name-inputs');
const startGameBtn = document.getElementById('start-game-btn');
const gameBoardDiv = document.getElementById('game-board');
const currentPlayerDisplay = document.getElementById('current-player-display');
const diceDisplay = document.getElementById('dice-display');
const rollDiceBtn = document.getElementById('roll-dice-btn');
const endTurnBtn = document.getElementById('end-turn-btn');
const messageLog = document.getElementById('message-log');
const playerListContainer = document.getElementById('player-list-container');

// Property action buttons/selects
const propertyActionsDiv = document.getElementById('property-actions');
const buyPropertyBtn = document.getElementById('buy-property-btn');
const buildHouseBtn = document.getElementById('build-house-btn');
const mortgageSelect = document.getElementById('mortgage-select');
const mortgagePropertyBtn = document.getElementById('mortgage-property-btn');
const unmortgageSelect = document.getElementById('unmortgage-select');
const unmortgagePropertyBtn = document.getElementById('unmortgage-property-btn');
const sellHouseSelect = document.getElementById('sell-house-select');
const sellHouseBtn = document.getElementById('sell-house-btn');

// Jail action buttons
const jailActionsDiv = document.getElementById('jail-actions');
const payBailBtn = document.getElementById('pay-bail-btn');
const useJailCardBtn = document.getElementById('use-jail-card-btn');

// --- New DOM Elements for Debugging ---
const debugControlsDiv = document.getElementById('debug-controls');
const toggleDebugBtn = document.getElementById('toggle-debug-btn');

// Move Player
const debugMovePlayerSelect = document.getElementById('debug-move-player-select');
const debugMoveSpaceSelect = document.getElementById('debug-move-space-select');
const debugMoveBtn = document.getElementById('debug-move-btn');

// Simulate Dice Roll
const debugDie1Input = document.getElementById('debug-die1');
const debugDie2Input = document.getElementById('debug-die2');
const debugRollBtn = document.getElementById('debug-roll-btn');

// Change Ownership
const debugPropertySelect = document.getElementById('debug-property-select');
const debugOwnerSelect = document.getElementById('debug-owner-select');
const debugChangeOwnerBtn = document.getElementById('debug-change-owner-btn');

// Manage Houses/Hotels
const debugHousePropertySelect = document.getElementById('debug-house-property-select');
const debugHouseCountInput = document.getElementById('debug-house-count');
const debugSetHousesBtn = document.getElementById('debug-set-houses-btn');

// Manage Player Money
const debugMoneyPlayerSelect = document.getElementById('debug-money-player-select');
const debugMoneyAmountInput = document.getElementById('debug-money-amount');
const debugSetMoneyBtn = document.getElementById('debug-set-money-btn');

// Put Player in Jail
const debugJailPlayerSelect = document.getElementById('debug-jail-player-select');
const debugSendToJailBtn = document.getElementById('debug-send-to-jail-btn');

// --- Property Info Modal Elements ---
const propertyModalOverlay = document.getElementById('property-modal-overlay');
const propertyModalCloseBtn = document.getElementById('property-modal-close');
const modalPropertyName = document.getElementById('modal-property-name');
const modalPropertyColorBar = document.getElementById('modal-property-color-bar');
const modalPropertyType = document.getElementById('modal-property-type');
const modalPropertyPrice = document.getElementById('modal-property-price');
const modalPropertyOwner = document.getElementById('modal-property-owner');
const modalPropertyMortgaged = document.getElementById('modal-property-mortgaged');
const modalPropertyHousesRow = document.getElementById('modal-property-houses-row');
const modalPropertyHouses = document.getElementById('modal-property-houses');
const modalPropertyHouseCostRow = document.getElementById('modal-property-house-cost-row');
const modalPropertyHouseCost = document.getElementById('modal-property-house-cost');
const modalPropertyMortgageValue = document.getElementById('modal-property-mortgage-value');
const modalPropertyRentList = document.getElementById('modal-property-rent-list');

// --- Auction Modal Elements ---
const auctionModalOverlay = document.getElementById('auction-modal-overlay');
const auctionPropertyName = document.getElementById('auction-property-name');
const auctionCurrentBid = document.getElementById('auction-current-bid');
const auctionHighestBidder = document.getElementById('auction-highest-bidder');
const auctionCurrentBidder = document.getElementById('auction-current-bidder');
const auctionBidAmountInput = document.getElementById('auction-bid-amount');
const auctionPlaceBidBtn = document.getElementById('auction-place-bid-btn');
const auctionWithdrawBtn = document.getElementById('auction-withdraw-btn');

// --- Trade Modal Elements ---
const proposeTradeBtn = document.getElementById('propose-trade-btn');
const tradeModalOverlay = document.getElementById('trade-modal-overlay');
const tradePartnerSelect = document.getElementById('trade-partner-select');
const tradeOfferMoney = document.getElementById('trade-offer-money');
const tradeOfferProperties = document.getElementById('trade-offer-properties');
const tradeOfferCards = document.getElementById('trade-offer-cards');
const tradeRequestMoney = document.getElementById('trade-request-money');
const tradeRequestProperties = document.getElementById('trade-request-properties');
const tradeRequestCards = document.getElementById('trade-request-cards');
const sendProposalBtn = document.getElementById('send-proposal-btn');
const cancelTradeBtn = document.getElementById('cancel-trade-btn');
const tradeMessageArea = document.getElementById('trade-message-area');

// --- Trade Review Modal Elements ---
const tradeReviewModalOverlay = document.getElementById('trade-review-modal-overlay');
const reviewProposerName = document.getElementById('review-proposer-name');
const reviewPartnerName = document.getElementById('review-partner-name');
const reviewOfferMoney = document.getElementById('review-offer-money');
const reviewOfferCards = document.getElementById('review-offer-cards');
const reviewOfferProperties = document.getElementById('review-offer-properties');
const reviewRequestMoney = document.getElementById('review-request-money');
const reviewRequestCards = document.getElementById('review-request-cards');
const reviewRequestProperties = document.getElementById('review-request-properties');
const acceptTradeBtn = document.getElementById('accept-trade-btn');
const rejectTradeBtn = document.getElementById('reject-trade-btn');


// --- Utility Functions ---
function logMessage(message, type = 'info') {
    const div = document.createElement('div');
    div.textContent = message;
    div.className = type;
    messageLog.prepend(div); // Add to top
    if (messageLog.children.length > 50) { // Keep log from getting too long
        messageLog.removeChild(messageLog.lastChild);
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function updatePlayerInfo() {
    playerListContainer.innerHTML = '';
    players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = `player-status ${index === currentPlayerIndex ? 'current' : ''}`;
        playerDiv.innerHTML = `
            <h4>${player.name} (P${player.id + 1})</h4>
            <ul>
                <li>Credits: ₡${player.money}</li>
                <li>Location: ${board[player.position].name}</li>
                ${player.inJail ? `<li><span style="color:red;">In Detention Block (Turn ${player.jailTurns}/3)</span></li>` : ''}
                ${player.getOutOfJailFreeCards > 0 ? `<li>Get Out of Detention Free Cards: ${player.getOutOfJailFreeCards}</li>` : ''}
                <li>Holdings: ${player.properties.map(pId => board[pId].name + (board[pId].mortgaged ? ' (M)' : '') + (board[pId].houses > 0 ? ` (D:${board[pId].houses})` : '')).join(', ') || 'None'}</li>
            </ul>
        `;
        playerListContainer.appendChild(playerDiv);
    });
    currentPlayerDisplay.textContent = `Current Player: ${players[currentPlayerIndex].name}`;
}

function updateBoardUI() {
    // Remove existing tokens
    document.querySelectorAll('.token').forEach(token => token.remove());

    // Add tokens
    players.forEach(player => {
        const spaceDiv = document.getElementById(`space-${player.position}`);
        if (spaceDiv) {
            const token = document.createElement('div');
            token.className = `token p${player.id}`;
            // Add 'in-jail-position' class if player is in jail and on the jail space
            if (player.position === 10 && player.inJail) { // Detention Block space is still ID 10
                token.classList.add('in-jail-position'); // For positioning in the corner
            }
            spaceDiv.appendChild(token);
        }
    });

    // Update owner and houses on properties
    board.forEach(space => {
        // Check for tradable types using the new names
        if (['location', 'hyperspace_lane', 'facility'].includes(space.type)) {
            const spaceDiv = document.getElementById(`space-${space.id}`);
            if (spaceDiv) {
                let ownerSpan = spaceDiv.querySelector('.space-owner');
                if (!ownerSpan) {
                    ownerSpan = document.createElement('div');
                    ownerSpan.className = 'space-owner';
                    spaceDiv.appendChild(ownerSpan);
                }
                if (space.owner !== null) {
                    ownerSpan.textContent = `Owner: ${players[space.owner].name}`;
                    ownerSpan.style.color = space.mortgaged ? 'red' : 'green';
                } else {
                    ownerSpan.textContent = '';
                }

                // Only 'location' type properties can have houses (dwellings/fortresses)
                if (space.type === 'location') {
                    let housesSpan = spaceDiv.querySelector('.space-houses');
                    if (!housesSpan) {
                        housesSpan = document.createElement('div');
                        housesSpan.className = 'space-houses';
                        spaceDiv.appendChild(housesSpan);
                    }
                    housesSpan.textContent = space.houses > 0 ? 'D: ' + space.houses : '';
                }
            }
        }
    });
}

function getPropertiesByColor(colorGroup) {
    return board.filter(space => space.type === 'location' && space.colorGroup === colorGroup);
}

// Renamed from getRailroads
function getHyperspaceLanes() {
    return board.filter(space => space.type === 'hyperspace_lane');
}

// Renamed from getUtilities
function getFacilities() {
    return board.filter(space => space.type === 'facility');
}

function checkMonopoly(player, colorGroup) {
    const propertiesInGroup = getPropertiesByColor(colorGroup);
    return propertiesInGroup.every(prop => prop.owner === player.id);
}

function getPlayerOwnedProperties(player, type = null) {
    return board.filter(space => space.owner === player.id && (type ? ['location', 'hyperspace_lane', 'facility'].includes(space.type) : true));
}

// Helper function to find the next space of a given type, wrapping around the board
function findNextSpaceType(startPosition, type) {
    for (let i = 1; i <= board.length; i++) { // Iterate up to board.length to ensure wrapping
        const targetIndex = (startPosition + i) % board.length;
        const space = board[targetIndex];
        if (space.type === type) {
            return space; // Return the first space of the specified type found after startPosition
        }
    }
    return null; // Should not happen for Facilities/Hyperspace Lanes as they always exist
}

// Helper function to calculate facility rent based on dice roll and owner's facility count
function calculateFacilityRent(owner, diceSum) {
    const ownedFacilities = getPlayerOwnedProperties(owner, 'facility').filter(u => !u.mortgaged).length;
    if (ownedFacilities === 1) {
        return diceSum * 4;
    } else if (ownedFacilities === 2) {
        return diceSum * 10;
    }
    return 0;
}

// Helper function to calculate hyperspace lane rent based on owner's hyperspace lane count
function calculateHyperspaceLaneRent(owner, laneSpace) {
    const ownedHyperspaceLanes = getPlayerOwnedProperties(owner, 'hyperspace_lane').filter(r => !r.mortgaged).length;
    if (ownedHyperspaceLanes > 0 && ownedHyperspaceLanes <= laneSpace.rent.length) {
        return laneSpace.rent[ownedHyperspaceLanes - 1];
    }
    return 0;
}

// --- Game Logic ---

function startGame() {
    const numPlayers = parseInt(numPlayersInput.value);
    players = [];
    for (let i = 0; i < numPlayers; i++) {
        const nameInput = document.getElementById(`player-name-${i}`);
        players.push({
            id: i,
            name: nameInput.value || `Player ${i + 1}`,
            money: 1500, // Starting credits
            position: 0,
            properties: [],
            inJail: false, // Refers to Detention Block
            jailTurns: 0,
            doublesRolledThisTurn: 0,
            hasRolled: false,
            getOutOfJailFreeCards: 0 // Get Out of Detention Free Cards
        });
    }

    // Shuffle chance and community chest cards (shallow copy to keep originals)
    chanceCardsShuffled = shuffleArray([...chanceCards]);
    communityChestCardsShuffled = shuffleArray([...communityChestCards]);

    setupScreen.style.display = 'none';
    gameScreen.style.display = 'block';

    createBoardUI();
    updatePlayerInfo();
    updateBoardUI();
    logMessage("Game Started!", "success");
    logMessage(`It's ${players[currentPlayerIndex].name}'s turn.`);
    setControlsForTurnStart();
    refreshDebugControls(); // Populate debug dropdowns after players are initialized
}

function createBoardUI() {
    gameBoardDiv.innerHTML = ''; // Clear existing board
    // The CSS grid-area properties are manually defined and assume the `board` array order.
    // This loop just creates the divs for each board space
    board.forEach((space, index) => {
        const spaceDiv = document.createElement('div');
        spaceDiv.id = `space-${space.id}`;
        spaceDiv.classList.add('board-space');
        spaceDiv.dataset.spaceId = space.id; // Add data-id for click handling
        if ([0, 10, 20, 30].includes(space.id)) { // Start, Detention Block, Smuggler's Hideout, Send to Detention Block
            spaceDiv.classList.add('corner');
        }
        // Assign grid positions based on typical Monopoly board layout
        if (space.id >= 0 && space.id <= 10) { // Bottom row
            spaceDiv.style.gridArea = `11 / ${11 - space.id}`;
        } else if (space.id >= 11 && space.id <= 19) { // Left column
            spaceDiv.style.gridArea = `${11 - (space.id - 10)} / 1`;
        } else if (space.id >= 20 && space.id <= 30) { // Top row
            spaceDiv.style.gridArea = `1 / ${space.id - 19}`;
        } else if (space.id >= 31 && space.id <= 39) { // Right column
            spaceDiv.style.gridArea = `${(space.id - 29)} / 11`;
        }

        // Add color bar for 'location' properties
        if (space.type === 'location' || space.type === 'hyperspace_lane' || space.type === 'facility') {
            const colorBar = document.createElement('div');
            colorBar.className = `property-color-bar ${space.colorGroup || ''}`; // Use colorGroup for locations, empty for others
            spaceDiv.appendChild(colorBar);
        }

        const nameDiv = document.createElement('div');
        nameDiv.className = 'space-name';
        nameDiv.textContent = space.name;
        spaceDiv.appendChild(nameDiv);

        if (space.price) { // Only show price for buyable spaces
            const priceDiv = document.createElement('div');
            priceDiv.className = 'space-price';
            priceDiv.textContent = `₡${space.price}`;
            spaceDiv.appendChild(priceDiv);
        }
        gameBoardDiv.appendChild(spaceDiv);
    });
}


function rollDice(simulatedDie1 = null, simulatedDie2 = null) {
    if (isAuctionActive || isTradeActive) return; // Do not allow rolling during an auction or trade
    const die1 = simulatedDie1 !== null ? simulatedDie1 : Math.floor(Math.random() * 6) + 1;
    const die2 = simulatedDie2 !== null ? simulatedDie2 : Math.floor(Math.random() * 6) + 1;
    
    diceRoll = [die1, die2];
    diceDisplay.textContent = `Dice: ${die1}, ${die2}`;
    logMessage(`${players[currentPlayerIndex].name} rolled a ${die1} and a ${die2} (total ${die1 + die2}).`);

    const player = players[currentPlayerIndex];
    player.hasRolled = true; // Mark that player has rolled this turn

    // Check for doubles
    if (die1 === die2) {
        player.doublesRolledThisTurn++;
        logMessage(`${player.name} rolled doubles!`, 'warning');
        if (player.doublesRolledThisTurn === 3) {
            logMessage(`${player.name} rolled 3 consecutive doubles! Go directly to Detention Block!`, 'error');
            sendToJail(player); // sendToJail also handles setting controls
            player.doublesRolledThisTurn = 0; // Reset doubles count
            return;
        }
    } else {
        player.doublesRolledThisTurn = 0; // Reset doubles if not doubles
    }

    if (player.inJail) { // Player in Detention Block
        handleJailRoll(player, die1, die2);
    } else {
        movePlayer(player, die1 + die2);
    }
}

function movePlayer(player, steps) {
    const oldPosition = player.position;
    player.position = (player.position + steps) % board.length;
    logMessage(`${player.name} moved from ${board[oldPosition].name} to ${board[player.position].name}.`);

    // Check for passing START (Go)
    if (player.position < oldPosition && !player.inJail) { // If went past index 0
        player.money += 200;
        logMessage(`${player.name} passed START and collected ₡200!`);
    }
    updatePlayerInfo();
    updateBoardUI();
    landOnSpace(player);
}

// Renamed from sendToJail
function sendToJail(player) {
    player.position = 10; // Detention Block space ID
    player.inJail = true;
    player.jailTurns = 0; // Reset turns in Detention Block for new entry
    logMessage(`${player.name} is now in the Detention Block!`);
    updatePlayerInfo();
    updateBoardUI();
    currentActionPending = 'none'; // Turn ends immediately
    setControls();
}

// Renamed from handleJailRoll
function handleJailRoll(player, die1, die2) {
    if (die1 === die2) {
        logMessage(`${player.name} rolled doubles (${die1}, ${die2}) and got out of the Detention Block!`, 'success');
        player.inJail = false;
        player.jailTurns = 0;
        movePlayer(player, die1 + die2); // Move out of Detention Block
    } else {
        player.jailTurns++;
        logMessage(`${player.name} rolled ${die1}, ${die2}. Still in Detention Block. Turns left: ${3 - player.jailTurns}.`);

        if (player.jailTurns === 3 && player.money < 50 && player.getOutOfJailFreeCards === 0) {
            logMessage(`${player.name} cannot pay bail or use a card and is bankrupt!`, 'error');
            handleBankruptcy(player, 'bank', 50); // Debt is 50 for bail
        }
        currentActionPending = 'none'; // Turn ends after rolling in Detention Block (unless doubles)
        setControls(); // Update controls based on currentActionPending
    }
}


function landOnSpace(player) {
    const space = board[player.position];
    logMessage(`${player.name} landed on ${space.name}.`);

    currentActionPending = 'none'; // Default to turn ending, will be overridden if action is needed

    switch (space.type) {
        case 'location': // Renamed from 'property'
        case 'hyperspace_lane': // Renamed from 'railroad'
        case 'facility': // Renamed from 'utility'
            if (space.owner === null) {
                // Holding is unowned
                logMessage(`${space.name} is unowned. Price: ₡${space.price}.`);
                if (player.money >= space.price) {
                    currentActionPending = 'buy';
                } else {
                    logMessage(`${player.name} cannot afford ${space.name}. Auctioning...`, 'warning');
                    startAuction(space.id);
                    return; // Exit landOnSpace early as auction handles the flow now
                }
            } else if (space.owner !== player.id) {
                // Holding is owned by another player
                const owner = players[space.owner];
                if (space.mortgaged) {
                    logMessage(`${space.name} is mortgaged by ${owner.name}. No rent.`, 'info');
                } else {
                    let rent = 0;
                    if (space.type === 'location') {
                        rent = space.rent[space.houses];
                        if (space.houses === 0 && checkMonopoly(owner, space.colorGroup)) {
                            rent *= 2; // Double rent if monopoly owned and no dwellings
                            logMessage(`Rent is doubled as ${owner.name} holds the full ${space.colorGroup} sector.`);
                        }
                    } else if (space.type === 'hyperspace_lane') {
                        const ownedLanes = getPlayerOwnedProperties(owner, 'hyperspace_lane').filter(r => !r.mortgaged).length;
                        rent = space.rent[ownedLanes - 1]; // Use predefined rent array for hyperspace lanes
                    } else if (space.type === 'facility') {
                        const ownedFacilities = getPlayerOwnedProperties(owner, 'facility').filter(u => !u.mortgaged).length;
                        if (ownedFacilities === 1) {
                            rent = (diceRoll[0] + diceRoll[1]) * 4;
                        } else if (ownedFacilities === 2) {
                            rent = (diceRoll[0] + diceRoll[1]) * 10;
                        }
                    }
                    logMessage(`${space.name} is owned by ${owner.name}. Rent: ₡${rent}.`);
                    payMoney(player, owner, rent);
                }
                currentActionPending = 'none'; // After paying rent, turn ends
            } else {
                // Holding is owned by current player
                logMessage(`${player.name} owns ${space.name}.`);
                currentActionPending = 'manage'; // Player can choose to build/mortgage
            }
            break;
        case 'tax':
            logMessage(`${player.name} landed on ${space.name} and must pay ₡${space.amount}.`);
            payMoney(player, 'bank', space.amount);
            currentActionPending = 'none';
            break;
        case 'force_card': // Renamed from 'chance'
            drawCard(player, chanceCardsShuffled);
            // currentActionPending will be set by drawCard based on if player moved or not
            break;
        case 'supply_drop': // Renamed from 'community_chest'
            drawCard(player, communityChestCardsShuffled);
            // currentActionPending will be set by drawCard based on if player moved or not
            break;
        case 'send_to_detention': // Renamed from 'gotojail'
            sendToJail(player); // sendToJail already handles setting controls
            break;
        case 'detention_block': // Renamed from 'jail' (Just Visiting)
            logMessage(`${player.name} is just visiting the Detention Block.`, 'info');
            currentActionPending = 'none'; // No action for just visiting, turn ends
            break;
        case 'start': // Renamed from 'go'
        case 'smugglers_hideout': // Renamed from 'freeparking'
            logMessage(`${player.name} is on ${space.name}. Nothing to do.`, 'info');
            currentActionPending = 'none'; // No action, turn ends
            break;
    }
    setControls(); // Update controls based on currentActionPending
}

function buyProperty(player, space) {
    if (player.money >= space.price && space.owner === null) {
        player.money -= space.price;
        space.owner = player.id;
        player.properties.push(space.id);
        logMessage(`${player.name} bought ${space.name} for ₡${space.price}.`, 'success');
        updatePlayerInfo();
        updateBoardUI();
    } else {
        logMessage(`Could not buy ${space.name}. Either not enough credits or already owned.`, 'error');
    }
    // After buying (or attempting to buy), turn ends
    currentActionPending = 'none';
    setControls();
}

function payMoney(fromPlayer, toRecipient, amount) {
    if (fromPlayer.money >= amount) {
        fromPlayer.money -= amount;
        if (toRecipient !== 'bank') {
            toRecipient.money += amount;
            logMessage(`${fromPlayer.name} paid ₡${amount} to ${toRecipient.name}.`);
        } else {
            logMessage(`${fromPlayer.name} paid ₡${amount} to the Bank.`);
        }
    } else {
        // Player cannot afford, handle bankruptcy
        logMessage(`${fromPlayer.name} cannot pay ₡${amount}! Declaring bankruptcy...`, 'error');
        handleBankruptcy(fromPlayer, toRecipient, amount);
    }
    updatePlayerInfo();
}

function handleBankruptcy(bankruptPlayer, recipient, debtAmount) {
    logMessage(`${bankruptPlayer.name} has gone bankrupt!`);
    // Sell all properties to pay debt
    bankruptPlayer.properties.sort((a,b) => board[a].price - board[b].price); // Try to sell cheapest first

    while (bankruptPlayer.money < debtAmount && bankruptPlayer.properties.length > 0) {
        const propId = bankruptPlayer.properties[0]; // Cheapest property
        const prop = board[propId];

        // Sell dwellings first if any
        while(prop.houses > 0) {
            prop.houses--;
            bankruptPlayer.money += prop.houseCost / 2;
            logMessage(`${bankruptPlayer.name} sold a Dwelling on ${prop.name} for ₡${prop.houseCost / 2}.`);
            updatePlayerInfo();
            updateBoardUI();
        }

        // Mortgage property if still in debt
        if (!prop.mortgaged) {
            prop.mortgaged = true;
            bankruptPlayer.money += prop.price / 2;
            logMessage(`${bankruptPlayer.name} mortgaged ${prop.name} for ₡${prop.price / 2}.`);
            updatePlayerInfo();
            updateBoardUI();
        } else {
            // If mortgaged and still can't pay, can't sell more from this property
            break;
        }
    }

    if (bankruptPlayer.money < debtAmount) {
        logMessage(`${bankruptPlayer.name} cannot cover the debt and is out of the game!`, 'error');
        // Transfer properties to the recipient if it's another player
        if (recipient !== 'bank' && recipient.id !== bankruptPlayer.id) {
            bankruptPlayer.properties.forEach(propId => {
                const prop = board[propId];
                prop.owner = recipient.id;
                recipient.properties.push(propId);
                prop.mortgaged = true; // Properties are transferred mortgaged
                prop.houses = 0; // Dwellings are removed upon transfer
                logMessage(`${prop.name} transferred to ${recipient.name} (mortgaged).`);
            });
        } else {
            // If bankrupt to bank or self, properties return to unowned state
            bankruptPlayer.properties.forEach(propId => {
                const prop = board[propId];
                prop.owner = null;
                prop.houses = 0;
                prop.mortgaged = false; // Reset for next owner
                logMessage(`${prop.name} returned to the bank.`);
            });
        }
        // Remove player from game
        players = players.filter(p => p.id !== bankruptPlayer.id);
        // Adjust currentPlayerIndex if current player was removed
        if (currentPlayerIndex >= players.length) {
            currentPlayerIndex = 0;
        }
        updatePlayerInfo();
        updateBoardUI();
        checkWinCondition();
    } else {
        logMessage(`${bankruptPlayer.name} managed to pay the debt after selling assets.`);
        payMoney(bankruptPlayer, recipient, debtAmount); // Re-attempt payment after assets sold
    }
}


function checkWinCondition() {
    if (players.length === 1) {
        gameOver = true;
        logMessage(`${players[0].name} is the last player standing! ${players[0].name} wins!`, 'success');
        rollDiceBtn.disabled = true;
        endTurnBtn.disabled = true;
        propertyActionsDiv.style.display = 'none';
        jailActionsDiv.style.display = 'none';
    }
}

function drawCard(player, deck) {
    const card = deck.shift(); // Take top card
    deck.push(card); // Put card at bottom of deck

    logMessage(`${player.name} drew a ${deck === chanceCardsShuffled ? 'Force Card' : 'Supply Drop'} : "${card}"`);

    let movedByCard = false; // Flag to indicate if the player was moved by this card
    let oldPosition = player.position; // Store current position for 'pass START' check

    switch (card) {
        case "Advance to START (Collect ₡200)":
            player.position = 0;
            player.money += 200;
            logMessage(`${player.name} advanced to START and collected ₡200.`);
            movedByCard = true;
            break;
        case "Advance to Starkiller Base. If you pass START, collect ₡200.":
            player.position = 24; // Starkiller Base ID
            if (player.position < oldPosition) { // Passed START
                player.money += 200;
                logMessage(`${player.name} passed START and collected ₡200!`);
            }
            logMessage(`${player.name} advanced to Starkiller Base.`);
            movedByCard = true;
            break;
        case "Advance to Cloud City. If you pass START, collect ₡200.":
            player.position = 11; // Cloud City ID
            if (player.position < oldPosition) { // Passed START
                player.money += 200;
                logMessage(`${player.name} passed START and collected ₡200!`);
            }
            logMessage(`${player.name} advanced to Cloud City.`);
            movedByCard = true;
            break;
        case "Advance to nearest Facility. If unowned, you may buy it from the Bank. If owned, pay owner 10 times amount shown on dice.":
            const nearestFacility = findNextSpaceType(oldPosition, 'facility');
            player.position = nearestFacility.id;
            if (player.position < oldPosition) { // Passed START
                player.money += 200;
                logMessage(`${player.name} passed START and collected ₡200!`);
            }
            logMessage(`${player.name} advanced to nearest Facility: ${nearestFacility.name}.`);

            if (nearestFacility.owner !== null && nearestFacility.owner !== player.id) {
                const owner = players[nearestFacility.owner];
                if (!nearestFacility.mortgaged) {
                    const rent = calculateFacilityRent(owner, diceRoll[0] + diceRoll[1]); // Use current dice roll for rent calculation
                    logMessage(`${player.name} pays ${owner.name} ₡${rent} rent for ${nearestFacility.name}.`);
                    payMoney(player, owner, rent);
                    currentActionPending = 'none'; // Rent paid, no further action needed from landOnSpace for this space
                } else {
                    logMessage(`${nearestFacility.name} is mortgaged. No rent due.`);
                    currentActionPending = 'none';
                }
            }
            movedByCard = true;
            break;
        case "Advance to nearest Hyperspace Lane. If unowned, you may buy it from the Bank. If owned, pay owner twice the rental to which he/she is otherwise entitled.":
            const nearestHyperspaceLane = findNextSpaceType(oldPosition, 'hyperspace_lane');
            player.position = nearestHyperspaceLane.id;
            if (player.position < oldPosition) { // Passed START
                player.money += 200;
                logMessage(`${player.name} passed START and collected ₡200!`);
            }
            logMessage(`${player.name} advanced to nearest Hyperspace Lane: ${nearestHyperspaceLane.name}.`);

            if (nearestHyperspaceLane.owner !== null && nearestHyperspaceLane.owner !== player.id) {
                const owner = players[nearestHyperspaceLane.owner];
                if (!nearestHyperspaceLane.mortgaged) {
                    const rent = calculateHyperspaceLaneRent(owner, nearestHyperspaceLane) * 2; // Double rent for card
                    logMessage(`${player.name} pays ${owner.name} ₡${rent} rent for ${nearestHyperspaceLane.name}.`);
                    payMoney(player, owner, rent);
                    currentActionPending = 'none'; // Rent paid, no further action needed from landOnSpace for this space
                } else {
                    logMessage(`${nearestHyperspaceLane.name} is mortgaged. No rent due.`);
                    currentActionPending = 'none';
                }
            }
            movedByCard = true;
            break;
        case "Take a trip to Hyperspace Lane 1. If you pass START, collect ₡200.":
            player.position = 5; // Hyperspace Lane 1 ID
            if (player.position < oldPosition) { // Passed START
                player.money += 200;
                logMessage(`${player.name} passed START and collected ₡200!`);
            }
            logMessage(`${player.name} advanced to Hyperspace Lane 1.`);
            movedByCard = true;
            break;
        case "Advance to Death Star Throne Room.":
            player.position = 39; // Death Star Throne Room ID
            if (player.position < oldPosition) { // Passed START
                player.money += 200;
                logMessage(`${player.name} passed START and collected ₡200!`);
            }
            logMessage(`${player.name} advanced to Death Star Throne Room.`);
            movedByCard = true;
            break;
        case "Go to Detention Block – Go directly to Detention Block – Do not pass START, do not collect ₡200":
            sendToJail(player); // sendToJail already sets controls, so movedByCard stays false
            break;
        case "Go back 3 spaces":
            player.position = (player.position - 3 + board.length) % board.length; // Ensure positive position
            logMessage(`${player.name} moved back 3 spaces to ${board[player.position].name}.`);
            movedByCard = true;
            break;
        case "Get Out of Detention Free Card":
            player.getOutOfJailFreeCards++;
            logMessage(`${player.name} received a Get Out of Detention Free Card.`);
            currentActionPending = 'none'; // No movement, turn ends
            break;
        case "Bank pays you dividend of ₡50":
            player.money += 50;
            logMessage(`${player.name} collected ₡50 dividend from the Bank.`);
            currentActionPending = 'none';
            break;
        case "Your loan matures. Collect ₡150":
            player.money += 150;
            logMessage(`${player.name} collected ₡150 from loan maturity.`);
            currentActionPending = 'none';
            break;
        case "You have won a droid race competition. Collect ₡100":
            player.money += 100;
            logMessage(`${player.name} collected ₡100 from winning a droid race competition.`);
            currentActionPending = 'none';
            break;
        case "Pay poor tax of ₡15":
            payMoney(player, 'bank', 15);
            currentActionPending = 'none';
            break;
        case "Make general repairs on all your holdings. For each Dwelling pay ₡25. For each Fortress pay ₡100.":
            let repairCostChance = 0;
            player.properties.forEach(propId => {
                const prop = board[propId]; // Make sure it's current player's property
                if (prop.type === 'location' && prop.owner === player.id) {
                    if (prop.houses < 5) { // Dwelling
                        repairCostChance += prop.houses * 25;
                    } else if (prop.houses === 5) { // Fortress
                        repairCostChance += 100;
                    }
                }
            });
            if (repairCostChance > 0) {
                logMessage(`${player.name} must pay ₡${repairCostChance} for general repairs.`);
                payMoney(player, 'bank', repairCostChance);
            } else {
                logMessage(`${player.name} has no buildings, no repair cost.`);
            }
            currentActionPending = 'none';
            break;
        case "You have been elected Chairman of the Galactic Senate – Pay each player ₡50.":
            let totalPaid = 0;
            // Filter out players who might be bankrupt before iterating.
            // This is handled by payMoney's bankruptcy check.
            players.forEach(p => {
                if (p.id !== player.id) {
                    // Pay 50 to each other player. payMoney handles bankruptcy.
                    payMoney(player, p, 50); 
                    totalPaid += 50;
                }
            });
            logMessage(`${player.name} paid ₡50 to each other player (total ₡${totalPaid}).`);
            currentActionPending = 'none';
            break;
        // Community Chest Cards
        case "Bank error in your favor – Collect ₡200":
            player.money += 200;
            logMessage(`${player.name} collected ₡200 due to a bank error.`);
            currentActionPending = 'none';
            break;
        case "Healer's fee – Pay ₡50":
            payMoney(player, 'bank', 50);
            currentActionPending = 'none';
            break;
        case "From sale of stolen goods you get ₡45.":
            player.money += 45;
            logMessage(`${player.name} collected ₡45 from stolen goods sale.`);
            currentActionPending = 'none';
            break;
        case "Rebel Fund matures. Receive ₡100.":
            player.money += 100;
            logMessage(`${player.name} received ₡100 from Rebel Fund.`);
            currentActionPending = 'none';
            break;
        case "Tax refund – Collect ₡20":
            player.money += 20;
            logMessage(`${player.name} collected ₡20 tax refund.`);
            currentActionPending = 'none';
            break;
        case "It is your birth-cycle. Collect ₡10 from each player.":
            let totalCollected = 0;
            players.forEach(p => {
                if (p.id !== player.id && p.money >= 10) { // Only pay if player can afford
                    payMoney(p, player, 10); // Each other player pays 10 to current player
                    totalCollected += 10;
                } else if (p.id !== player.id && p.money < 10) {
                    logMessage(`${p.name} cannot afford to pay ${player.name} ₡10 for birth-cycle.`, 'warning');
                    payMoney(p, player, 10); // Still attempt to pay, will trigger bankruptcy if needed
                }
            });
            logMessage(`${player.name} collected ₡10 from each other player (total ₡${totalCollected}).`);
            currentActionPending = 'none';
            break;
        case "Life insurance matures – Collect ₡100":
            player.money += 100;
            logMessage(`${player.name} collected ₡100 from life insurance maturity.`);
            currentActionPending = 'none';
            break;
        case "Pay medical bay ₡100":
            payMoney(player, 'bank', 100);
            currentActionPending = 'none';
            break;
        case "Pay training fees of ₡50":
            payMoney(player, 'bank', 50);
            currentActionPending = 'none';
            break;
        case "Receive ₡25 bounty fee":
            player.money += 25;
            logMessage(`${player.name} collected ₡25 bounty fee.`);
            currentActionPending = 'none';
            break;
        case "You are assessed for orbital repairs – Pay ₡40 per Dwelling, ₡115 per Fortress":
            let repairCostCC = 0;
            player.properties.forEach(propId => {
                const prop = board[propId]; // Already confirmed as player's property by iteration
                if (prop.type === 'location' && prop.owner === player.id) {
                    if (prop.houses < 5) { // Dwelling
                        repairCostCC += prop.houses * 40;
                    } else if (prop.houses === 5) { // Fortress
                        repairCostCC += 115;
                    }
                }
            });
            if (repairCostCC > 0) {
                logMessage(`${player.name} must pay ₡${repairCostCC} for orbital repairs.`);
                payMoney(player, 'bank', repairCostCC);
            } else {
                logMessage(`${player.name} has no buildings, no repair cost.`);
            }
            currentActionPending = 'none';
            break;
        case "You have won second prize in a beauty contest – Collect ₡10":
            player.money += 10;
            logMessage(`${player.name} collected ₡10 from beauty contest prize.`);
            currentActionPending = 'none';
            break;
        case "Inherit ₡100":
            player.money += 100;
            logMessage(`${player.name} inherited ₡100.`);
            currentActionPending = 'none';
            break;
        default:
            logMessage(`Unhandled card: "${card}".`, 'warning');
    }

    // --- IMPORTANT Unified Card Action Flow ---
    updatePlayerInfo(); // Always update UI after card action
    updateBoardUI();    // Always update UI after card action

    // Check if player is now in jail (either from card or bankruptcy from payment)
    if (player.inJail) {
        // sendToJail already called setControls and currentActionPending = 'none'
        return; // Exit as turn state is handled
    }

    // If moved by card (and not sent to jail), then land on the new space.
    if (movedByCard) {
        landOnSpace(player); // This will then set currentActionPending based on the new space
    } else {
        // If no movement, the turn typically ends after a a money/GOJF card action
        currentActionPending = 'none';
        setControls(); // Update controls for turn end
    }
    // --- End Unified Card Action Flow ---
}

// --- Property Management Actions ---

function showBuyPropertyAction(player, space) {
    propertyActionsDiv.style.display = 'flex';
    buyPropertyBtn.style.display = 'inline-block';
    buyPropertyBtn.onclick = () => buyProperty(player, space);

    // Hide other management options
    buildHouseBtn.style.display = 'none';
    mortgageSelect.style.display = 'none';
    mortgagePropertyBtn.style.display = 'none';
    unmortgageSelect.style.display = 'none';
    unmortgagePropertyBtn.style.display = 'none';
    sellHouseSelect.style.display = 'none';
    sellHouseBtn.style.display = 'none';
}

function showPropertyManagementActions(player) {
    // Hide "Buy Property" button
    buyPropertyBtn.style.display = 'none';

    // Build Dwelling (House)
    let buildableProperties = getPlayerOwnedProperties(player, 'location').filter(prop =>
        !prop.mortgaged && prop.houses < 5 && checkMonopoly(player, prop.colorGroup) &&
        player.money >= prop.houseCost
    ).sort((a,b) => a.houses - b.houses); // Sort by fewest houses for even building enforcement

    const availableToBuild = [];
    // First, find properties that are at the minimum house count within their monopoly group
    if (buildableProperties.length > 0) {
        const minHousesInAnyGroup = Math.min(...buildableProperties.map(p => p.houses));
        for (const prop of buildableProperties) {
            if (prop.houses === minHousesInAnyGroup) {
                availableToBuild.push(prop);
            }
        }
    }

    buildHouseBtn.style.display = availableToBuild.length > 0 ? 'inline-block' : 'none';
    if (availableToBuild.length > 0) {
        buildHouseBtn.onclick = () => showBuildHouseDialog(player, availableToBuild);
    }


    // Mortgage
    let mortgagableProperties = getPlayerOwnedProperties(player, 'location').filter(prop =>
        !prop.mortgaged && prop.houses === 0 // Can only mortgage if no houses
    ).concat(getPlayerOwnedProperties(player, 'hyperspace_lane').filter(prop => !prop.mortgaged))
    .concat(getPlayerOwnedProperties(player, 'facility').filter(prop => !prop.mortgaged));

    populateSelect(mortgageSelect, mortgagableProperties, 'Mortgage');
    mortgageSelect.style.display = mortgagableProperties.length > 0 ? 'block' : 'none';
    mortgagePropertyBtn.style.display = mortgagableProperties.length > 0 ? 'inline-block' : 'none';


    // Unmortgage
    let unmortgagableProperties = getPlayerOwnedProperties(player).filter(prop => prop.mortgaged && player.money >= Math.ceil(prop.price / 2 * 1.1));
    populateSelect(unmortgageSelect, unmortgagableProperties, 'Unmortgage');
    unmortgageSelect.style.display = unmortgagableProperties.length > 0 ? 'block' : 'none';
    unmortgagePropertyBtn.style.display = unmortgagableProperties.length > 0 ? 'inline-block' : 'none';

    // Sell Dwellings (Houses)
    let sellableHouseProperties = getPlayerOwnedProperties(player, 'location').filter(prop => prop.houses > 0);
    populateSelect(sellHouseSelect, sellableHouseProperties, 'Sell Dwellings');
    sellHouseSelect.style.display = sellableHouseProperties.length > 0 ? 'block' : 'none';
    sellHouseBtn.style.display = sellableHouseProperties.length > 0 ? 'inline-block' : 'none';


    // Show the whole property actions div if any button/select is visible
    propertyActionsDiv.style.display = (
        buildHouseBtn.style.display !== 'none' ||
        mortgageSelect.style.display !== 'none' ||
        unmortgageSelect.style.display !== 'none' ||
        sellHouseSelect.style.display !== 'none'
    ) ? 'flex' : 'none';
}

function populateSelect(selectElement, properties, defaultOptionText) {
    selectElement.innerHTML = `<option value="">-- ${defaultOptionText} --</option>`;
    properties.forEach(prop => {
        const option = document.createElement('option');
        option.value = prop.id;
        option.textContent = `${prop.name} ${prop.mortgaged ? '(Mortgaged)' : ''} ${prop.houses > 0 ? `(D: ${prop.houses})` : ''}`;
        // For unmortgage cost:
        if (selectElement === unmortgageSelect && prop.mortgaged) {
            option.textContent = `${prop.name} (M) - Cost: ₡${Math.ceil(prop.price / 2 * 1.1)}`;
        }
        selectElement.appendChild(option);
    });
    selectElement.onchange = () => {
        if (selectElement === mortgageSelect) mortgagePropertyBtn.disabled = !selectElement.value;
        if (selectElement === unmortgageSelect) unmortgagePropertyBtn.disabled = !selectElement.value;
        if (selectElement === sellHouseSelect) sellHouseBtn.disabled = !selectElement.value;
    };
    if (properties.length > 0) {
        selectElement.value = ''; // Reset to default option
    } else {
        selectElement.value = '';
    }
    selectElement.disabled = properties.length === 0;
    if (selectElement === mortgageSelect) mortgagePropertyBtn.disabled = true;
    if (selectElement === unmortgageSelect) unmortgagePropertyBtn.disabled = true;
    if (selectElement === sellHouseSelect) sellHouseBtn.disabled = true;
}

function showBuildHouseDialog(player, availableProperties) {
    const selectDiv = document.createElement('div');
    selectDiv.className = 'build-house-dialog';
    selectDiv.innerHTML = `
        <p>Build on:</p>
        <select id="build-house-prop-select" class="action-select"></select>
        <button id="confirm-build-btn">Build</button>
        <button id="cancel-build-btn">Cancel</button>
    `;
    const buildSelect = selectDiv.querySelector('#build-house-prop-select');
    const confirmBtn = selectDiv.querySelector('#confirm-build-btn');
    const cancelBtn = selectDiv.querySelector('#cancel-build-btn');

    buildSelect.innerHTML = `<option value="">-- Select Holding to Build On --</option>`;
    availableProperties.forEach(prop => {
        const option = document.createElement('option');
        option.value = prop.id;
        option.textContent = `${prop.name} (D: ${prop.houses}) - Cost: ₡${prop.houseCost}`;
        buildSelect.appendChild(option);
    });
    confirmBtn.disabled = true; // Initially disabled

    buildSelect.onchange = () => {
        confirmBtn.disabled = !buildSelect.value;
    };

    propertyActionsDiv.appendChild(selectDiv);
    buildHouseBtn.style.display = 'none'; // Hide main build button while dialog is open

    confirmBtn.onclick = () => {
        const propId = parseInt(buildSelect.value);
        const prop = board[propId];
        if (prop && prop.owner === player.id && player.money >= prop.houseCost && prop.houses < 5) {
            const group = getPropertiesByColor(prop.colorGroup);
            // Enforce building evenly within a group: can only build if this property has the minimum houses in the group
            const minHousesInGroup = Math.min(...group.filter(p => p.owner === player.id).map(p => p.houses));
            if (prop.houses > minHousesInGroup) {
                logMessage("Must build Dwellings evenly across the sector. Build on holdings with fewer Dwellings first.", "error");
                return;
            }

            player.money -= prop.houseCost;
            prop.houses++;
            logMessage(`${player.name} built a ${prop.houses === 5 ? 'Fortress' : 'Dwelling'} on ${prop.name}. Dwellings: ${prop.houses}.`);
            updatePlayerInfo();
            updateBoardUI();
            propertyActionsDiv.removeChild(selectDiv);
            showPropertyManagementActions(player); // Re-evaluate and show/hide options
            setControls(); // Re-evaluate main controls
        } else {
            logMessage("Cannot build Dwelling here.", "error");
        }
    };
    cancelBtn.onclick = () => {
        propertyActionsDiv.removeChild(selectDiv);
        showPropertyManagementActions(player); // Re-evaluate and show/hide options
        setControls(); // Re-evaluate main controls
    };
}


function mortgageProperty(player, propId) {
    const prop = board[propId];
    if (prop && prop.owner === player.id && !prop.mortgaged && prop.houses === 0) {
        prop.mortgaged = true;
        player.money += prop.price / 2;
        logMessage(`${player.name} mortgaged ${prop.name} for ₡${prop.price / 2}.`, 'info');
        updatePlayerInfo();
        updateBoardUI();
        showPropertyManagementActions(player); // Refresh actions
    } else {
        logMessage(`Cannot mortgage ${prop.name}. Must have no Dwellings and own it.`, 'error');
    }
}

function unmortgageProperty(player, propId) {
    const prop = board[propId];
    const unmortgageCost = Math.ceil(prop.price / 2 * 1.1); // Cost + 10% interest
    if (prop && prop.owner === player.id && prop.mortgaged && player.money >= unmortgageCost) {
        prop.mortgaged = false;
        player.money -= unmortgageCost;
        logMessage(`${player.name} unmortgaged ${prop.name} for ₡${unmortgageCost}.`, 'info');
        updatePlayerInfo();
        updateBoardUI();
        showPropertyManagementActions(player); // Refresh actions
    } else {
        logMessage(`Cannot unmortgage ${prop.name}. Not enough credits or not mortgaged.`, 'error');
    }
}

function sellHouse(player, propId) {
    const prop = board[propId];
    if (prop && prop.owner === player.id && prop.houses > 0) {
        const group = getPropertiesByColor(prop.colorGroup);
        const minHousesInGroup = Math.min(...group.filter(p => p.owner === player.id).map(p => p.houses));
        if (prop.houses > minHousesInGroup) {
            logMessage("Must sell Dwellings evenly across the sector. Sell from holdings with more Dwellings first.", "error");
            return;
        }
        
        prop.houses--;
        player.money += prop.houseCost / 2;
        logMessage(`${player.name} sold a ${prop.houses === 4 ? 'Fortress (now 4 Dwellings)' : 'Dwelling'} on ${prop.name} for ₡${prop.houseCost / 2}. Dwellings: ${prop.houses}.`, 'info');
        updatePlayerInfo();
        updateBoardUI();
        showPropertyManagementActions(player); // Refresh actions
    } else {
        logMessage(`Cannot sell Dwelling on ${prop.name}. No Dwellings to sell or not owned.`, 'error');
    }
}


// --- Control Management ---
function setControls() {
    const player = players[currentPlayerIndex];

    // --- DEBUG LOGS ---
    console.log("--- setControls called ---");
    console.log(`Player: ${player.name} (ID: ${player.id})`);
    console.log(`inJail: ${player.inJail}, hasRolled: ${player.hasRolled}, doublesRolledThisTurn: ${player.doublesRolledThisTurn}, jailTurns: ${player.jailTurns}`);
    console.log(`currentActionPending: ${currentActionPending}`);
    // --- END DEBUG LOGS ---

    // Hide all action divs first
    propertyActionsDiv.style.display = 'none';
    jailActionsDiv.style.display = 'none';
    buyPropertyBtn.style.display = 'none';
    buildHouseBtn.style.display = 'none';
    showPropertyManagementActions(player); // This will manage its own internal elements

    if (gameOver) {
        console.log("setControls: Game Over.");
        rollDiceBtn.disabled = true;
        endTurnBtn.disabled = true;
        return;
    }

    // Scenario 1: Player just landed on "Send to Detention Block" (or drew a card)
    // OR Player just rolled in Detention Block and did NOT get out (turn ends)
    if (player.inJail && player.hasRolled) {
        console.log("setControls: Player in Detention Block and has rolled (turn ends).");
        rollDiceBtn.disabled = true; // Cannot roll again
        endTurnBtn.disabled = false; // Can end turn
        jailActionsDiv.style.display = 'none'; // No Detention Block actions this turn, just went there or failed roll
        currentActionPending = 'none'; // Ensure turn ends
    }
    // Scenario 2: Player is starting their turn in Detention Block (hasRolled is false)
    else if (player.inJail) {
        console.log("setControls: Player in Detention Block (start of turn).");
        jailActionsDiv.style.display = 'flex';
        payBailBtn.disabled = (player.money < 50);
        useJailCardBtn.disabled = (player.getOutOfJailFreeCards === 0);

        if (player.jailTurns === 3) { // On 3rd turn, must pay/use card
            console.log("setControls: Player on 3rd Detention Block turn, must pay/use card.");
            logMessage(`${player.name} is on their 3rd turn in the Detention Block. Must pay ₡50 bail or use a Get Out of Detention Free Card.`, 'warning');
            rollDiceBtn.disabled = true; // Cannot roll
            endTurnBtn.disabled = true; // Cannot end turn until bail is paid/card used
            propertyActionsDiv.style.display = 'none'; // No property actions while forced to pay bail

            if (payBailBtn.disabled && useJailCardBtn.disabled) {
                console.log("setControls: Player bankrupt from Detention Block.");
                logMessage(`${player.name} cannot pay bail or use a card and is bankrupt!`, 'error');
                handleBankruptcy(player, 'bank', 50);
                currentActionPending = 'none';
                setControls(); // Re-call to update after bankruptcy
                return;
            }
        } else { // Not 3rd turn, can roll to try to get out
            console.log("setControls: Player in Detention Block, can roll to get out.");
            rollDiceBtn.disabled = false; // Can roll
            endTurnBtn.disabled = true; // Cannot end turn until resolved Detention Block
        }
    }
    // Original logic for non-jail scenarios (order matters here)
    else if (player.doublesRolledThisTurn > 0 && player.doublesRolledThisTurn < 3) {
        console.log("setControls: Player rolled doubles, can roll again.");
        // Rolled doubles, can roll again. Actions for current space *before* re-roll.
        rollDiceBtn.disabled = false; // Can roll again
        endTurnBtn.disabled = true; // Must roll again or perform actions
        if (currentActionPending === 'buy') {
            const space = board[player.position];
            showBuyPropertyAction(player, space);
        } else if (currentActionPending === 'manage') {
            showPropertyManagementActions(player);
        }
    } else if (currentActionPending === 'buy') {
        console.log("setControls: Player can buy property.");
        rollDiceBtn.disabled = true; // Cannot roll again
        endTurnBtn.disabled = false; // Can choose to end turn without buying
        const space = board[player.position];
        showBuyPropertyAction(player, space);
    } else if (currentActionPending === 'manage') {
        console.log("setControls: Player can manage property.");
        rollDiceBtn.disabled = true; // Cannot roll again
        endTurnBtn.disabled = false; // Can end turn
        showPropertyManagementActions(player);
    } else { // Turn is over or no specific action required on space (currentActionPending === 'none')
        console.log("setControls: Turn over, no special actions pending.");
        // This is the default state after a non-doubles roll, or after an action is completed.
        rollDiceBtn.disabled = true; // Player has rolled and no further action needed
        endTurnBtn.disabled = false; // Can end turn
    }
    console.log(`setControls: Final button states: Roll Dice Disabled: ${rollDiceBtn.disabled}, End Turn Disabled: ${endTurnBtn.disabled}`);
}

function setControlsForTurnStart() {
    const player = players[currentPlayerIndex];
    player.hasRolled = false; // Reset for new turn
    player.doublesRolledThisTurn = 0; // Reset for new turn
    currentActionPending = 'none'; // Clear any pending actions

    rollDiceBtn.disabled = false;
    endTurnBtn.disabled = true;
    propertyActionsDiv.style.display = 'none';
    jailActionsDiv.style.display = 'none';
    buyPropertyBtn.style.display = 'none';
    showPropertyManagementActions(player); // This will hide/show management options based on player's properties
                                        // but it won't affect the buy button display.

    if (player.inJail) { // Player in Detention Block
        logMessage(`${player.name} is in the Detention Block.`, 'warning');
        setControlsForJailStartTurn(); // Specific Detention Block controls at start of turn
    }
}

function setControlsForJailStartTurn() {
    const player = players[currentPlayerIndex];
    jailActionsDiv.style.display = 'flex';
    payBailBtn.disabled = (player.money < 50);
    useJailCardBtn.disabled = (player.getOutOfJailFreeCards === 0);

    if (player.jailTurns === 3) {
        logMessage(`${player.name} is on their 3rd turn in the Detention Block. Must pay ₡50 bail or use a Get Out of Detention Free Card.`, 'warning');
        rollDiceBtn.disabled = true; // Cannot roll
        endTurnBtn.disabled = true; // Cannot end turn until bail is paid/card used
        // Hide property actions if they are forced to pay bail
        propertyActionsDiv.style.display = 'none';

        // If they can't pay or use card, they are bankrupt.
        if (payBailBtn.disabled && useJailCardBtn.disabled) {
            logMessage(`${player.name} cannot pay bail or use a card and is bankrupt!`, 'error');
            handleBankruptcy(player, 'bank', 50); // Debt is 50 for bail
            currentActionPending = 'none'; // Turn ends after bankruptcy
            setControls(); // Re-call setControls to update after bankruptcy
            return; // Exit to prevent further control setting
        }
    } else { // Not 3rd turn, can roll
        rollDiceBtn.disabled = false;
        endTurnBtn.disabled = true; // Can't end turn until resolved Detention Block
    }
}


function endTurn() {
    if (isAuctionActive || isTradeActive) return; // Do not allow ending turn during an auction or trade

    // If player has the option to buy but declines, start an auction
    if (currentActionPending === 'buy') {
        const space = board[players[currentPlayerIndex].position];
        logMessage(`${players[currentPlayerIndex].name} declined to buy ${space.name}. It will be auctioned.`);
        startAuction(space.id);
        return; // Auction will handle the rest of the turn flow
    }

    logMessage(`${players[currentPlayerIndex].name}'s turn ended.`);
    // doublesRolledThisTurn and hasRolled are reset in setControlsForTurnStart

    // Move to next player that is still in the game
    let nextPlayerFound = false;
    let originalIndex = currentPlayerIndex; // Store original index in case all other players bankrupt
    let loopCount = 0; // Prevent infinite loop if no players left (should be caught by gameOver)

    do {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        loopCount++;
        if (loopCount > players.length * 2) { // Safety break, should not happen with proper bankruptcy handling
            logMessage("Error: Could not find next player.", "error");
            gameOver = true;
            return;
        }
        // Check if the player at the new index is still in the active players array
        // This check is implicitly handled by `players.length` in the loop condition
        // and `players` array being filtered on bankruptcy.
        // The `players` array itself will only contain active players.
        nextPlayerFound = true; // If we reached here, a next player exists in the filtered array
    } while (!nextPlayerFound); // This loop will only run once if players.length > 0

    // If only one player left, game should have ended via checkWinCondition
    if (players.length <= 1) {
        checkWinCondition();
        return;
    }

    logMessage(`It's ${players[currentPlayerIndex].name}'s turn.`);
    setControlsForTurnStart();
    updatePlayerInfo();
}


// --- Property Info Modal Logic ---
function showPropertyModal(spaceId) {
    const space = board[spaceId];
    if (!space || !['location', 'hyperspace_lane', 'facility'].includes(space.type)) {
        // Only show modal for locations, hyperspace lanes, and facilities
        return;
    }

    modalPropertyName.textContent = space.name;
    modalPropertyType.textContent = space.type.replace('_', ' ').toUpperCase();
    modalPropertyPrice.textContent = space.price;
    modalPropertyOwner.textContent = space.owner !== null ? players[space.owner].name : 'Unowned';
    modalPropertyMortgaged.textContent = space.mortgaged ? 'Yes' : 'No';
    modalPropertyMortgageValue.textContent = space.price / 2;

    // Clear previous color bar classes
    modalPropertyColorBar.className = 'color-bar';
    if (space.colorGroup) {
        modalPropertyColorBar.classList.add(space.colorGroup);
    } else {
        modalPropertyColorBar.style.backgroundColor = 'transparent'; // No color for lanes/facilities
    }

    modalPropertyRentList.innerHTML = ''; // Clear previous rent list

    if (space.type === 'location') {
        modalPropertyHousesRow.style.display = 'block';
        modalPropertyHouseCostRow.style.display = 'block';
        modalPropertyHouses.textContent = space.houses === 5 ? 'Fortress' : space.houses;
        modalPropertyHouseCost.textContent = space.houseCost;

        modalPropertyRentList.innerHTML += `<li><strong>Rent:</strong> ₡${space.rent[0]}</li>`;
        modalPropertyRentList.innerHTML += `<li>With 1 Dwelling: ₡${space.rent[1]}</li>`;
        modalPropertyRentList.innerHTML += `<li>With 2 Dwellings: ₡${space.rent[2]}</li>`;
        modalPropertyRentList.innerHTML += `<li>With 3 Dwellings: ₡${space.rent[3]}</li>`;
        modalPropertyRentList.innerHTML += `<li>With 4 Dwellings: ₡${space.rent[4]}</li>`;
        modalPropertyRentList.innerHTML += `<li>With FORTRESS: ₡${space.rent[5]}</li>`;
    } else if (space.type === 'hyperspace_lane') {
        modalPropertyHousesRow.style.display = 'none';
        modalPropertyHouseCostRow.style.display = 'none';
        modalPropertyRentList.innerHTML += `<li><strong>Rent (1 Lane):</strong> ₡${space.rent[0]}</li>`;
        modalPropertyRentList.innerHTML += `<li><strong>Rent (2 Lanes):</strong> ₡${space.rent[1]}</li>`;
        modalPropertyRentList.innerHTML += `<li><strong>Rent (3 Lanes):</strong> ₡${space.rent[2]}</li>`;
        modalPropertyRentList.innerHTML += `<li><strong>Rent (4 Lanes):</strong> ₡${space.rent[3]}</li>`;
    } else if (space.type === 'facility') {
        modalPropertyHousesRow.style.display = 'none';
        modalPropertyHouseCostRow.style.display = 'none';
        modalPropertyRentList.innerHTML += `<li><strong>Rent (1 Facility):</strong> 4 times amount shown on dice</li>`;
        modalPropertyRentList.innerHTML += `<li><strong>Rent (2 Facilities):</strong> 10 times amount shown on dice</li>`;
    }

    propertyModalOverlay.style.display = 'flex'; // Show the modal
}

function hidePropertyModal() {
    propertyModalOverlay.style.display = 'none';
}

// --- Auction Logic ---
function startAuction(propId) {
    isAuctionActive = true;
    auctionPropertyId = propId;
    currentBid = 0;
    highestBidderId = null;
    auctionBidders = [...players]; // All players can bid initially
    auctionCurrentBidderIndex = currentPlayerIndex; // Start bidding with the player who landed on the space

    // Disable main game controls
    rollDiceBtn.disabled = true;
    endTurnBtn.disabled = true;
    propertyActionsDiv.style.display = 'none';
    jailActionsDiv.style.display = 'none';

    document.body.classList.add('auction-active');
    auctionModalOverlay.style.display = 'flex';
    updateAuctionUI();
}

function updateAuctionUI() {
    const property = board[auctionPropertyId];
    auctionPropertyName.textContent = property.name;
    auctionCurrentBid.textContent = `₡${currentBid}`;
    auctionHighestBidder.textContent = highestBidderId !== null ? players.find(p => p.id === highestBidderId).name : 'None';
    
    const currentBidder = auctionBidders[auctionCurrentBidderIndex];
    auctionCurrentBidder.textContent = currentBidder.name;
    auctionBidAmountInput.value = currentBid + 1;
    auctionBidAmountInput.min = currentBid + 1;
}

function handlePlaceBid() {
    const bidAmount = parseInt(auctionBidAmountInput.value);
    const bidder = auctionBidders[auctionCurrentBidderIndex];

    if (isNaN(bidAmount) || bidAmount <= currentBid) {
        logMessage(`Invalid bid. Must be higher than ₡${currentBid}.`, 'error');
        return;
    }
    if (bidAmount > bidder.money) {
        logMessage(`${bidder.name} cannot afford to bid ₡${bidAmount}.`, 'error');
        return;
    }

    currentBid = bidAmount;
    highestBidderId = bidder.id;
    logMessage(`${bidder.name} bids ₡${currentBid}.`, 'info');
    nextBidder();
}

function handleWithdraw() {
    const withdrawnPlayer = auctionBidders.splice(auctionCurrentBidderIndex, 1)[0];
    logMessage(`${withdrawnPlayer.name} has withdrawn from the auction.`, 'info');

    // If the current bidder was the last one in the list, reset index to 0
    if (auctionCurrentBidderIndex >= auctionBidders.length) {
        auctionCurrentBidderIndex = 0;
    }

    // Check win condition for auction
    if (auctionBidders.length === 1) {
        // If there's only one bidder left, they win automatically
        highestBidderId = auctionBidders[0].id;
        endAuction();
    } else if (auctionBidders.length === 0) {
        // If everyone withdraws and there was no initial bid
        endAuction();
    } else {
        updateAuctionUI();
    }
}

function nextBidder() {
    auctionCurrentBidderIndex = (auctionCurrentBidderIndex + 1) % auctionBidders.length;
    updateAuctionUI();
}

function endAuction() {
    const property = board[auctionPropertyId];
    if (highestBidderId !== null) {
        const winner = players.find(p => p.id === highestBidderId);
        logMessage(`${winner.name} wins the auction for ${property.name} with a bid of ₡${currentBid}!`, 'success');
        
        winner.money -= currentBid;
        property.owner = winner.id;
        winner.properties.push(property.id);
    } else {
        logMessage(`No bids were placed for ${property.name}. It remains unowned.`, 'info');
    }

    // Reset auction state
    isAuctionActive = false;
    auctionPropertyId = null;
    document.body.classList.remove('auction-active');
    auctionModalOverlay.style.display = 'none';

    // Restore game flow
    currentActionPending = 'none';
    setControls();
    updatePlayerInfo();
    updateBoardUI();
}

// --- Trade Logic ---
function showTradeMessage(message) {
    tradeMessageArea.textContent = message;
}

function showTradeModal() {
    if (isAuctionActive) return;
    isTradeActive = true;
    showTradeMessage(''); // Clear previous messages

    // Disable main game controls
    rollDiceBtn.disabled = true;
    endTurnBtn.disabled = true;

    // Reset inputs
    tradeOfferMoney.value = 0;
    tradeRequestMoney.value = 0;
    tradeOfferCards.value = 0;
    tradeRequestCards.value = 0;

    // Populate trade partner dropdown
    tradePartnerSelect.innerHTML = '<option value="">-- Select Player --</option>';
    players.forEach((player, index) => {
        if (index !== currentPlayerIndex) {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.name;
            tradePartnerSelect.appendChild(option);
        }
    });

    // Reset and show modal
    updateTradeModalAssets();
    document.body.classList.add('trade-active');
    tradeModalOverlay.style.display = 'flex';
}

function updateTradeModalAssets() {
    const proposer = players[currentPlayerIndex];
    const partnerId = parseInt(tradePartnerSelect.value);
    const partner = players.find(p => p.id === partnerId);

    // Populate proposer's assets
    tradeOfferProperties.innerHTML = '';
    proposer.properties.forEach(propId => {
        const prop = board[propId];
        const option = document.createElement('option');
        option.value = prop.id;
        option.textContent = prop.name;
        tradeOfferProperties.appendChild(option);
    });
    tradeOfferCards.max = proposer.getOutOfJailFreeCards;
    tradeOfferMoney.max = proposer.money;

    // Populate partner's assets
    tradeRequestProperties.innerHTML = '';
    if (partner) {
        partner.properties.forEach(propId => {
            const prop = board[propId];
            const option = document.createElement('option');
            option.value = prop.id;
            option.textContent = prop.name;
            tradeRequestProperties.appendChild(option);
        });
        tradeRequestCards.max = partner.getOutOfJailFreeCards;
        tradeRequestMoney.max = partner.money;
    } else {
        tradeRequestCards.max = 0;
        tradeRequestMoney.max = 0;
    }
}

function handleSendProposal() {
    showTradeMessage(''); // Clear previous messages
    const proposer = players[currentPlayerIndex];
    tradePartnerId = parseInt(tradePartnerSelect.value);
    if (isNaN(tradePartnerId)) {
        showTradeMessage("Please select a player to trade with.");
        return;
    }
    const partner = players.find(p => p.id === tradePartnerId);

    // Gather selected items
    tradeOffer = {
        money: parseInt(tradeOfferMoney.value) || 0,
        properties: Array.from(tradeOfferProperties.selectedOptions).map(opt => parseInt(opt.value)),
        cards: parseInt(tradeOfferCards.value) || 0
    };
    tradeRequest = {
        money: parseInt(tradeRequestMoney.value) || 0,
        properties: Array.from(tradeRequestProperties.selectedOptions).map(opt => parseInt(opt.value)),
        cards: parseInt(tradeRequestCards.value) || 0
    };

    // --- Validation ---
    if (tradeOffer.money > proposer.money || tradeOffer.cards > proposer.getOutOfJailFreeCards) {
        showTradeMessage("You cannot offer more credits or cards than you have.");
        return;
    }
    if (tradeRequest.money > partner.money || tradeRequest.cards > partner.getOutOfJailFreeCards) {
        showTradeMessage(`${partner.name} does not have enough credits or cards for this trade.`);
        return;
    }
    // Check if properties have houses
    const allTradeProps = [...tradeOffer.properties, ...tradeRequest.properties];
    for (const propId of allTradeProps) {
        if (board[propId].houses > 0) {
            showTradeMessage("Cannot trade holdings with Dwellings/Fortresses. They must be sold first.");
            return;
        }
    }

    // Show review modal
    showTradeReviewModal();
}

function showTradeReviewModal() {
    const proposer = players[currentPlayerIndex];
    const partner = players.find(p => p.id === tradePartnerId);

    reviewProposerName.textContent = proposer.name;
    reviewPartnerName.textContent = partner.name;

    reviewOfferMoney.textContent = `₡${tradeOffer.money}`;
    reviewOfferCards.textContent = tradeOffer.cards;
    reviewOfferProperties.innerHTML = tradeOffer.properties.map(id => `<li>${board[id].name}</li>`).join('') || '<li>None</li>';

    reviewRequestMoney.textContent = `₡${tradeRequest.money}`;
    reviewRequestCards.textContent = tradeRequest.cards;
    reviewRequestProperties.innerHTML = tradeRequest.properties.map(id => `<li>${board[id].name}</li>`).join('') || '<li>None</li>';

    tradeModalOverlay.style.display = 'none';
    tradeReviewModalOverlay.style.display = 'flex';
}

function handleAcceptTrade() {
    const proposer = players[currentPlayerIndex];
    const partner = players.find(p => p.id === tradePartnerId);

    logMessage(`${partner.name} accepted the trade with ${proposer.name}.`, 'success');

    // Exchange money
    proposer.money += tradeRequest.money - tradeOffer.money;
    partner.money += tradeOffer.money - tradeRequest.money;

    // Exchange cards
    proposer.getOutOfJailFreeCards += tradeRequest.cards - tradeOffer.cards;
    partner.getOutOfJailFreeCards += tradeOffer.cards - tradeRequest.cards;

    // Exchange properties
    tradeOffer.properties.forEach(propId => {
        proposer.properties = proposer.properties.filter(id => id !== propId);
        partner.properties.push(propId);
        board[propId].owner = partner.id;
    });
    tradeRequest.properties.forEach(propId => {
        partner.properties = partner.properties.filter(id => id !== propId);
        proposer.properties.push(propId);
        board[propId].owner = proposer.id;
    });

    endTrade();
}

function handleRejectTrade() {
    const partner = players.find(p => p.id === tradePartnerId);
    logMessage(`${partner.name} rejected the trade.`, 'warning');
    endTrade();
}

function endTrade() {
    isTradeActive = false;
    tradePartnerId = null;
    tradeOffer = {};
    tradeRequest = {};

    document.body.classList.remove('trade-active');
    tradeModalOverlay.style.display = 'none';
    tradeReviewModalOverlay.style.display = 'none';

    updatePlayerInfo();
    updateBoardUI();
    setControls();
}


// --- Event Listeners ---
numPlayersInput.addEventListener('change', () => {
    const num = parseInt(numPlayersInput.value);
    playerNameInputsDiv.innerHTML = '';
    for (let i = 0; i < num; i++) {
        const group = document.createElement('div');
        group.className = 'player-input-group';
        group.innerHTML = `<label for="player-name-${i}">Player ${i + 1} Name:</label>
                           <input type="text" id="player-name-${i}" value="Player ${i + 1}">`;
        playerNameInputsDiv.appendChild(group);
    }
});

startGameBtn.addEventListener('click', startGame);
rollDiceBtn.addEventListener('click', () => rollDice()); // Call rollDice without arguments for random roll
endTurnBtn.addEventListener('click', endTurn);

mortgagePropertyBtn.addEventListener('click', () => {
    const propId = parseInt(mortgageSelect.value);
    if (propId) mortgageProperty(players[currentPlayerIndex], propId);
});
unmortgagePropertyBtn.addEventListener('click', () => {
    const propId = parseInt(unmortgageSelect.value);
    if (propId) unmortgageProperty(players[currentPlayerIndex], propId);
});
sellHouseBtn.addEventListener('click', () => {
    const propId = parseInt(sellHouseSelect.value);
    if (propId) sellHouse(players[currentPlayerIndex], propId);
});

payBailBtn.addEventListener('click', () => {
    const player = players[currentPlayerIndex];
    if (player.inJail && player.money >= 50) {
        player.money -= 50;
        player.inJail = false;
        player.jailTurns = 0;
        logMessage(`${player.name} paid ₡50 bail to get out of Detention Block.`, 'success');
        updatePlayerInfo();
        setControlsForTurnStart(); 
    } else {
        logMessage("Not enough credits to pay bail.", "error");
    }
});

useJailCardBtn.addEventListener('click', () => {
    const player = players[currentPlayerIndex];
    if (player.inJail && player.getOutOfJailFreeCards > 0) {
        player.getOutOfJailFreeCards--;
        player.inJail = false;
        player.jailTurns = 0;
        logMessage(`${player.name} used a Get Out of Detention Free Card to get out of Detention Block!`, 'success');
        updatePlayerInfo();
        setControlsForTurnStart(); 
    } else {
        logMessage("No Get Out of Detention Free Cards available.", "error");
    }
});

// Event listener for clicking on board spaces to show property info
gameBoardDiv.addEventListener('click', (event) => {
    const clickedSpace = event.target.closest('.board-space');
    if (clickedSpace && clickedSpace.dataset.spaceId) {
        const spaceId = parseInt(clickedSpace.dataset.spaceId);
        showPropertyModal(spaceId);
    }
});

// Event listeners for closing the modal
propertyModalCloseBtn.addEventListener('click', hidePropertyModal);
propertyModalOverlay.addEventListener('click', (event) => {
    // Close if clicking on the overlay itself, not the content
    if (event.target === propertyModalOverlay) {
        hidePropertyModal();
    }
});

// Auction Event Listeners
auctionPlaceBidBtn.addEventListener('click', handlePlaceBid);
auctionWithdrawBtn.addEventListener('click', handleWithdraw);

// Trade Event Listeners
proposeTradeBtn.addEventListener('click', showTradeModal);
cancelTradeBtn.addEventListener('click', endTrade);
sendProposalBtn.addEventListener('click', handleSendProposal);
tradePartnerSelect.addEventListener('change', updateTradeModalAssets);
acceptTradeBtn.addEventListener('click', handleAcceptTrade);
rejectTradeBtn.addEventListener('click', handleRejectTrade);


// Initial setup for player name inputs
numPlayersInput.dispatchEvent(new Event('change'));


// --- Debug Utility Functions ---

function populateDebugPlayerSelects() {
    const playerOptions = players.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    debugMovePlayerSelect.innerHTML = `<option value="">-- Select Player --</option>` + playerOptions;
    debugJailPlayerSelect.innerHTML = `<option value="">-- Select Player --</option>` + playerOptions;
    debugOwnerSelect.innerHTML = `<option value="">-- Select Owner --</option><option value="bank">Bank</option>` + playerOptions;
    debugMoneyPlayerSelect.innerHTML = `<option value="">-- Select Player --</option>` + playerOptions;
}

function populateDebugSpaceSelect() {
    const spaceOptions = board.map(s => `<option value="${s.id}">${s.name} (ID: ${s.id})</option>`).join('');
    debugMoveSpaceSelect.innerHTML = `<option value="">-- Select Space --</option>` + spaceOptions;
}

function populateDebugPropertySelects() {
    // Changed from 'property' to 'location' etc.
    const propertyOptions = board.filter(s => ['location', 'hyperspace_lane', 'facility'].includes(s.type))
                                .map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    debugPropertySelect.innerHTML = `<option value="">-- Select Holding --</option>` + propertyOptions;

    // Only 'location' types can have houses (dwellings)
    const housePropertyOptions = board.filter(s => s.type === 'location')
                                    .map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    debugHousePropertySelect.innerHTML = `<option value="">-- Select Location --</option>` + housePropertyOptions;
}

function refreshDebugControls() {
    populateDebugPlayerSelects();
    populateDebugSpaceSelect();
    populateDebugPropertySelects();
}

// --- Debug Control Logic ---

// Toggle Debug Controls Visibility
document.addEventListener('keydown', (event) => {
    // Check for Ctrl+D or Command+D on Mac
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault(); // Prevent browser's default bookmark action
        if (debugControlsDiv.style.display === 'none') {
            debugControlsDiv.style.display = 'flex';
            refreshDebugControls();
        } else {
            debugControlsDiv.style.display = 'none';
        }
    }
});

// Debug Move Player
debugMoveBtn.addEventListener('click', () => {
    const playerId = parseInt(debugMovePlayerSelect.value);
    const spaceId = parseInt(debugMoveSpaceSelect.value);

    if (isNaN(playerId) || isNaN(spaceId)) {
        logMessage("Please select a player and a space to move.", "error");
        return;
    }

    const player = players.find(p => p.id === playerId);
    if (!player) {
        logMessage("Player not found.", "error");
        return;
    }

    // Reset player's jail status if they were in jail and moved
    if (player.inJail && spaceId !== 10) { // If moving out of Detention Block space
        player.inJail = false;
        player.jailTurns = 0;
        logMessage(`DEBUG: ${player.name} moved out of Detention Block.`, 'debug');
    }

    player.position = spaceId;
    logMessage(`DEBUG: ${player.name} moved directly to ${board[spaceId].name}.`, 'debug');
    updatePlayerInfo();
    updateBoardUI();
    landOnSpace(player); // Trigger landOnSpace logic for the new position
});

// Simulate Dice Roll button now calls the main rollDice function
debugRollBtn.addEventListener('click', () => {
    const die1 = parseInt(debugDie1Input.value);
    const die2 = parseInt(debugDie2Input.value);

    if (isNaN(die1) || isNaN(die2) || die1 < 1 || die1 > 6 || die2 < 1 || die2 > 6) {
        logMessage("Please enter valid dice values (1-6).", "error");
        return;
    }

    // Call the main rollDice function with the simulated values
    rollDice(die1, die2);
    logMessage(`DEBUG: Simulated roll of ${die1}, ${die2}.`, 'debug');
});

// Change Property Ownership
debugChangeOwnerBtn.addEventListener('click', () => {
    const propId = parseInt(debugPropertySelect.value);
    const ownerValue = debugOwnerSelect.value; // Can be player ID or "bank"

    if (isNaN(propId) || !ownerValue) {
        logMessage("Please select a holding and an owner.", "error");
        return;
    }

    const property = board[propId];
    // Check for tradable types using the new names
    if (!property || !['location', 'hyperspace_lane', 'facility'].includes(property.type)) {
        logMessage("Selected space is not a tradable holding (location, hyperspace lane, or facility).", "error");
        return;
    }

    // Remove from old owner's properties
    if (property.owner !== null) {
        const oldOwner = players.find(p => p.id === property.owner);
        if (oldOwner) {
            oldOwner.properties = oldOwner.properties.filter(p => p !== propId);
            // If property had dwellings, they are removed when ownership changes
            if (property.type === 'location') {
                oldOwner.money += property.houses * (property.houseCost / 2); // Refund half cost
                logMessage(`DEBUG: ${oldOwner.name} refunded ₡${property.houses * (property.houseCost / 2)} for Dwellings on ${property.name}.`, 'debug');
                property.houses = 0;
            }
            property.mortgaged = false; // Unmortgage when ownership changes
        }
    }

    // Assign to new owner
    if (ownerValue === 'bank') {
        property.owner = null;
        logMessage(`DEBUG: ${property.name} is now unowned (Bank).`, 'debug');
    } else {
        const newOwnerId = parseInt(ownerValue);
        const newOwner = players.find(p => p.id === newOwnerId);
        if (newOwner) {
            property.owner = newOwnerId;
            newOwner.properties.push(propId);
            logMessage(`DEBUG: ${property.name} is now owned by ${newOwner.name}.`, 'debug');
        } else {
            logMessage("New owner not found.", "error");
            return;
        }
    }

    updatePlayerInfo();
    updateBoardUI();
});

// Set Dwellings/Fortresses (Houses/Hotels)
debugSetHousesBtn.addEventListener('click', () => {
    const propId = parseInt(debugHousePropertySelect.value);
    const houseCount = parseInt(debugHouseCountInput.value);

    if (isNaN(propId) || isNaN(houseCount) || houseCount < 0 || houseCount > 5) {
        logMessage("Please select a location and a valid Dwelling count (0-5).", "error");
        return;
    }

    const property = board[propId];
    if (!property || property.type !== 'location') { // Only 'location' types can have dwellings
        logMessage("Selected space is not a buildable location.", "error");
        return;
    }

    if (property.owner === null) {
        logMessage("Location must be owned to set Dwellings.", "error");
        return;
    }

    // For debugging, we'll bypass money/monopoly checks for simplicity.
    property.houses = houseCount;
    logMessage(`DEBUG: Set ${property.name} to ${houseCount} Dwellings/Fortress.`, 'debug');
    updatePlayerInfo();
    updateBoardUI();
});

// Set Player Money
debugSetMoneyBtn.addEventListener('click', () => {
    const playerId = parseInt(debugMoneyPlayerSelect.value);
    const moneyAmount = parseInt(debugMoneyAmountInput.value);

    if (isNaN(playerId) || isNaN(moneyAmount) || moneyAmount < 0) {
        logMessage("Please select a player and enter a valid credit amount.", "error");
        return;
    }

    const player = players.find(p => p.id === playerId);
    if (!player) {
        logMessage("Player not found.", "error");
        return;
    }

    player.money = moneyAmount;
    logMessage(`DEBUG: Set ${player.name}'s credits to ₡${moneyAmount}.`, 'debug');
    updatePlayerInfo();
});

// Send Player to Detention Block (Jail)
debugSendToJailBtn.addEventListener('click', () => {
    const playerId = parseInt(debugJailPlayerSelect.value);

    if (isNaN(playerId)) {
        logMessage("Please select a player to send to Detention Block.", "error");
        return;
    }

    const player = players.find(p => p.id === playerId);
    if (!player) {
        logMessage("Player not found.", "error");
        return;
    }

    sendToJail(player); // Use the existing game function
    logMessage(`DEBUG: ${player.name} sent to Detention Block.`, 'debug');
    updatePlayerInfo();
    updateBoardUI();
});