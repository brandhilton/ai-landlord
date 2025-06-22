import { board, chanceCards, communityChestCards } from './config.js';
import { DOMElements, logMessage, updatePlayerInfo, updateBoardUI, createBoardUI, populateDebugPlayerSelects, populateDebugSpaceSelect, populateDebugPropertySelects } from './ui.js';

// --- Game State Variables ---
export let state = {
    players: [],
    currentPlayerIndex: 0,
    diceRoll: [0, 0],
    doublesCount: 0, // This is a global counter, player.doublesRolledThisTurn is per player per turn.
    gameOver: false,
    currentActionPending: null, // e.g., 'buy', 'manage'
    chanceCardsShuffled: [],
    communityChestCardsShuffled: [],
    isAuctionActive: false,
    auctionPropertyId: null,
    auctionBidders: [],
    currentBid: 0,
    highestBidderId: null,
    auctionCurrentBidderIndex: 0,
    isTradeActive: false,
    tradePartnerId: null,
    tradeOffer: {},
    tradeRequest: {}
};

// --- Utility Functions ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getPropertiesByColor(colorGroup) {
    return board.filter(space => space.type === 'location' && space.colorGroup === colorGroup);
}

function getHyperspaceLanes() { // Not currently used, but kept for potential future use
    return board.filter(space => space.type === 'hyperspace_lane');
}

function getFacilities() { // Not currently used, but kept
    return board.filter(space => space.type === 'facility');
}

function checkMonopoly(player, colorGroup) {
    const propertiesInGroup = getPropertiesByColor(colorGroup);
    if (!propertiesInGroup || propertiesInGroup.length === 0) return false;
    // Must own all and none can be mortgaged for full monopoly rent/building
    return propertiesInGroup.every(prop => prop.owner === player.id && !prop.mortgaged);
}


function getPlayerOwnedProperties(player, type = null, includeMortgaged = false) {
    return board.filter(space =>
        space.owner === player.id &&
        (type ? space.type === type : ['location', 'hyperspace_lane', 'facility'].includes(space.type)) &&
        (includeMortgaged || !space.mortgaged) // If includeMortgaged is true, this condition is always true
    );
}


function findNextSpaceType(startPosition, type) {
    for (let i = 1; i <= board.length; i++) {
        const targetIndex = (startPosition + i) % board.length;
        const space = board[targetIndex];
        if (space.type === type) {
            return space;
        }
    }
    return null;
}

function calculateFacilityRent(owner, diceSum) {
    const ownedFacilities = getPlayerOwnedProperties(owner, 'facility').filter(u => !u.mortgaged).length;
    if (ownedFacilities === 1) {
        return diceSum * 4;
    } else if (ownedFacilities === 2) {
        return diceSum * 10;
    }
    return 0;
}

function calculateHyperspaceLaneRent(owner, laneSpace) {
    const ownedHyperspaceLanes = getPlayerOwnedProperties(owner, 'hyperspace_lane').filter(r => !r.mortgaged).length;
    if (ownedHyperspaceLanes > 0 && ownedHyperspaceLanes <= laneSpace.rent.length) {
        return laneSpace.rent[ownedHyperspaceLanes - 1];
    }
    return 0;
}

// --- Game Logic ---
export function startGame() {
    const numPlayers = parseInt(DOMElements.numPlayersInput.value);
    state.players = [];
    for (let i = 0; i < numPlayers; i++) {
        const nameInput = document.getElementById(`player-name-${i}`);
        state.players.push({
            id: i,
            name: nameInput.value || `Player ${i + 1}`,
            money: 1500,
            position: 0,
            // properties: [], // Removed as board is the master list of ownership
            inJail: false,
            jailTurns: 0,
            doublesRolledThisTurn: 0,
            hasRolled: false,
            getOutOfJailFreeCards: 0
        });
    }

    // Reset board properties for a new game
    board.forEach(space => {
        if (space.type === 'location' || space.type === 'hyperspace_lane' || space.type === 'facility') {
            space.owner = null;
            if (space.type === 'location') space.houses = 0;
            space.mortgaged = false;
        }
    });

    state.chanceCardsShuffled = shuffleArray([...chanceCards]);
    state.communityChestCardsShuffled = shuffleArray([...communityChestCards]);
    state.currentPlayerIndex = 0;
    state.gameOver = false;
    state.diceRoll = [0,0];
    state.doublesCount = 0; // This global one seems unused, player.doublesRolledThisTurn is key
    state.currentActionPending = null;


    DOMElements.setupScreen.style.display = 'none';
    DOMElements.gameScreen.style.display = 'block';

    createBoardUI();
    updatePlayerInfo();
    updateBoardUI();
    logMessage("Game Started!", "success");
    // logMessage(`It's ${state.players[state.currentPlayerIndex].name}'s turn.`); // setControlsForTurnStart will log this
    setControlsForTurnStart();
    refreshDebugControls();
}

function refreshDebugControls() {
    populateDebugPlayerSelects();
    populateDebugSpaceSelect();
    populateDebugPropertySelects();
}

export function rollDice(simulatedDie1 = null, simulatedDie2 = null) {
    if (state.isAuctionActive || state.isTradeActive || state.gameOver) return;
    const player = state.players[state.currentPlayerIndex];

    if (player.hasRolled && !(player.doublesRolledThisTurn > 0 && player.doublesRolledThisTurn < 3 && !player.inJail) ) {
        logMessage("You cannot roll again now.", "warning"); return;
    }
    if (player.inJail && player.hasRolled && player.doublesRolledThisTurn === 0) {
        logMessage("You have already attempted your roll for this turn in Detention.", "warning"); return;
    }

    const die1 = simulatedDie1 !== null ? simulatedDie1 : Math.floor(Math.random() * 6) + 1;
    const die2 = simulatedDie2 !== null ? simulatedDie2 : Math.floor(Math.random() * 6) + 1;
    state.diceRoll = [die1, die2];
    DOMElements.diceDisplay.textContent = `Dice: ${die1}, ${die2}`;
    logMessage(`${player.name} rolled a ${die1} and a ${die2} (total ${die1 + die2}).`);
    player.hasRolled = true;
    state.currentActionPending = null;

    if (die1 === die2) {
        if (player.inJail) {
            logMessage(`${player.name} rolled doubles (${die1}, ${die2}) and got out of the Detention Block!`, 'success');
            player.inJail = false; player.jailTurns = 0; player.doublesRolledThisTurn = 0;
            movePlayer(player, die1 + die2); // Calls landOnSpace -> setControls
            return;
        }
        player.doublesRolledThisTurn++;
        logMessage(`${player.name} rolled doubles! (${player.doublesRolledThisTurn} time(s))`, 'warning');
        if (player.doublesRolledThisTurn === 3) {
            logMessage(`${player.name} rolled 3 consecutive doubles! Go directly to Detention Block!`, 'error');
            sendToJail(player); // Calls setControls
            return;
        }
        movePlayer(player, die1 + die2); // Calls landOnSpace -> setControls
    } else { // Not doubles
        player.doublesRolledThisTurn = 0;
        if (player.inJail) {
            handleJailRoll(player, die1, die2); // Calls setControls
        } else {
            movePlayer(player, die1 + die2); // Calls landOnSpace -> setControls
        }
    }
}

