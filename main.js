import { DOMElements } from './ui.js';
import {
    startGame,
    rollDice,
    endTurn,
    mortgageProperty,
    unmortgageProperty,
    sellHouse,
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
    mortgageProperty(propId);
});
DOMElements.unmortgagePropertyBtn.addEventListener('click', () => {
    const propId = parseInt(DOMElements.unmortgageSelect.value);
    unmortgageProperty(propId);
});
DOMElements.sellHouseBtn.addEventListener('click', () => {
    const propId = parseInt(DOMElements.sellHouseSelect.value);
    sellHouse(propId);
});

DOMElements.payBailBtn.addEventListener('click', payBail);
DOMElements.useJailCardBtn.addEventListener('click', useJailCard);

// Event listener for clicking on board spaces to show property info
DOMElements.gameBoardDiv.addEventListener('click', (event) => {
    const clickedSpace = event.target.closest('.board-space');
    if (clickedSpace && clickedSpace.dataset.spaceId) {
        const spaceId = parseInt(clickedSpace.dataset.spaceId);
        DOMElements.showPropertyModal(spaceId);
    }
});

// Event listeners for closing the modal
DOMElements.propertyModalCloseBtn.addEventListener('click', DOMElements.hidePropertyModal);
DOMElements.propertyModalOverlay.addEventListener('click', (event) => {
    if (event.target === DOMElements.propertyModalOverlay) {
        DOMElements.hidePropertyModal();
    }
});

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
        DOMElements.toggleDebugControls();
    }
});

DOMElements.debugMoveBtn.addEventListener('click', debugMovePlayer);
DOMElements.debugRollBtn.addEventListener('click', debugSimulateRoll);
DOMElements.debugChangeOwnerBtn.addEventListener('click', debugChangeOwner);
DOMElements.debugSetHousesBtn.addEventListener('click', debugSetHouses);
DOMElements.debugSetMoneyBtn.addEventListener('click', debugSetMoney);
DOMElements.debugSendToJailBtn.addEventListener('click', debugSendToJail);