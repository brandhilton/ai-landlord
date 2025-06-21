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

    // Functions attached to DOMElements object
    showPropertyModal: function(spaceId) {
        const space = board[spaceId];
        if (!space || !['location', 'hyperspace_lane', 'facility'].includes(space.type)) {
            return;
        }

        this.modalPropertyName.textContent = space.name;
        this.modalPropertyType.textContent = space.type.replace('_', ' ').toUpperCase();
        this.modalPropertyPrice.textContent = space.price;
        this.modalPropertyOwner.textContent = space.owner !== null && state.players[space.owner] ? state.players[space.owner].name : 'Unowned';
        this.modalPropertyMortgaged.textContent = space.mortgaged ? 'Yes' : 'No';
        this.modalPropertyMortgageValue.textContent = space.price / 2;

        this.modalPropertyColorBar.className = 'color-bar'; // Reset classes
        if (space.colorGroup) {
            this.modalPropertyColorBar.classList.add(space.colorGroup);
        } else {
            this.modalPropertyColorBar.style.backgroundColor = 'transparent'; // Fallback for non-colored groups
        }

        this.modalPropertyRentList.innerHTML = '';

        if (space.type === 'location') {
            this.modalPropertyHousesRow.style.display = 'block';
            this.modalPropertyHouseCostRow.style.display = 'block';
            this.modalPropertyHouses.textContent = space.houses === 5 ? 'Fortress' : space.houses;
            this.modalPropertyHouseCost.textContent = space.houseCost;

            this.modalPropertyRentList.innerHTML += `<li><strong>Rent:</strong> ₡${space.rent[0]}</li>`;
            for (let i = 1; i <= 4; i++) {
                this.modalPropertyRentList.innerHTML += `<li>With ${i} Dwelling${i > 1 ? 's' : ''}: ₡${space.rent[i]}</li>`;
            }
            this.modalPropertyRentList.innerHTML += `<li>With FORTRESS: ₡${space.rent[5]}</li>`;
        } else if (space.type === 'hyperspace_lane') {
            this.modalPropertyHousesRow.style.display = 'none';
            this.modalPropertyHouseCostRow.style.display = 'none';
            for (let i = 0; i < space.rent.length; i++) {
                this.modalPropertyRentList.innerHTML += `<li><strong>Rent (${i + 1} Lane${i > 0 ? 's' : ''}):</strong> ₡${space.rent[i]}</li>`;
            }
        } else if (space.type === 'facility') {
            this.modalPropertyHousesRow.style.display = 'none';
            this.modalPropertyHouseCostRow.style.display = 'none';
            this.modalPropertyRentList.innerHTML += `<li><strong>Rent (1 Facility):</strong> 4 times amount shown on dice</li>`;
            this.modalPropertyRentList.innerHTML += `<li><strong>Rent (2 Facilities):</strong> 10 times amount shown on dice</li>`;
        }

        this.propertyModalOverlay.style.display = 'flex';
    },

    hidePropertyModal: function() {
        this.propertyModalOverlay.style.display = 'none';
    },

    toggleDebugControls: function() {
        if (this.debugControlsDiv.style.display === 'none' || this.debugControlsDiv.style.display === '') {
            this.debugControlsDiv.style.display = 'flex';
            populateDebugPlayerSelects();
            populateDebugSpaceSelect();
            populateDebugPropertySelects();
        } else {
            this.debugControlsDiv.style.display = 'none';
        }
    }
};

// --- UI Functions ---
export function logMessage(message, type = 'info') {
    const div = document.createElement('div');
    div.textContent = message;
    div.className = type;
    DOMElements.messageLog.prepend(div);
    if (DOMElements.messageLog.children.length > 50) {
        DOMElements.messageLog.removeChild(DOMElements.messageLog.lastChild);
    }
}

export function updatePlayerInfo() {
    DOMElements.playerListContainer.innerHTML = '';
    if (!state.players || state.players.length === 0) return;

    state.players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = `player-status ${index === state.currentPlayerIndex ? 'current' : ''}`;
        let propertiesString = player.properties.map(pId => {
            const prop = board[pId];
            if (!prop) return 'Unknown Holding';
            return prop.name +
                   (prop.mortgaged ? ' (M)' : '') +
                   (prop.houses > 0 ? ` (D:${prop.houses === 5 ? 'F' : prop.houses})` : '');
        }).join(', ') || 'None';

        playerDiv.innerHTML = `
            <h4>${player.name} (P${player.id + 1})</h4>
            <ul>
                <li>Credits: ₡${player.money}</li>
                <li>Location: ${board[player.position] ? board[player.position].name : 'Unknown'}</li>
                ${player.inJail ? `<li><span style="color:red;">In Detention Block (Turn ${player.jailTurns}/3)</span></li>` : ''}
                ${player.getOutOfJailFreeCards > 0 ? `<li>Get Out of Detention Free Cards: ${player.getOutOfJailFreeCards}</li>` : ''}
                <li>Holdings: ${propertiesString}</li>
            </ul>
        `;
        DOMElements.playerListContainer.appendChild(playerDiv);
    });
    if (state.players[state.currentPlayerIndex]) {
        DOMElements.currentPlayerDisplay.textContent = `Current Player: ${state.players[state.currentPlayerIndex].name}`;
    } else if (state.players.length > 0) {
        DOMElements.currentPlayerDisplay.textContent = `Current Player: ${state.players[0].name}`;
    } else {
        DOMElements.currentPlayerDisplay.textContent = `Current Player: -`;
    }
}