function movePlayer(player, steps) {
    const oldPosition = player.position;
    player.position = (player.position + steps) % board.length;
    logMessage(`${player.name} moved from ${board[oldPosition].name} to ${board[player.position].name}.`);
    if (player.position < oldPosition && !player.inJail) {
        player.money += 200;
        logMessage(`${player.name} passed START and collected ₡200!`);
    }
    updatePlayerInfo(); updateBoardUI();
    landOnSpace(player);
}

function sendToJail(player) {
    player.position = 10; player.inJail = true; player.jailTurns = 0;
    player.doublesRolledThisTurn = 0; player.hasRolled = true;
    logMessage(`${player.name} is now in the Detention Block!`);
    updatePlayerInfo(); updateBoardUI(); state.currentActionPending = null;
    setControls();
}

function handleJailRoll(player, die1, die2) { // Called when player is in jail and did NOT roll doubles
    player.jailTurns++;
    logMessage(`${player.name} did not roll doubles. Still in Detention Block. Turns left: ${3 - player.jailTurns}.`);
    if (player.jailTurns >= 3) {
        logMessage(`${player.name} must pay or use a card next turn if still in Detention.`, "warning");
    }
    state.currentActionPending = null;
    setControls(); // Update buttons: roll disabled, end turn enabled, jail options available
}

function landOnSpace(player) {
    const space = board[player.position];
    logMessage(`${player.name} landed on ${space.name}.`);
    state.currentActionPending = null;

    switch (space.type) {
        case 'location': case 'hyperspace_lane': case 'facility':
            if (space.owner === null) {
                if (player.money >= space.price) state.currentActionPending = 'buy';
                else { logMessage(`${player.name} cannot afford ${space.name}. Auctioning...`, 'warning'); startAuction(space.id); return; }
            } else if (space.owner !== player.id) {
                const owner = state.players.find(p => p.id === space.owner);
                if (!owner) { logMessage(`Error: Owner of ${space.name} not found.`, 'error'); break; }
                if (space.mortgaged) { logMessage(`${space.name} is mortgaged by ${owner.name}. No rent.`, 'info'); }
                else {
                    let rent = 0;
                    if (space.type === 'location') { rent = space.rent[space.houses]; if (space.houses === 0 && checkMonopoly(owner, space.colorGroup)) rent *= 2; }
                    else if (space.type === 'hyperspace_lane') rent = calculateHyperspaceLaneRent(owner, space);
                    else if (space.type === 'facility') rent = calculateFacilityRent(owner, state.diceRoll[0] + state.diceRoll[1]);
                    logMessage(`${space.name} is owned by ${owner.name}. Rent: ₡${rent}.`);
                    payMoney(player, owner, rent);
                }
            } else { state.currentActionPending = 'manage'; } // Landed on own property
            break;
        case 'tax': payMoney(player, 'bank', space.amount); break;
        case 'force_card': drawCard(player, state.chanceCardsShuffled, 'Force Card'); return;
        case 'supply_drop': drawCard(player, state.communityChestCardsShuffled, 'Supply Drop'); return;
        case 'send_to_detention': sendToJail(player); return;
        case 'detention_block': logMessage(`${player.name} is just visiting the Detention Block.`, 'info'); break;
        case 'start': case 'smugglers_hideout': logMessage(`${player.name} is on ${space.name}.`, 'info'); break;
        default: logMessage(`Landed on unhandled space type: ${space.type}`, 'warning');
    }
    setControls(); // Called after resolving the space action
}

function buyProperty(player, space) {
    if (player.money >= space.price && space.owner === null) {
        player.money -= space.price; space.owner = player.id;
        logMessage(`${player.name} bought ${space.name} for ₡${space.price}.`, 'success');
        state.currentActionPending = 'manage';
    } else { logMessage(`Could not buy ${space.name}.`, 'error'); state.currentActionPending = null; }
    updatePlayerInfo(); updateBoardUI();
    // showPropertyManagementActions(player); // Covered by setControls
    setControls();
}

function payMoney(fromPlayer, toRecipient, amount) {
    if (fromPlayer.money >= amount) {
        fromPlayer.money -= amount;
        if (toRecipient !== 'bank' && typeof toRecipient === 'object' && toRecipient !== null) {
            toRecipient.money += amount; logMessage(`${fromPlayer.name} paid ₡${amount} to ${toRecipient.name}.`);
        } else { logMessage(`${fromPlayer.name} paid ₡${amount} to the Bank.`); }
        updatePlayerInfo(); return true;
    } else {
        logMessage(`${fromPlayer.name} cannot pay ₡${amount}! Attempting to raise funds...`, 'warning');
        handleBankruptcy(fromPlayer, recipient, amount);
        return fromPlayer.money >= 0 && fromPlayer.money >= (recipient === 'bank' ? 0 : amount); // Check if covered after bankruptcy
    }
}

function handleBankruptcy(bankruptPlayer, recipient, debtAmount) { /* ... (full version from your upload) ... */
    logMessage(`${bankruptPlayer.name} is trying to cover a debt of ₡${debtAmount}.`);
    const ownedLocations = getPlayerOwnedProperties(bankruptPlayer, 'location', true);
    for (let i = 5; i > 0; i--) { if (bankruptPlayer.money >= debtAmount) break; ownedLocations.forEach(prop => { if (bankruptPlayer.money >= debtAmount) return; if (prop.houses === i) { prop.houses--; bankruptPlayer.money += prop.houseCost / 2; logMessage(`${bankruptPlayer.name} sold a ${i===5 ? 'Fortress' : 'Dwelling'} on ${prop.name} for ₡${prop.houseCost/2}. Credits: ₡${bankruptPlayer.money}`); updateBoardUI(); updatePlayerInfo();}}); }
    if (bankruptPlayer.money < debtAmount) { getPlayerOwnedProperties(bankruptPlayer, null, true).filter(p => !p.mortgaged).sort((a, b) => (a.price / 2) - (b.price / 2)).forEach(prop => { if (bankruptPlayer.money >= debtAmount) return; prop.mortgaged = true; bankruptPlayer.money += prop.price / 2; logMessage(`${bankruptPlayer.name} mortgaged ${prop.name} for ₡${prop.price / 2}. Credits: ₡${bankruptPlayer.money}`); updateBoardUI(); updatePlayerInfo(); }); }
    if (bankruptPlayer.money >= debtAmount) { logMessage(`${bankruptPlayer.name} managed to raise enough funds!`); payMoney(bankruptPlayer, recipient, debtAmount); return; } // Successfully paid after selling/mortgaging
    logMessage(`${bankruptPlayer.name} is bankrupt and out of the game! Assets go to ${recipient === 'bank' ? 'the Bank' : recipient.name}.`, 'error');
    const recipientPlayer = (recipient === 'bank' || recipient === bankruptPlayer) ? null : recipient;
    board.forEach(prop => { if (prop.owner === bankruptPlayer.id) { prop.owner = recipientPlayer ? recipientPlayer.id : null; prop.mortgaged = !!recipientPlayer; prop.houses = 0; logMessage(`${prop.name} ${recipientPlayer ? 'transferred (M)' : 'returned to Bank'}.`); } });
    if(recipientPlayer && bankruptPlayer.getOutOfJailFreeCards > 0){ recipientPlayer.getOutOfJailFreeCards += bankruptPlayer.getOutOfJailFreeCards; logMessage(`${recipientPlayer.name} receives ${bankruptPlayer.getOutOfJailFreeCards} Get Out of Detention Free card(s).`);}
    bankruptPlayer.money = -1; // Mark as officially bankrupt
    const wasCurrentPlayer = state.players[state.currentPlayerIndex]?.id === bankruptPlayer.id;
    state.players = state.players.filter(p => p.id !== bankruptPlayer.id);
    updatePlayerInfo(); updateBoardUI(); checkWinCondition();
    if (state.gameOver) return;
    if (wasCurrentPlayer && state.players.length > 0) {
        state.currentPlayerIndex = state.currentPlayerIndex % state.players.length; // Adjust if last player in array went bankrupt
        if (!state.players[state.currentPlayerIndex]) state.currentPlayerIndex = 0; // Fallback
        logMessage(`Advancing to next player due to bankruptcy of ${bankruptPlayer.name}.`);
        setControlsForTurnStart();
    } else if (state.players.length > 0) {
        setControls(); // Re-evaluate for current player if someone else went bankrupt
    }
}

