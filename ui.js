import { state } from './game.js';
import { board } from './config.js';

// --- DOM Elements ---
export const DOMElements = {
    setupScreen: document.getElementById('setup-screen'),
    gameScreen: document.getElementById('game-screen'),
    numPlayersInput: document.getElementById('num-players'),
    playerNameInputsDiv: document.getElementById('player-name-inputs'),
    startGameBtn: document.getElementById('start-game-btn'),
    gameBoardDiv: document.getElementById('game-board'),
    currentPlayerDisplay: document.getElementById('current-player-display'),
    diceDisplay: document.getElementById('dice-display'),
    rollDiceBtn: document.getElementById('roll-dice-btn'),
    endTurnBtn: document.getElementById('end-turn-btn'),
    messageLog: document.getElementById('message-log'),
    playerListContainer: document.getElementById('player-list-container'),
    propertyActionsDiv: document.getElementById('property-actions'),
    buyPropertyBtn: document.getElementById('buy-property-btn'),
    buildHouseBtn: document.getElementById('build-house-btn'),
    mortgageSelect: document.getElementById('mortgage-select'),
    mortgagePropertyBtn: document.getElementById('mortgage-property-btn'),
    unmortgageSelect: document.getElementById('unmortgage-select'),
    unmortgagePropertyBtn: document.getElementById('unmortgage-property-btn'),
    sellHouseSelect: document.getElementById('sell-house-select'),
    sellHouseBtn: document.getElementById('sell-house-btn'),
    jailActionsDiv: document.getElementById('jail-actions'),
    payBailBtn: document.getElementById('pay-bail-btn'),
    useJailCardBtn: document.getElementById('use-jail-card-btn'),
    debugControlsDiv: document.getElementById('debug-controls'),
    toggleDebugBtn: document.getElementById('toggle-debug-btn'),
    debugMovePlayerSelect: document.getElementById('debug-move-player-select'),
    debugMoveSpaceSelect: document.getElementById('debug-move-space-select'),
    debugMoveBtn: document.getElementById('debug-move-btn'),
    debugDie1Input: document.getElementById('debug-die1'),
    debugDie2Input: document.getElementById('debug-die2'),
    debugRollBtn: document.getElementById('debug-roll-btn'),
    debugPropertySelect: document.getElementById('debug-property-select'),
    debugOwnerSelect: document.getElementById('debug-owner-select'),
    debugChangeOwnerBtn: document.getElementById('debug-change-owner-btn'),
    debugHousePropertySelect: document.getElementById('debug-house-property-select'),
    debugHouseCountInput: document.getElementById('debug-house-count'),
    debugSetHousesBtn: document.getElementById('debug-set-houses-btn'),
    debugMoneyPlayerSelect: document.getElementById('debug-money-player-select'),
    debugMoneyAmountInput: document.getElementById('debug-money-amount'),
    debugSetMoneyBtn: document.getElementById('debug-set-money-btn'),
    debugJailPlayerSelect: document.getElementById('debug-jail-player-select'),
    debugSendToJailBtn: document.getElementById('debug-send-to-jail-btn'),
    propertyModalOverlay: document.getElementById('property-modal-overlay'),
    propertyModalCloseBtn: document.getElementById('property-modal-close'),
    modalPropertyName: document.getElementById('modal-property-name'),
    modalPropertyColorBar: document.getElementById('modal-property-color-bar'),
    modalPropertyType: document.getElementById('modal-property-type'),
    modalPropertyPrice: document.getElementById('modal-property-price'),
    modalPropertyOwner: document.getElementById('modal-property-owner'),
    modalPropertyMortgaged: document.getElementById('modal-property-mortgaged'),
    modalPropertyHousesRow: document.getElementById('modal-property-houses-row'),
    modalPropertyHouses: document.getElementById('modal-property-houses'),
    modalPropertyHouseCostRow: document.getElementById('modal-property-house-cost-row'),
    modalPropertyHouseCost: document.getElementById('modal-property-house-cost'),
    modalPropertyMortgageValue: document.getElementById('modal-property-mortgage-value'),
    modalPropertyRentList: document.getElementById('modal-property-rent-list'),
    auctionModalOverlay: document.getElementById('auction-modal-overlay'),
    auctionPropertyName: document.getElementById('auction-property-name'),
    auctionCurrentBid: document.getElementById('auction-current-bid'),
    auctionHighestBidder: document.getElementById('auction-highest-bidder'),
    auctionCurrentBidder: document.getElementById('auction-current-bidder'),
    auctionBidAmountInput: document.getElementById('auction-bid-amount'),
    auctionPlaceBidBtn: document.getElementById('auction-place-bid-btn'),
    auctionWithdrawBtn: document.getElementById('auction-withdraw-btn'),
    auctionMessageArea: document.getElementById('auction-message-area'),
    proposeTradeBtn: document.getElementById('propose-trade-btn'),
    tradeModalOverlay: document.getElementById('trade-modal-overlay'),
    tradePartnerSelect: document.getElementById('trade-partner-select'),
    tradeOfferMoney: document.getElementById('trade-offer-money'),
    tradeOfferProperties: document.getElementById('trade-offer-properties'),
    tradeOfferCards: document.getElementById('trade-offer-cards'),
    tradeRequestMoney: document.getElementById('trade-request-money'),
    tradeRequestProperties: document.getElementById('trade-request-properties'),
    tradeRequestCards: document.getElementById('trade-request-cards'),
    sendProposalBtn: document.getElementById('send-proposal-btn'),
    cancelTradeBtn: document.getElementById('cancel-trade-btn'),
    tradeMessageArea: document.getElementById('trade-message-area'),
    tradeReviewModalOverlay: document.getElementById('trade-review-modal-overlay'),
    reviewProposerName: document.getElementById('review-proposer-name'),
    reviewPartnerName: document.getElementById('review-partner-name'),
    reviewOfferMoney: document.getElementById('review-offer-money'),
    reviewOfferCards: document.getElementById('review-offer-cards'),
    reviewOfferProperties: document.getElementById('review-offer-properties'),
    reviewRequestMoney: document.getElementById('review-request-money'),
    reviewRequestCards: document.getElementById('review-request-cards'),
    reviewRequestProperties: document.getElementById('review-request-properties'),
    acceptTradeBtn: document.getElementById('accept-trade-btn'),
    rejectTradeBtn: document.getElementById('reject-trade-btn'),
};