export function updateBoardUI() {
    document.querySelectorAll('.token').forEach(token => token.remove());

    if (state.players) {
        state.players.forEach(player => {
            const spaceDiv = document.getElementById(`space-${player.position}`);
            if (spaceDiv) {
                const token = document.createElement('div');
                token.className = `token p${player.id}`;
                if (player.position === 10 && player.inJail) {
                    token.classList.add('in-jail-position');
                }
                spaceDiv.appendChild(token);
            }
        });
    }

    board.forEach(space => {
        if (['location', 'hyperspace_lane', 'facility'].includes(space.type)) {
            const spaceDiv = document.getElementById(`space-${space.id}`);
            if (spaceDiv) {
                let ownerSpan = spaceDiv.querySelector('.space-owner');
                if (!ownerSpan) { // Should exist if createBoardUI was thorough
                    ownerSpan = document.createElement('div');
                    ownerSpan.className = 'space-owner';
                    spaceDiv.appendChild(ownerSpan); // Fallback append
                }
                if (space.owner !== null && state.players && state.players[space.owner]) {
                    ownerSpan.textContent = `Owner: ${state.players[space.owner].name}`;
                    ownerSpan.style.color = space.mortgaged ? 'red' : 'green'; // Original colors
                } else {
                    ownerSpan.textContent = '';
                }

                if (space.type === 'location') {
                    let dwellingContainer = spaceDiv.querySelector('.dwelling-container');
                    if (!dwellingContainer) { // Should exist
                        dwellingContainer = document.createElement('div');
                        dwellingContainer.className = 'dwelling-container';
                        spaceDiv.appendChild(dwellingContainer); // Fallback append
                    }
                    dwellingContainer.innerHTML = '';

                    if (space.houses === 5) {
                        const fortress = document.createElement('div');
                        fortress.className = 'fortress';
                        dwellingContainer.appendChild(fortress);
                    } else if (space.houses > 0) {
                        for (let i = 0; i < space.houses; i++) {
                            const dwelling = document.createElement('div');
                            dwelling.className = 'dwelling';
                            dwellingContainer.appendChild(dwelling);
                        }
                    }
                }
            }
        }
    });
}

export function createBoardUI() {
    DOMElements.gameBoardDiv.innerHTML = '';
    board.forEach((space, index) => {
        const spaceDiv = document.createElement('div');
        spaceDiv.id = `space-${space.id}`;
        spaceDiv.classList.add('board-space');
        spaceDiv.dataset.spaceId = space.id;
        if ([0, 10, 20, 30].includes(space.id)) {
            spaceDiv.classList.add('corner');
        }

        if (space.id >= 0 && space.id <= 10) { spaceDiv.style.gridArea = `11 / ${11 - space.id}`; }
        else if (space.id >= 11 && space.id <= 19) { spaceDiv.style.gridArea = `${11 - (space.id - 10)} / 1`; }
        else if (space.id >= 20 && space.id <= 30) { spaceDiv.style.gridArea = `1 / ${space.id - 19}`; }
        else if (space.id >= 31 && space.id <= 39) { spaceDiv.style.gridArea = `${(space.id - 29)} / 11`; }

        if (space.type === 'location' || space.type === 'hyperspace_lane' || space.type === 'facility') {
            const colorBar = document.createElement('div');
            colorBar.className = `property-color-bar ${space.colorGroup || ''}`;
            spaceDiv.appendChild(colorBar);
        }

        // Dwelling container is created for locations (it's absolute, populated by updateBoardUI)
        if (space.type === 'location') {
            const dwellingContainer = document.createElement('div');
            dwellingContainer.className = 'dwelling-container';
            spaceDiv.appendChild(dwellingContainer);
        }

        const nameDiv = document.createElement('div');
        nameDiv.className = 'space-name';
        nameDiv.textContent = space.name;
        spaceDiv.appendChild(nameDiv);

        if (space.price) {
            const priceDiv = document.createElement('div');
            priceDiv.className = 'space-price';
            priceDiv.textContent = `₡${space.price}`;
            spaceDiv.appendChild(priceDiv);
        }
        
        // Owner div is created here as an empty placeholder (it's absolute, populated by updateBoardUI)
        const ownerDiv = document.createElement('div');
        ownerDiv.className = 'space-owner';
        spaceDiv.appendChild(ownerDiv);

        DOMElements.gameBoardDiv.appendChild(spaceDiv);
    });
}

export function populateDebugPlayerSelects() {
    if (!state.players) return;
    const playerOptions = state.players.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    const defaultOption = `<option value="">-- Select Player --</option>`;
    DOMElements.debugMovePlayerSelect.innerHTML = defaultOption + playerOptions;
    DOMElements.debugJailPlayerSelect.innerHTML = defaultOption + playerOptions;
    DOMElements.debugOwnerSelect.innerHTML = `<option value="">-- Select Owner --</option><option value="bank">Bank</option>` + playerOptions;
    DOMElements.debugMoneyPlayerSelect.innerHTML = defaultOption + playerOptions;
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