function checkWinCondition() { /* ... (full version from your upload) ... */
    const activePlayers = state.players.filter(p => p.money >= 0);
    if (activePlayers.length === 1 && state.players.length === 1) {
        state.gameOver = true; logMessage(`${activePlayers[0].name} is the last player standing! ${activePlayers[0].name} wins!`, 'success');
        DOMElements.rollDiceBtn.disabled = true; DOMElements.endTurnBtn.disabled = true;
        if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display = 'none';
        if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'none';
        if(DOMElements.buyPropertyBtn) DOMElements.buyPropertyBtn.style.display = 'none';
    } else if (activePlayers.length === 0 && state.players.length === 0) {
        state.gameOver = true; logMessage("All players are bankrupt! No winner.", "error");
        DOMElements.rollDiceBtn.disabled = true; DOMElements.endTurnBtn.disabled = true;
    }
}

function drawCard(player, deck, cardType) { /* ... (full version from your upload, ensure setControls or landOnSpace is called) ... */
    if (deck.length === 0) { logMessage(`No ${cardType} cards left! Reshuffling.`, 'warning'); if (cardType === 'Force Card') state.chanceCardsShuffled = shuffleArray([...chanceCards]); else state.communityChestCardsShuffled = shuffleArray([...communityChestCards]); deck = (cardType === 'Force Card') ? state.chanceCardsShuffled : state.communityChestCardsShuffled; }
    const cardText = deck.shift(); deck.push(cardText); logMessage(`${player.name} drew a ${cardType}: "${cardText}"`);
    let movedByCard = false, oldPosition = player.position, landOnNewSpace = true;
    switch (cardText) { case "Advance to START (Collect ₡200)": player.position = 0; player.money += 200; logMessage(`${player.name} advanced to START and collected ₡200.`); movedByCard = true; landOnNewSpace = false; break; case "Advance to Starkiller Base. If you pass START, collect ₡200.": if (player.position > 24) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`);} player.position = 24; logMessage(`${player.name} advanced to Starkiller Base.`); movedByCard = true; break; case "Advance to Cloud City. If you pass START, collect ₡200.": if (player.position > 11) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`);} player.position = 11; logMessage(`${player.name} advanced to Cloud City.`); movedByCard = true; break; case "Advance to nearest Facility. If unowned, you may buy it from the Bank. If owned, pay owner 10 times amount shown on dice.": const nearestFacility = findNextSpaceType(oldPosition, 'facility'); if (nearestFacility) { if (nearestFacility.id < oldPosition && nearestFacility.id !==0) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`); } player.position = nearestFacility.id; logMessage(`${player.name} advanced to nearest Facility: ${nearestFacility.name}.`); movedByCard = true; } break; case "Advance to nearest Hyperspace Lane. If unowned, you may buy it from the Bank. If owned, pay owner twice the rental to which he/she is otherwise entitled.": const nearestLane = findNextSpaceType(oldPosition, 'hyperspace_lane'); if (nearestLane) { if (nearestLane.id < oldPosition && nearestLane.id !==0) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`); } player.position = nearestLane.id; logMessage(`${player.name} advanced to nearest Hyperspace Lane: ${nearestLane.name}.`); if (nearestLane.owner !== null && nearestLane.owner !== player.id && !nearestLane.mortgaged) { const owner = state.players.find(p=>p.id === nearestLane.owner); const rent = calculateHyperspaceLaneRent(owner, nearestLane) * 2; logMessage(`${player.name} pays ${owner.name} double rent of ₡${rent} for ${nearestLane.name}.`); payMoney(player, owner, rent); landOnNewSpace = false; } else { movedByCard = true; } } break; case "Bank pays you dividend of ₡50": player.money += 50; logMessage(`${player.name} collected ₡50 dividend.`); landOnNewSpace = false; break; case "Get Out of Detention Free Card": player.getOutOfJailFreeCards++; logMessage(`${player.name} received a Get Out of Detention Free Card.`); landOnNewSpace = false; break; case "Go back 3 spaces": player.position = (player.position - 3 + board.length) % board.length; logMessage(`${player.name} moved back 3 spaces to ${board[player.position].name}.`); movedByCard = true; break; case "Go to Detention Block – Go directly to Detention Block – Do not pass START, do not collect ₡200": sendToJail(player); landOnNewSpace = false; break; case "Make general repairs on all your holdings. For each Dwelling pay ₡25. For each Fortress pay ₡100.": let repairCost = 0; board.forEach(prop => { if (prop.owner === player.id && prop.type === 'location') { if (prop.houses === 5) repairCost += 100; else repairCost += prop.houses * 25; } }); if (repairCost > 0) { logMessage(`${player.name} pays ₡${repairCost} for repairs.`); payMoney(player, 'bank', repairCost); } else { logMessage(`${player.name} has no buildings, no repair costs.`); } landOnNewSpace = false; break; case "Pay poor tax of ₡15": payMoney(player, 'bank', 15); landOnNewSpace = false; break; case "Take a trip to Hyperspace Lane 1. If you pass START, collect ₡200.": if (player.position > 5) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`);} player.position = 5; logMessage(`${player.name} took a trip to Hyperspace Lane 1.`); movedByCard = true; break; case "Advance to Death Star Throne Room.": player.position = 39; logMessage(`${player.name} advanced to Death Star Throne Room.`); movedByCard = true; break; case "You have been elected Chairman of the Galactic Senate – Pay each player ₡50.": state.players.forEach(p => { if (p.id !== player.id) { payMoney(player, p, 50); } }); landOnNewSpace = false; break; case "Your loan matures. Collect ₡150": player.money += 150; logMessage(`${player.name} collected ₡150.`); landOnNewSpace = false; break; case "You have won a droid race competition. Collect ₡100": player.money += 100; logMessage(`${player.name} collected ₡100.`); landOnNewSpace = false; break; case "Bank error in your favor – Collect ₡200": player.money += 200; logMessage(`${player.name} collected ₡200.`); landOnNewSpace = false; break; case "Healer's fee – Pay ₡50": payMoney(player, 'bank', 50); landOnNewSpace = false; break; case "From sale of stolen goods you get ₡45.": player.money += 45; logMessage(`${player.name} collected ₡45.`); landOnNewSpace = false; break; case "Rebel Fund matures. Receive ₡100.": player.money += 100; logMessage(`${player.name} received ₡100.`); landOnNewSpace = false; break; case "Tax refund – Collect ₡20": player.money += 20; logMessage(`${player.name} collected ₡20.`); landOnNewSpace = false; break; case "It is your birth-cycle. Collect ₡10 from each player.": state.players.forEach(p => { if (p.id !== player.id) { if (p.money >= 10) { p.money -=10; player.money +=10; logMessage(`${p.name} paid ₡10 to ${player.name}.`); } else { payMoney(p, player, 10); } } }); updatePlayerInfo(); landOnNewSpace = false; break; case "Life insurance matures – Collect ₡100": player.money += 100; logMessage(`${player.name} collected ₡100.`); landOnNewSpace = false; break; case "Pay medical bay ₡100": payMoney(player, 'bank', 100); landOnNewSpace = false; break; case "Pay training fees of ₡50": payMoney(player, 'bank', 50); landOnNewSpace = false; break; case "Receive ₡25 bounty fee": player.money += 25; logMessage(`${player.name} collected ₡25.`); landOnNewSpace = false; break; case "You are assessed for orbital repairs – Pay ₡40 per Dwelling, ₡115 per Fortress": let repairCostCC = 0; board.forEach(prop => { if (prop.owner === player.id && prop.type === 'location') { if (prop.houses === 5) repairCostCC += 115; else repairCostCC += prop.houses * 40; } }); if (repairCostCC > 0) { logMessage(`${player.name} pays ₡${repairCostCC} for orbital repairs.`); payMoney(player, 'bank', repairCostCC); } else { logMessage(`${player.name} has no buildings, no repair costs.`); } landOnNewSpace = false; break; case "You have won second prize in a beauty contest – Collect ₡10": player.money += 10; logMessage(`${player.name} collected ₡10.`); landOnNewSpace = false; break; case "Inherit ₡100": player.money += 100; logMessage(`${player.name} inherited ₡100.`); landOnNewSpace = false; break; default: logMessage(`Unhandled card: "${cardText}" from ${cardType}.`, 'warning'); landOnNewSpace = false; }
    updatePlayerInfo(); updateBoardUI();
    if (movedByCard && landOnNewSpace && !player.inJail) landOnSpace(player); else setControls();
}

function showBuyPropertyAction(player, space) { /* ... (full version from your upload) ... */
    DOMElements.propertyActionsDiv.style.display = 'flex'; DOMElements.buyPropertyBtn.style.display = 'inline-block';
    DOMElements.buyPropertyBtn.onclick = () => { buyProperty(player, space); DOMElements.buyPropertyBtn.style.display = 'none'; state.currentActionPending = 'manage'; showPropertyManagementActions(player); setControls(); };
    DOMElements.buildHouseBtn.style.display = 'none'; DOMElements.sellHouseBtn.style.display = 'none'; DOMElements.sellHouseSelect.style.display = 'none'; DOMElements.mortgageSelect.style.display = 'none'; DOMElements.mortgagePropertyBtn.style.display = 'none'; DOMElements.unmortgageSelect.style.display = 'none'; DOMElements.unmortgagePropertyBtn.style.display = 'none';
}

function showPropertyManagementActions(player) {
    if (DOMElements.buyPropertyBtn) DOMElements.buyPropertyBtn.style.display = 'none';

    const buildableProperties = getPlayerOwnedProperties(player, 'location')
        .filter(prop => !prop.mortgaged && prop.houses < 5 && player.money >= prop.houseCost && checkMonopoly(player, prop.colorGroup));
    let actuallyBuildable = [];
    if (buildableProperties.length > 0) {
        const groups = {}; buildableProperties.forEach(p => { if (!groups[p.colorGroup]) groups[p.colorGroup] = []; groups[p.colorGroup].push(p); });
        for (const color in groups) { const groupProps = groups[color]; const minHousesInGroup = Math.min(...groupProps.map(p => p.houses)); groupProps.forEach(p => { if (p.houses === minHousesInGroup) actuallyBuildable.push(p); }); }
    }
    actuallyBuildable.sort((a,b) => a.houses - b.houses || a.id - b.id);
    DOMElements.buildHouseBtn.style.display = actuallyBuildable.length > 0 ? 'inline-block' : 'none';
    DOMElements.buildHouseBtn.onclick = actuallyBuildable.length > 0 ? () => showBuildHouseDialog(player, actuallyBuildable) : null;

    // MODIFIED: Filter for mortgagable properties
    const mortgagableProperties = getPlayerOwnedProperties(player, null, true) // Get all ownable (location, lane, facility)
        .filter(prop => {
            if (prop.mortgaged) return false; // Cannot mortgage if already mortgaged
            if (prop.type === 'location') {
                // For locations, check if ANY property in its color group has houses
                const groupProperties = getPropertiesByColor(prop.colorGroup);
                const groupHasHouses = groupProperties.some(pInGroup => pInGroup.owner === player.id && pInGroup.houses > 0);
                return !groupHasHouses; // Can mortgage ONLY if NO houses in the entire group
            }
            return true; // Non-location properties (utilities, railroads) can be mortgaged if they are unmortgaged
        });
    populateSelect(DOMElements.mortgageSelect, mortgagableProperties, 'Mortgage Holding');
    DOMElements.mortgageSelect.style.display = mortgagableProperties.length > 0 ? 'block' : 'none';
    DOMElements.mortgagePropertyBtn.style.display = mortgagableProperties.length > 0 ? 'inline-block' : 'none';
    DOMElements.mortgagePropertyBtn.disabled = true;

    const unmortgagableProperties = getPlayerOwnedProperties(player, null, true).filter(prop => prop.mortgaged && player.money >= Math.ceil(prop.price / 2 * 1.1));
    populateSelect(DOMElements.unmortgageSelect, unmortgagableProperties, 'Unmortgage Holding');
    DOMElements.unmortgageSelect.style.display = unmortgagableProperties.length > 0 ? 'block' : 'none';
    DOMElements.unmortgagePropertyBtn.style.display = unmortgagableProperties.length > 0 ? 'inline-block' : 'none';
    DOMElements.unmortgagePropertyBtn.disabled = true;

    const sellableHouseProperties = getPlayerOwnedProperties(player, 'location', true).filter(prop => prop.houses > 0);
    let actuallySellable = [];
    if(sellableHouseProperties.length > 0) {
        const groups = {}; sellableHouseProperties.forEach(p => { if (!groups[p.colorGroup]) groups[p.colorGroup] = []; groups[p.colorGroup].push(p); });
        for (const color in groups) { const groupProps = groups[color]; const maxHousesInGroup = Math.max(...groupProps.map(p => p.houses)); groupProps.forEach(p => { if (p.houses === maxHousesInGroup) actuallySellable.push(p); }); }
    }
    actuallySellable.sort((a,b) => b.houses - a.houses || a.id - b.id);
    populateSelect(DOMElements.sellHouseSelect, actuallySellable, 'Sell Dwelling');
    DOMElements.sellHouseSelect.style.display = actuallySellable.length > 0 ? 'block' : 'none';
    DOMElements.sellHouseBtn.style.display = actuallySellable.length > 0 ? 'inline-block' : 'none';
    DOMElements.sellHouseBtn.disabled = true;

    // Show property actions panel if any action button is visible
    if(DOMElements.propertyActionsDiv) {
        DOMElements.propertyActionsDiv.style.display = (
            DOMElements.buildHouseBtn.style.display !== 'none' ||
            DOMElements.mortgagePropertyBtn.style.display !== 'none' ||
            DOMElements.unmortgagePropertyBtn.style.display !== 'none' ||
            DOMElements.sellHouseBtn.style.display !== 'none'
        ) ? 'flex' : 'none';
    }
}

function populateSelect(selectElement, properties, defaultOptionText) { /* ... (full version from your upload) ... */
    selectElement.innerHTML = `<option value="">-- ${defaultOptionText} --</option>`; properties.forEach(prop => { const option = document.createElement('option'); option.value = prop.id; let text = prop.name; if (prop.mortgaged) text += ' (M)'; if (prop.type === 'location' && prop.houses > 0) text += ` (D: ${prop.houses === 5 ? 'F' : prop.houses})`; if (selectElement === DOMElements.unmortgageSelect && prop.mortgaged) { text += ` - Cost: ₡${Math.ceil(prop.price / 2 * 1.1)}`; } option.textContent = text; selectElement.appendChild(option); }); selectElement.disabled = properties.length === 0; const buttonToToggle = { [DOMElements.mortgageSelect.id]: DOMElements.mortgagePropertyBtn, [DOMElements.unmortgageSelect.id]: DOMElements.unmortgagePropertyBtn, [DOMElements.sellHouseSelect.id]: DOMElements.sellHouseBtn }[selectElement.id]; if (buttonToToggle) { buttonToToggle.disabled = true; selectElement.onchange = () => { buttonToToggle.disabled = !selectElement.value; }; }
}

function showBuildHouseDialog(player, availableProperties) { /* ... (full version from your upload, calls showPropertyManagementActions & setControls) ... */
    const existingDialog = DOMElements.propertyActionsDiv.querySelector('.build-house-dialog'); if (existingDialog) existingDialog.remove(); const selectDiv = document.createElement('div'); selectDiv.className = 'build-house-dialog'; selectDiv.style.marginTop = '10px'; selectDiv.innerHTML = `<p>Build on:</p><select id="build-house-prop-select" class="action-select" style="margin-bottom: 5px;"></select><button id="confirm-build-btn" class="button-group button" style="width:auto; padding: 5px 10px;">Build</button><button id="cancel-build-btn" class="button-group button" style="width:auto; padding: 5px 10px; background-color: #6c757d;">Cancel</button>`; const buildSelect = selectDiv.querySelector('#build-house-prop-select'); const confirmBtn = selectDiv.querySelector('#confirm-build-btn'); const cancelBtn = selectDiv.querySelector('#cancel-build-btn'); availableProperties.forEach(prop => { const option = document.createElement('option'); option.value = prop.id; option.textContent = `${prop.name} (D: ${prop.houses === 5 ? 'F' : prop.houses}) - Cost: ₡${prop.houseCost}`; buildSelect.appendChild(option); }); if (availableProperties.length > 0) buildSelect.value = availableProperties[0].id; confirmBtn.disabled = availableProperties.length === 0; DOMElements.propertyActionsDiv.appendChild(selectDiv); DOMElements.buildHouseBtn.style.display = 'none'; confirmBtn.onclick = () => { const propId = parseInt(buildSelect.value); const prop = board.find(p => p.id === propId); if (!prop || prop.owner !== player.id || player.money < prop.houseCost || prop.houses >= 5 || prop.mortgaged) { logMessage("Cannot build Dwelling here (funds, maxed, mortgaged, or not owned).", "error"); return; } const groupProperties = getPropertiesByColor(prop.colorGroup).filter(p => p.owner === player.id); const minHousesInGroup = Math.min(...groupProperties.map(p => p.houses)); if (prop.houses > minHousesInGroup && checkMonopoly(player, prop.colorGroup)) { logMessage(`Must build evenly. Build on '${groupProperties.find(p=>p.houses === minHousesInGroup).name}' first.`, "error"); return; } player.money -= prop.houseCost; prop.houses++; logMessage(`${player.name} built a ${prop.houses === 5 ? 'Fortress' : 'Dwelling'} on ${prop.name}. Dwellings: ${prop.houses}.`); updatePlayerInfo(); updateBoardUI(); selectDiv.remove(); showPropertyManagementActions(player); setControls(); }; cancelBtn.onclick = () => { selectDiv.remove(); DOMElements.buildHouseBtn.style.display = 'inline-block'; showPropertyManagementActions(player); setControls(); };
}

export function mortgageProperty(propId) {
    const player = state.players[state.currentPlayerIndex];
    const prop = board.find(p => p.id === propId);
    if (!prop || prop.owner !== player.id || prop.mortgaged) {
        logMessage(`Cannot mortgage ${prop ? prop.name : 'selected holding'}. Not owned or already mortgaged.`, 'error');
    } else {
        // MODIFIED: Check for houses in the same color group for locations
        if (prop.type === 'location') {
            const groupProperties = getPropertiesByColor(prop.colorGroup);
            const groupHasHouses = groupProperties.some(pInGroup => pInGroup.owner === player.id && pInGroup.houses > 0);
            if (groupHasHouses) {
                logMessage(`Cannot mortgage ${prop.name}. Sell all Dwellings in the ${prop.colorGroup} sector first.`, 'error');
                showPropertyManagementActions(player); // Refresh UI
                setControls(); // Update buttons
                return; // Stop mortgage if houses exist in group
            }
        }
        // If it's a location, it must have 0 houses (implicitly covered by above).
        // For other types (hyperspace_lane, facility), houses check is not applicable.
        prop.mortgaged = true;
        player.money += prop.price / 2;
        logMessage(`${player.name} mortgaged ${prop.name} for ₡${prop.price / 2}.`, 'info');
        updatePlayerInfo(); updateBoardUI();
    }
    showPropertyManagementActions(player); // Refresh options after action
    setControls(); // Re-evaluate all controls
}

export function unmortgageProperty(propId) { /* ... (full version, calls showPropertyManagementActions & setControls) ... */
    const player = state.players[state.currentPlayerIndex]; const prop = board.find(p => p.id === propId); if (!prop) { logMessage("Holding not found.", "error"); return; } const unmortgageCost = Math.ceil(prop.price / 2 * 1.1); if (prop.owner === player.id && prop.mortgaged && player.money >= unmortgageCost) { prop.mortgaged = false; player.money -= unmortgageCost; logMessage(`${player.name} unmortgaged ${prop.name} for ₡${unmortgageCost}.`, 'info'); updatePlayerInfo(); updateBoardUI(); } else { logMessage(`Cannot unmortgage ${prop.name}. Insufficient credits or not mortgaged by you.`, 'error'); } showPropertyManagementActions(player); setControls();
}
export function sellHouse(propId) { /* ... (full version, calls showPropertyManagementActions & setControls) ... */
    const player = state.players[state.currentPlayerIndex]; const prop = board.find(p => p.id === propId); if (!prop || prop.type !== 'location' || prop.owner !== player.id || prop.houses === 0) { logMessage(`Cannot sell Dwelling on ${prop ? prop.name : 'selected holding'}. No Dwellings or not owned.`, 'error'); showPropertyManagementActions(player); setControls(); return; } const groupProperties = getPropertiesByColor(prop.colorGroup).filter(p => p.owner === player.id); const maxHousesInGroup = Math.max(...groupProperties.map(p => p.houses)); if (prop.houses < maxHousesInGroup && checkMonopoly(player, prop.colorGroup)) { logMessage(`Must sell evenly. Sell from holdings with more Dwellings in the ${prop.colorGroup} sector first.`, "error"); showPropertyManagementActions(player); setControls(); return; } prop.houses--; player.money += prop.houseCost / 2; logMessage(`${player.name} sold a ${prop.houses === 4 ? 'Fortress (now 4 Dwellings)' : 'Dwelling'} on ${prop.name} for ₡${prop.houseCost / 2}. Dwellings left: ${prop.houses}.`, 'info'); updatePlayerInfo(); updateBoardUI(); showPropertyManagementActions(player); setControls();
}

export function payBail() { /* ... (full version, calls setControlsForTurnStart) ... */
    const player = state.players[state.currentPlayerIndex]; if (player.inJail && player.money >= 50) { player.money -= 50; player.inJail = false; player.jailTurns = 0; logMessage(`${player.name} paid ₡50 bail to get out of Detention Block.`, 'success'); updatePlayerInfo(); setControlsForTurnStart(); } else { logMessage("Not enough credits to pay bail, or not in Detention.", "error"); }
}
export function useJailCard() { /* ... (full version, calls setControlsForTurnStart) ... */
    const player = state.players[state.currentPlayerIndex]; if (player.inJail && player.getOutOfJailFreeCards > 0) { player.getOutOfJailFreeCards--; player.inJail = false; player.jailTurns = 0; logMessage(`${player.name} used a Get Out of Detention Free Card!`, 'success'); updatePlayerInfo(); setControlsForTurnStart(); } else { logMessage("No Get Out of Detention Free Cards available, or not in Detention.", "error"); }
}

// MODIFIED: setControls to manage visibility of property actions consistently
function setControls() {
    if (state.gameOver) {
        DOMElements.rollDiceBtn.disabled = true; DOMElements.endTurnBtn.disabled = true;
        DOMElements.proposeTradeBtn.disabled = true;
        if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display = 'none';
        if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'none';
        return;
    }
    const player = state.players[state.currentPlayerIndex];
    if (!player) { checkWinCondition(); return; }

    let canRoll = false;
    let canEndTurn = false;
    let canTrade = false;
    let showJailOptions = false;
    let showPropertyOptions = false;

    if (player.inJail) {
        showJailOptions = true;
        if(DOMElements.payBailBtn) DOMElements.payBailBtn.disabled = player.money < 50;
        if(DOMElements.useJailCardBtn) DOMElements.useJailCardBtn.disabled = player.getOutOfJailFreeCards === 0;

        if (!player.hasRolled) { // Hasn't attempted roll this turn
            canRoll = true;
            if (player.jailTurns >= 3) {
                canRoll = false; // Must pay or use card
                if (DOMElements.payBailBtn.disabled && DOMElements.useJailCardBtn.disabled) {
                    handleBankruptcy(player, 'bank', 50); return; // Stop further control setting
                }
            }
        } else { // Already rolled (and failed to get doubles)
            canEndTurn = true;
        }
    } else { // Not in jail
        canTrade = true;
        showPropertyOptions = true; // Generally allow property management

        if (!player.hasRolled) {
            canRoll = true; // Can roll if hasn't yet
        } else { // Has rolled
            if (player.doublesRolledThisTurn > 0 && player.doublesRolledThisTurn < 3) {
                canRoll = true; // Rolled doubles, can roll again
            } else {
                canEndTurn = true; // Normal roll completed, or 3rd double (which would send to jail)
            }
        }
    }

    DOMElements.rollDiceBtn.disabled = !canRoll;
    DOMElements.endTurnBtn.disabled = !canEndTurn;
    DOMElements.proposeTradeBtn.disabled = !canTrade;
    if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = showJailOptions ? 'flex' : 'none';

    if (showPropertyOptions) {
        if (state.currentActionPending === 'buy') {
            showBuyPropertyAction(player, board[player.position]);
        } else {
            showPropertyManagementActions(player); // This handles visibility of propertyActionsDiv
        }
    } else {
        if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display = 'none';
    }


    // Auction/Trade overrides everything
    if (state.isAuctionActive || state.isTradeActive) {
        DOMElements.rollDiceBtn.disabled = true; DOMElements.endTurnBtn.disabled = true;
        DOMElements.proposeTradeBtn.disabled = true;
        if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display = 'none';
        if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'none';
    }
}

function setControlsForTurnStart() {
    if (state.gameOver || !state.players.length || !state.players[state.currentPlayerIndex]) {
        checkWinCondition(); return;
    }
    const player = state.players[state.currentPlayerIndex];
    player.hasRolled = false;
    player.doublesRolledThisTurn = 0;
    state.currentActionPending = null;
    logMessage(`It's ${player.name}'s turn.`);
    updatePlayerInfo(); // Update for the current player
    setControls();      // Set initial controls for the turn
}

export function endTurn() { /* ... (full version from your upload, ensure it calls setControlsForTurnStart) ... */
    if (state.isAuctionActive || state.isTradeActive || state.gameOver) return; const currentPlayer = state.players[state.currentPlayerIndex]; if (!currentPlayer) { checkWinCondition(); return; }
    if (state.currentActionPending === 'buy' && board[currentPlayer.position].owner === null) { const spaceToAuction = board[currentPlayer.position]; logMessage(`${currentPlayer.name} declined to buy ${spaceToAuction.name}. Auctioning.`); startAuction(spaceToAuction.id); return; }
    logMessage(`${currentPlayer.name}'s turn ended.`); currentPlayer.doublesRolledThisTurn = 0;
    if (state.players.length <= 1) { checkWinCondition(); return; }
    let nextPlayerIndex = state.currentPlayerIndex; let attempts = 0;
    do { nextPlayerIndex = (nextPlayerIndex + 1) % state.players.length; attempts++; if (attempts > state.players.length + 1 && state.players.length > 1) { logMessage("Error finding next player.", "error"); const firstAvailable = state.players.findIndex(p => p.money >=0); if(firstAvailable !== -1) state.currentPlayerIndex = firstAvailable; else { state.gameOver = true; checkWinCondition(); return;} break; }
    } while (state.players[nextPlayerIndex].money < 0 && state.players.length > 1); // Skip bankrupt
    state.currentPlayerIndex = nextPlayerIndex;
    setControlsForTurnStart(); // This updates player info implicitly via its own updatePlayerInfo call or side effects
}

