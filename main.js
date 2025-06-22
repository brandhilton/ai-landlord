import { DOMElements } from './ui.js';
import {
    startGame,
    rollDice,
    endTurn,
    mortgageProperty,
    unmortgageProperty,
    sellHouse,
    // buildHouse, // REMOVED this line as it's not directly exported
    payBail,
    useJailCard,
    showTradeModal,
    endTrade,
    handleSendProposal,
    updateTradeModalAssets,
    handleAcceptTrade,
    handleRejectTrade,
    handlePlaceBid,
    handlePass,
    debugMovePlayer,
    debugSimulateRoll,
    debugChangeOwner,
    debugSetHouses,
    debugSetMoney,
    debugSendToJail
    // showPropertyManagementActions is internal to game.js and called by setControls etc.
    // showBuildHouseDialog is also internal to game.js
} from './game.js';

// --- Event Listeners ---
DOMElements.numPlayersInput.addEventListener('change', () => {
    const num = parseInt(DOMElements.numPlayersInput.value);
    DOMElements.playerNameInputsDiv.innerHTML = '';
    for (let i = 0; i < num; i++) {
        const group = document.createElement('div');
        group.className = 'player-input-group';
        group.innerHTML = `<label for="player-name-${i}">Player ${i + 1} Name:</label>
                           <input type="text" id="player-name-${i}" value="Player ${i + 1}">`;
        DOMElements.playerNameInputsDiv.appendChild(group);
    }
});

DOMElements.startGameBtn.addEventListener('click', startGame);
DOMElements.rollDiceBtn.addEventListener('click', () => rollDice());
DOMElements.endTurnBtn.addEventListener('click', endTurn);

DOMElements.mortgagePropertyBtn.addEventListener('click', () => {
    const propId = parseInt(DOMElements.mortgageSelect.value);
    if (!isNaN(propId)) mortgageProperty(propId);
});
DOMElements.unmortgagePropertyBtn.addEventListener('click', () => {
    const propId = parseInt(DOMElements.unmortgageSelect.value);
    if (!isNaN(propId)) unmortgageProperty(propId);
});

DOMElements.sellHouseBtn.addEventListener('click', () => {
    const propId = parseInt(DOMElements.sellHouseSelect.value);
    if (!isNaN(propId)) sellHouse(propId);
});

// The buildHouseBtn (#build-house-btn) in index.html gets its event listener
// dynamically assigned within game.js -> showPropertyManagementActions -> which sets an onclick
// to call showBuildHouseDialog. So, no direct listener needed here for that generic button.

DOMElements.payBailBtn.addEventListener('click', payBail);
DOMElements.useJailCardBtn.addEventListener('click', useJailCard);

DOMElements.gameBoardDiv.addEventListener('click', (event) => {
    const clickedSpace = event.target.closest('.board-space');
    if (clickedSpace && clickedSpace.dataset.spaceId) {
        const spaceId = parseInt(clickedSpace.dataset.spaceId);
        if (typeof DOMElements.showPropertyModal === 'function') {
            DOMElements.showPropertyModal(spaceId);
        }
    }
});

if (DOMElements.propertyModalCloseBtn) {
    DOMElements.propertyModalCloseBtn.addEventListener('click', () => {
        if (typeof DOMElements.hidePropertyModal === 'function') {
            DOMElements.hidePropertyModal();
        }
    });
}
if (DOMElements.propertyModalOverlay) {
    DOMElements.propertyModalOverlay.addEventListener('click', (event) => {
        if (event.target === DOMElements.propertyModalOverlay) {
            if (typeof DOMElements.hidePropertyModal === 'function') {
                DOMElements.hidePropertyModal();
            }
        }
    });
}

DOMElements.auctionPlaceBidBtn.addEventListener('click', handlePlaceBid);
DOMElements.auctionWithdrawBtn.addEventListener('click', handlePass);

DOMElements.proposeTradeBtn.addEventListener('click', showTradeModal);
DOMElements.cancelTradeBtn.addEventListener('click', endTrade);
DOMElements.sendProposalBtn.addEventListener('click', handleSendProposal);
DOMElements.tradePartnerSelect.addEventListener('change', updateTradeModalAssets); // This needs to be a direct function call
DOMElements.acceptTradeBtn.addEventListener('click', handleAcceptTrade);
DOMElements.rejectTradeBtn.addEventListener('click', handleRejectTrade);

DOMElements.numPlayersInput.dispatchEvent(new Event('change'));

document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        if (typeof DOMElements.toggleDebugControls === 'function') {
            DOMElements.toggleDebugControls();
        }
    }
});

DOMElements.debugMoveBtn.addEventListener('click', debugMovePlayer);
DOMElements.debugRollBtn.addEventListener('click', debugSimulateRoll);
DOMElements.debugChangeOwnerBtn.addEventListener('click', debugChangeOwner);
DOMElements.debugSetHousesBtn.addEventListener('click', debugSetHouses);
DOMElements.debugSetMoneyBtn.addEventListener('click', debugSetMoney);
DOMElements.debugSendToJailBtn.addEventListener('click', debugSendToJail);