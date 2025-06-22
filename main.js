import { DOMElements } from './ui.js';
import {
    startGame,
    rollDice,
    endTurn,
    mortgageProperty,
    unmortgageProperty,
    sellHouse, // This should be the correct function for selling
    buildHouse, // Assuming you might have a separate buildHouse function or it's handled by showBuildHouseDialog
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
    if (!isNaN(propId)) mortgageProperty(propId); // Check if value is a number
});
DOMElements.unmortgagePropertyBtn.addEventListener('click', () => {
    const propId = parseInt(DOMElements.unmortgageSelect.value);
    if (!isNaN(propId)) unmortgageProperty(propId); // Check if value is a number
});

DOMElements.sellHouseBtn.addEventListener('click', () => {
    const propId = parseInt(DOMElements.sellHouseSelect.value);
    if (!isNaN(propId)) sellHouse(propId); // Ensure propId is valid before calling
});

// The buildHouseBtn might not need a direct listener here if showBuildHouseDialog in game.js handles its own confirm/cancel
// However, if buildHouse in game.js is meant to be called directly:
// DOMElements.buildHouseBtn.addEventListener('click', () => {
//     // This assumes buildHouse expects a property ID or that showBuildHouseDialog is modal
//     // If buildHouseBtn itself needs to pick from a select, that logic needs to be here or in game.js
//     // For now, assuming game.js's showPropertyManagementActions or showBuildHouseDialog handles this.
// });


DOMElements.payBailBtn.addEventListener('click', payBail);
DOMElements.useJailCardBtn.addEventListener('click', useJailCard);

// Event listener for clicking on board spaces to show property info
DOMElements.gameBoardDiv.addEventListener('click', (event) => {
    const clickedSpace = event.target.closest('.board-space');
    if (clickedSpace && clickedSpace.dataset.spaceId) {
        const spaceId = parseInt(clickedSpace.dataset.spaceId);
        // Check if DOMElements.showPropertyModal is a function before calling
        if (typeof DOMElements.showPropertyModal === 'function') {
            DOMElements.showPropertyModal(spaceId);
        }
    }
});

// MODIFIED: Ensure DOMElements.hidePropertyModal is correctly called
// Event listeners for closing the modal
if (DOMElements.propertyModalCloseBtn) { // Check if element exists
    DOMElements.propertyModalCloseBtn.addEventListener('click', () => {
        if (typeof DOMElements.hidePropertyModal === 'function') {
            DOMElements.hidePropertyModal();
        }
    });
}
if (DOMElements.propertyModalOverlay) { // Check if element exists
    DOMElements.propertyModalOverlay.addEventListener('click', (event) => {
        if (event.target === DOMElements.propertyModalOverlay) {
            if (typeof DOMElements.hidePropertyModal === 'function') {
                DOMElements.hidePropertyModal();
            }
        }
    });
}


// Auction Event Listeners
DOMElements.auctionPlaceBidBtn.addEventListener('click', handlePlaceBid);
DOMElements.auctionWithdrawBtn.addEventListener('click', handlePass);

// Trade Event Listeners
DOMElements.proposeTradeBtn.addEventListener('click', showTradeModal);
DOMElements.cancelTradeBtn.addEventListener('click', endTrade);
DOMElements.sendProposalBtn.addEventListener('click', handleSendProposal);
DOMElements.tradePartnerSelect.addEventListener('change', updateTradeModalAssets);
DOMElements.acceptTradeBtn.addEventListener('click', handleAcceptTrade);
DOMElements.rejectTradeBtn.addEventListener('click', handleRejectTrade);

// Initial setup for player name inputs
DOMElements.numPlayersInput.dispatchEvent(new Event('change'));

// --- Debug Control Listeners ---
document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        // Check if DOMElements.toggleDebugControls is a function before calling
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