// Auction Logic
function showAuctionMessage(message) { DOMElements.auctionMessageArea.textContent = message; }
function startAuction(propId) { /* ... (full version, calls updateAuctionUI) ... */ state.isAuctionActive = true; state.auctionPropertyId = propId; state.currentBid = 0; state.highestBidderId = null; state.auctionBidders = state.players.filter(p => p.money >= 1); if(state.auctionBidders.length === 0){ logMessage("No players for auction.", "info"); endAuction(); return;} let initialBidderIndex = state.auctionBidders.findIndex(p=>p.id === state.players[state.currentPlayerIndex].id); state.auctionCurrentBidderIndex = initialBidderIndex !== -1 ? initialBidderIndex : 0; DOMElements.rollDiceBtn.disabled = true; DOMElements.endTurnBtn.disabled = true; if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display = 'none'; if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'none'; document.body.classList.add('auction-active'); DOMElements.auctionModalOverlay.style.display = 'flex'; DOMElements.auctionWithdrawBtn.textContent = "Pass"; updateAuctionUI(); }
function updateAuctionUI() { /* ... (full version) ... */ if (!state.isAuctionActive) return; showAuctionMessage(''); const property = board.find(p => p.id === state.auctionPropertyId); if(!property) { endAuction(); return;} DOMElements.auctionPropertyName.textContent = property.name; DOMElements.auctionCurrentBid.textContent = `₡${state.currentBid}`; const highestBidderObj = state.highestBidderId !== null ? state.players.find(p => p.id === state.highestBidderId) : null; DOMElements.auctionHighestBidder.textContent = highestBidderObj ? highestBidderObj.name : 'None'; if (state.auctionBidders.length === 0 || !state.auctionBidders[state.auctionCurrentBidderIndex]) { endAuction(); return; } const currentBidder = state.auctionBidders[state.auctionCurrentBidderIndex]; DOMElements.auctionCurrentBidder.textContent = currentBidder.name; DOMElements.auctionBidAmountInput.value = state.currentBid + 1; DOMElements.auctionBidAmountInput.min = state.currentBid + 1; }
export function handlePlaceBid() { /* ... (full version, calls nextBidder) ... */ if (!state.isAuctionActive || state.auctionBidders.length === 0) return; const bidAmount = parseInt(DOMElements.auctionBidAmountInput.value); const bidder = state.auctionBidders[state.auctionCurrentBidderIndex]; if (isNaN(bidAmount) || bidAmount <= state.currentBid) { showAuctionMessage(`Bid > ₡${state.currentBid}.`); return; } if (bidAmount > bidder.money) { showAuctionMessage(`${bidder.name} max bid: ₡${bidder.money}`); DOMElements.auctionBidAmountInput.value = bidder.money; return; } state.currentBid = bidAmount; state.highestBidderId = bidder.id; logMessage(`${bidder.name} bids ₡${state.currentBid} for ${board.find(p=>p.id === state.auctionPropertyId).name}.`, 'info'); nextBidder(); }
export function handlePass() { /* ... (full version, calls endAuction or updateAuctionUI) ... */ if (!state.isAuctionActive || state.auctionBidders.length === 0) return; const currentPassingBidder = state.auctionBidders[state.auctionCurrentBidderIndex]; logMessage(`${currentPassingBidder.name} passes.`, 'info'); state.auctionBidders.splice(state.auctionCurrentBidderIndex, 1); if (state.auctionBidders.length === 0) { endAuction(); } else if (state.auctionBidders.length === 1 && state.highestBidderId !== null) { if(state.auctionBidders[0].id === state.highestBidderId) { endAuction(); } else { state.auctionCurrentBidderIndex = 0; updateAuctionUI(); } } else { state.auctionCurrentBidderIndex = state.auctionCurrentBidderIndex % state.auctionBidders.length; updateAuctionUI(); } }
function nextBidder() { /* ... (full version, calls endAuction or updateAuctionUI) ... */ if (!state.isAuctionActive || state.auctionBidders.length === 0) { endAuction(); return; } if (state.auctionBidders.length === 1 && state.highestBidderId !== null && state.auctionBidders[0].id === state.highestBidderId) { endAuction(); return; } if (state.highestBidderId !== null && state.auctionBidders[(state.auctionCurrentBidderIndex + 1) % state.auctionBidders.length].id === state.highestBidderId) { endAuction(); return; } state.auctionCurrentBidderIndex = (state.auctionCurrentBidderIndex + 1) % state.auctionBidders.length; updateAuctionUI(); }
function endAuction() { /* ... (full version, calls setControls, updatePlayerInfo, updateBoardUI) ... */ const property = board.find(p => p.id === state.auctionPropertyId); if (state.highestBidderId !== null) { const winner = state.players.find(p => p.id === state.highestBidderId); if (winner && winner.money >= state.currentBid) { logMessage(`${winner.name} wins auction for ${property.name} (₡${state.currentBid}).`, 'success'); winner.money -= state.currentBid; property.owner = winner.id; } else { property.owner = null; logMessage(`Auction for ${property.name} ended. Bidder issue. Unowned.`, 'info');}} else { property.owner = null; logMessage(`No bids for ${property.name}. Unowned.`, 'info');} state.isAuctionActive = false; state.auctionPropertyId = null; state.auctionBidders = []; document.body.classList.remove('auction-active'); DOMElements.auctionModalOverlay.style.display = 'none'; state.currentActionPending = null; setControls(); updatePlayerInfo(); updateBoardUI(); }