// --- UI Functions ---
export function logMessage(message, type = 'info') {
    const div = document.createElement('div');
    div.textContent = message;
    div.className = type;
    DOMElements.messageLog.prepend(div); // Add to top
    if (DOMElements.messageLog.children.length > 50) { // Keep log from getting too long
        DOMElements.messageLog.removeChild(DOMElements.messageLog.lastChild);
    }
}

export function updatePlayerInfo() {
    DOMElements.playerListContainer.innerHTML = '';
    state.players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = `player-status ${index === state.currentPlayerIndex ? 'current' : ''}`;
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
        DOMElements.playerListContainer.appendChild(playerDiv);
    });
    DOMElements.currentPlayerDisplay.textContent = `Current Player: ${state.players[state.currentPlayerIndex].name}`;
}

export function updateBoardUI() {
    // Remove existing tokens
    document.querySelectorAll('.token').forEach(token => token.remove());

    // Add tokens
    state.players.forEach(player => {
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
                    ownerSpan.textContent = `Owner: ${state.players[space.owner].name}`;
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

export function createBoardUI() {
    DOMElements.gameBoardDiv.innerHTML = ''; // Clear existing board
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
        DOMElements.gameBoardDiv.appendChild(spaceDiv);
    });
}

DOMElements.showPropertyModal = function(spaceId) {
    const space = board[spaceId];
    if (!space || !['location', 'hyperspace_lane', 'facility'].includes(space.type)) {
        return;
    }

    DOMElements.modalPropertyName.textContent = space.name;
    DOMElements.modalPropertyType.textContent = space.type.replace('_', ' ').toUpperCase();
    DOMElements.modalPropertyPrice.textContent = space.price;
    DOMElements.modalPropertyOwner.textContent = space.owner !== null ? state.players[space.owner].name : 'Unowned';
    DOMElements.modalPropertyMortgaged.textContent = space.mortgaged ? 'Yes' : 'No';
    DOMElements.modalPropertyMortgageValue.textContent = space.price / 2;

    DOMElements.modalPropertyColorBar.className = 'color-bar';
    if (space.colorGroup) {
        DOMElements.modalPropertyColorBar.classList.add(space.colorGroup);
    } else {
        DOMElements.modalPropertyColorBar.style.backgroundColor = 'transparent';
    }

    DOMElements.modalPropertyRentList.innerHTML = '';

    if (space.type === 'location') {
        DOMElements.modalPropertyHousesRow.style.display = 'block';
        DOMElements.modalPropertyHouseCostRow.style.display = 'block';
        DOMElements.modalPropertyHouses.textContent = space.houses === 5 ? 'Fortress' : space.houses;
        DOMElements.modalPropertyHouseCost.textContent = space.houseCost;

        DOMElements.modalPropertyRentList.innerHTML += `<li><strong>Rent:</strong> ₡${space.rent[0]}</li>`;
        DOMElements.modalPropertyRentList.innerHTML += `<li>With 1 Dwelling: ₡${space.rent[1]}</li>`;
        DOMElements.modalPropertyRentList.innerHTML += `<li>With 2 Dwellings: ₡${space.rent[2]}</li>`;
        DOMElements.modalPropertyRentList.innerHTML += `<li>With 3 Dwellings: ₡${space.rent[3]}</li>`;
        DOMElements.modalPropertyRentList.innerHTML += `<li>With 4 Dwellings: ₡${space.rent[4]}</li>`;
        DOMElements.modalPropertyRentList.innerHTML += `<li>With FORTRESS: ₡${space.rent[5]}</li>`;
    } else if (space.type === 'hyperspace_lane') {
        DOMElements.modalPropertyHousesRow.style.display = 'none';
        DOMElements.modalPropertyHouseCostRow.style.display = 'none';
        DOMElements.modalPropertyRentList.innerHTML += `<li><strong>Rent (1 Lane):</strong> ₡${space.rent[0]}</li>`;
        DOMElements.modalPropertyRentList.innerHTML += `<li><strong>Rent (2 Lanes):</strong> ₡${space.rent[1]}</li>`;
        DOMElements.modalPropertyRentList.innerHTML += `<li><strong>Rent (3 Lanes):</strong> ₡${space.rent[2]}</li>`;
        DOMElements.modalPropertyRentList.innerHTML += `<li><strong>Rent (4 Lanes):</strong> ₡${space.rent[3]}</li>`;
    } else if (space.type === 'facility') {
        DOMElements.modalPropertyHousesRow.style.display = 'none';
        DOMElements.modalPropertyHouseCostRow.style.display = 'none';
        DOMElements.modalPropertyRentList.innerHTML += `<li><strong>Rent (1 Facility):</strong> 4 times amount shown on dice</li>`;
        DOMElements.modalPropertyRentList.innerHTML += `<li><strong>Rent (2 Facilities):</strong> 10 times amount shown on dice</li>`;
    }

    DOMElements.propertyModalOverlay.style.display = 'flex';
}

DOMElements.hidePropertyModal = function() {
    DOMElements.propertyModalOverlay.style.display = 'none';
}

DOMElements.toggleDebugControls = function() {
    if (DOMElements.debugControlsDiv.style.display === 'none') {
        DOMElements.debugControlsDiv.style.display = 'flex';
        populateDebugPlayerSelects();
        populateDebugSpaceSelect();
        populateDebugPropertySelects();
    } else {
        DOMElements.debugControlsDiv.style.display = 'none';
    }
}

export function populateDebugPlayerSelects() {
    const playerOptions = state.players.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    DOMElements.debugMovePlayerSelect.innerHTML = `<option value="">-- Select Player --</option>` + playerOptions;
    DOMElements.debugJailPlayerSelect.innerHTML = `<option value="">-- Select Player --</option>` + playerOptions;
    DOMElements.debugOwnerSelect.innerHTML = `<option value="">-- Select Owner --</option><option value="bank">Bank</option>` + playerOptions;
    DOMElements.debugMoneyPlayerSelect.innerHTML = `<option value="">-- Select Player --</option>` + playerOptions;
}

export function populateDebugSpaceSelect() {
    const spaceOptions = board.map(s => `<option value="${s.id}">${s.name} (ID: ${s.id})</option>`).join('');
    DOMElements.debugMoveSpaceSelect.innerHTML = `<option value="">-- Select Space --</option>` + spaceOptions;
}

export function populateDebugPropertySelects() {
    const propertyOptions = board.filter(s => ['location', 'hyperspace_lane', 'facility'].includes(s.type))
                                .map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    DOMElements.debugPropertySelect.innerHTML = `<option value="">-- Select Holding --</option>` + propertyOptions;

    const housePropertyOptions = board.filter(s => s.type === 'location')
                                    .map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    DOMElements.debugHousePropertySelect.innerHTML = `<option value="">-- Select Location --</option>` + housePropertyOptions;
}