// Trade Logic
function showTradeMessage(message) { DOMElements.tradeMessageArea.textContent = message; }
export function showTradeModal() { /* ... (full version, calls updateTradeModalAssets) ... */ if (state.isAuctionActive || state.gameOver) return; const proposer = state.players[state.currentPlayerIndex]; state.isTradeActive = true; state.tradeOffer.originalProposerId = proposer.id; showTradeMessage(''); DOMElements.rollDiceBtn.disabled = true; DOMElements.endTurnBtn.disabled = true; DOMElements.tradeOfferMoney.value = 0; DOMElements.tradeRequestMoney.value = 0; DOMElements.tradeOfferCards.value = 0; DOMElements.tradeRequestCards.value = 0; DOMElements.tradePartnerSelect.innerHTML = '<option value="">-- Select Player --</option>'; state.players.forEach((player) => { if (player.id !== proposer.id) { const option = document.createElement('option'); option.value = player.id; option.textContent = player.name; DOMElements.tradePartnerSelect.appendChild(option); } }); DOMElements.tradePartnerSelect.value = ""; updateTradeModalAssets(); document.body.classList.add('trade-active'); DOMElements.tradeModalOverlay.style.display = 'flex'; }
export function updateTradeModalAssets() { /* ... (full version) ... */ const proposer = state.players.find(p => p.id === state.tradeOffer.originalProposerId || p.id === state.currentPlayerIndex); const partnerId = parseInt(DOMElements.tradePartnerSelect.value); const partner = state.players.find(p => p.id === partnerId); DOMElements.tradeOfferProperties.innerHTML = ''; getPlayerOwnedProperties(proposer, null, true).filter(p => p.type !== 'location' || p.houses === 0).forEach(prop => { const option = document.createElement('option'); option.value = prop.id; option.textContent = `${prop.name}${prop.mortgaged ? ' (M)' : ''}`; DOMElements.tradeOfferProperties.appendChild(option); }); DOMElements.tradeOfferCards.max = proposer.getOutOfJailFreeCards; DOMElements.tradeOfferMoney.max = proposer.money; DOMElements.tradeRequestProperties.innerHTML = ''; if (partner) { getPlayerOwnedProperties(partner, null, true).filter(p => p.type !== 'location' || p.houses === 0).forEach(propObj => { const prop = board.find(p => p.id === propObj.id); const option = document.createElement('option'); option.value = prop.id; option.textContent = `${prop.name}${prop.mortgaged ? ' (M)' : ''}`; DOMElements.tradeRequestProperties.appendChild(option); }); DOMElements.tradeRequestCards.max = partner.getOutOfJailFreeCards; DOMElements.tradeRequestMoney.max = partner.money; } else { DOMElements.tradeRequestCards.max = 0; DOMElements.tradeRequestCards.value = 0; DOMElements.tradeRequestMoney.max = 0; DOMElements.tradeRequestMoney.value = 0; } }
export function handleSendProposal() { /* ... (full version, calls showTradeReviewModal) ... */ showTradeMessage(''); const proposer = state.players.find(p => p.id === state.tradeOffer.originalProposerId); state.tradePartnerId = parseInt(DOMElements.tradePartnerSelect.value); if (isNaN(state.tradePartnerId)) { showTradeMessage("Select player."); return; } const partner = state.players.find(p => p.id === state.tradePartnerId); if (!partner) { showTradeMessage("Partner not found."); return; } state.tradeOffer.money = parseInt(DOMElements.tradeOfferMoney.value) || 0; state.tradeOffer.properties = Array.from(DOMElements.tradeOfferProperties.selectedOptions).map(opt => parseInt(opt.value)); state.tradeOffer.cards = parseInt(DOMElements.tradeOfferCards.value) || 0; state.tradeRequest.money = parseInt(DOMElements.tradeRequestMoney.value) || 0; state.tradeRequest.properties = Array.from(DOMElements.tradeRequestProperties.selectedOptions).map(opt => parseInt(opt.value)); state.tradeRequest.cards = parseInt(DOMElements.tradeRequestCards.value) || 0; if (state.tradeOffer.money < 0 || state.tradeRequest.money < 0 || state.tradeOffer.cards < 0 || state.tradeRequest.cards < 0) { showTradeMessage("Amounts cannot be negative."); return; } if (state.tradeOffer.money > proposer.money) { showTradeMessage("You cannot offer more credits."); return; } if (state.tradeOffer.cards > proposer.getOutOfJailFreeCards) { showTradeMessage("You cannot offer more cards."); return; } if (state.tradeRequest.money > partner.money) { showTradeMessage(`${partner.name} lacks credits.`); return; } if (state.tradeRequest.cards > partner.getOutOfJailFreeCards) { showTradeMessage(`${partner.name} lacks cards.`); return; } const allTradePropIds = [...state.tradeOffer.properties, ...state.tradeRequest.properties]; for (const propId of allTradePropIds) { const prop = board.find(p => p.id === propId); if (prop && prop.type === 'location' && prop.houses > 0) { showTradeMessage(`Cannot trade ${prop.name} (has Dwellings).`); return; } } if(state.tradeOffer.properties.length === 0 && state.tradeRequest.properties.length === 0 && state.tradeOffer.money === 0 && state.tradeRequest.money === 0 && state.tradeOffer.cards === 0 && state.tradeRequest.cards === 0){ showTradeMessage("Empty proposal."); return; } state.tradeOffer.reviewingPlayerId = partner.id; showTradeReviewModal(); }
function showTradeReviewModal() { /* ... (full version) ... */ const proposer = state.players.find(p => p.id === state.tradeOffer.originalProposerId); const partner = state.players.find(p => p.id === state.tradePartnerId); DOMElements.reviewProposerName.textContent = proposer.name; DOMElements.reviewPartnerName.textContent = partner.name; DOMElements.reviewOfferMoney.textContent = `₡${state.tradeOffer.money}`; DOMElements.reviewOfferCards.textContent = state.tradeOffer.cards; DOMElements.reviewOfferProperties.innerHTML = state.tradeOffer.properties.map(id => `<li>${board.find(p=>p.id===id).name}</li>`).join('') || '<li>None</li>'; DOMElements.reviewRequestMoney.textContent = `₡${state.tradeRequest.money}`; DOMElements.reviewRequestCards.textContent = state.tradeRequest.cards; DOMElements.reviewRequestProperties.innerHTML = state.tradeRequest.properties.map(id => `<li>${board.find(p=>p.id===id).name}</li>`).join('') || '<li>None</li>'; DOMElements.tradeModalOverlay.style.display = 'none'; DOMElements.tradeReviewModalOverlay.style.display = 'flex'; }
export function handleAcceptTrade() { /* ... (full version, calls endTrade) ... */ const playerA_proposer = state.players.find(p => p.id === state.tradeOffer.originalProposerId); const playerB_partner = state.players.find(p => p.id === state.tradePartnerId); if (!playerA_proposer || !playerB_partner) { logMessage("Error processing trade.", "error"); endTrade(); return; } logMessage(`${playerB_partner.name} accepted trade with ${playerA_proposer.name}.`, 'success'); playerA_proposer.money = playerA_proposer.money - state.tradeOffer.money + state.tradeRequest.money; playerA_proposer.getOutOfJailFreeCards = playerA_proposer.getOutOfJailFreeCards - state.tradeOffer.cards + state.tradeRequest.cards; playerB_partner.money = playerB_partner.money + state.tradeOffer.money - state.tradeRequest.money; playerB_partner.getOutOfJailFreeCards = playerB_partner.getOutOfJailFreeCards + state.tradeOffer.cards - state.tradeRequest.cards; state.tradeOffer.properties.forEach(propId => { const prop = board.find(p => p.id === propId); prop.owner = playerB_partner.id; }); state.tradeRequest.properties.forEach(propId => { const prop = board.find(p => p.id === propId); prop.owner = playerA_proposer.id; }); endTrade(); }
export function handleRejectTrade() { /* ... (full version, calls endTrade) ... */ const proposer = state.players.find(p => p.id === state.tradeOffer.originalProposerId); const partner = state.players.find(p => p.id === state.tradePartnerId); logMessage(`Trade from ${proposer.name} to ${partner.name} rejected by ${partner.name}.`, 'warning'); endTrade(); }
export function endTrade() { /* ... (full version, calls setControls) ... */ state.isTradeActive = false; state.tradePartnerId = null; state.tradeOffer = {}; state.tradeRequest = {}; document.body.classList.remove('trade-active'); DOMElements.tradeModalOverlay.style.display = 'none'; DOMElements.tradeReviewModalOverlay.style.display = 'none'; updatePlayerInfo(); updateBoardUI(); setControls(); }

// Debug Logic (unchanged)
export function debugMovePlayer() { /* ... */ landOnSpace(player); }
export function debugSimulateRoll() { /* ... */ rollDice(die1, die2); }
export function debugChangeOwner() { /* ... */ updatePlayerInfo(); updateBoardUI(); }
export function debugSetHouses() { /* ... */ updatePlayerInfo(); updateBoardUI(); }
export function debugSetMoney() { /* ... */ updatePlayerInfo(); }
export function debugSendToJail() { /* ... */ sendToJail(player); }