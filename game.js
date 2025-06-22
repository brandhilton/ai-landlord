import { board, chanceCards, communityChestCards } from './config.js';
import { DOMElements, logMessage, updatePlayerInfo, updateBoardUI, createBoardUI, populateDebugPlayerSelects, populateDebugSpaceSelect, populateDebugPropertySelects } from './ui.js';

// --- Game State Variables ---
export let state = {
    players: [],
    currentPlayerIndex: 0,
    diceRoll: [0, 0],
    doublesCount: 0,
    gameOver: false,
    currentActionPending: null,
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

function getHyperspaceLanes() {
    return board.filter(space => space.type === 'hyperspace_lane');
}

function getFacilities() {
    return board.filter(space => space.type === 'facility');
}

function checkMonopoly(player, colorGroup) {
    const propertiesInGroup = getPropertiesByColor(colorGroup);
    if (!propertiesInGroup || propertiesInGroup.length === 0) return false;
    return propertiesInGroup.every(prop => prop.owner === player.id && !prop.mortgaged);
}


function getPlayerOwnedProperties(player, type = null, includeMortgaged = false) {
    return board.filter(space =>
        space.owner === player.id &&
        (type ? space.type === type : ['location', 'hyperspace_lane', 'facility'].includes(space.type)) &&
        (includeMortgaged || !space.mortgaged)
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
            properties: [],
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
            space.houses = 0; // For locations
            space.mortgaged = false;
        }
    });


    state.chanceCardsShuffled = shuffleArray([...chanceCards]);
    state.communityChestCardsShuffled = shuffleArray([...communityChestCards]);
    state.currentPlayerIndex = 0;
    state.gameOver = false;
    state.diceRoll = [0,0];
    state.doublesCount = 0;


    DOMElements.setupScreen.style.display = 'none';
    DOMElements.gameScreen.style.display = 'block';

    createBoardUI(); // This should not clear the hardcoded logo if modified correctly
    updatePlayerInfo();
    updateBoardUI();
    logMessage("Game Started!", "success");
    logMessage(`It's ${state.players[state.currentPlayerIndex].name}'s turn.`);
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
    if (player.hasRolled && !(player.doublesRolledThisTurn > 0 && player.doublesRolledThisTurn <3) && !player.inJail) {
        logMessage("You have already rolled this turn.", "warning");
        return;
    }


    const die1 = simulatedDie1 !== null ? simulatedDie1 : Math.floor(Math.random() * 6) + 1;
    const die2 = simulatedDie2 !== null ? simulatedDie2 : Math.floor(Math.random() * 6) + 1;

    state.diceRoll = [die1, die2];
    DOMElements.diceDisplay.textContent = `Dice: ${die1}, ${die2}`;
    logMessage(`${player.name} rolled a ${die1} and a ${die2} (total ${die1 + die2}).`);

    player.hasRolled = true;

    if (die1 === die2) {
        player.doublesRolledThisTurn++;
        logMessage(`${player.name} rolled doubles! (${player.doublesRolledThisTurn})`, 'warning');
        if (player.doublesRolledThisTurn === 3) {
            logMessage(`${player.name} rolled 3 consecutive doubles! Go directly to Detention Block!`, 'error');
            sendToJail(player);
            // End turn immediately after going to jail for 3 doubles
            // No further action, next player's turn (will be handled by endTurn if called, or setControls + endTurn)
            // We'll disable roll, enable end turn.
            DOMElements.rollDiceBtn.disabled = true;
            DOMElements.endTurnBtn.disabled = false;
            return; // Stop further processing of this roll
        }
    } else {
        player.doublesRolledThisTurn = 0; // Reset if not doubles
    }

    if (player.inJail) {
        handleJailRoll(player, die1, die2);
    } else {
        movePlayer(player, die1 + die2);
    }
}

function movePlayer(player, steps) {
    const oldPosition = player.position;
    player.position = (player.position + steps) % board.length;
    logMessage(`${player.name} moved from ${board[oldPosition].name} to ${board[player.position].name}.`);

    if (player.position < oldPosition && !player.inJail) { // Passed START
        player.money += 200;
        logMessage(`${player.name} passed START and collected ₡200!`);
    }
    updatePlayerInfo(); // Update money display
    updateBoardUI();    // Update token position
    landOnSpace(player);
}

function sendToJail(player) {
    player.position = 10; // Detention Block space ID
    player.inJail = true;
    player.jailTurns = 0;
    player.doublesRolledThisTurn = 0; // Reset doubles count when sent to jail
    player.hasRolled = true; // Considered as their roll action for the turn
    logMessage(`${player.name} is now in the Detention Block!`);
    updatePlayerInfo();
    updateBoardUI();
    state.currentActionPending = 'none'; // No pending buy/manage actions
    setControls(); // Update controls: roll disabled, end turn enabled
}

function handleJailRoll(player, die1, die2) {
    if (die1 === die2) {
        logMessage(`${player.name} rolled doubles (${die1}, ${die2}) and got out of the Detention Block!`, 'success');
        player.inJail = false;
        player.jailTurns = 0;
        // Player does not roll again this turn, but moves the sum of this roll
        movePlayer(player, die1 + die2);
        // Doubles don't grant another turn if getting out of jail
        player.doublesRolledThisTurn = 0;
    } else {
        player.jailTurns++;
        logMessage(`${player.name} rolled ${die1}, ${die2}. Still in Detention Block. Turns left in Detention: ${3 - player.jailTurns}.`);
        if (player.jailTurns >= 3) {
            logMessage(`${player.name} must pay or use a card next turn if still in Detention.`, "warning");
        }
        state.currentActionPending = 'none';
        setControls(); // Roll disabled, end turn enabled
    }
}

function landOnSpace(player) {
    const space = board[player.position];
    logMessage(`${player.name} landed on ${space.name}.`);

    state.currentActionPending = 'none'; // Reset pending action

    switch (space.type) {
        case 'location':
        case 'hyperspace_lane':
        case 'facility':
            if (space.owner === null) {
                logMessage(`${space.name} is unowned. Price: ₡${space.price}.`);
                if (player.money >= space.price) {
                    state.currentActionPending = 'buy';
                } else {
                    logMessage(`${player.name} cannot afford ${space.name}. Auctioning...`, 'warning');
                    startAuction(space.id);
                    return; // Auction handles next steps
                }
            } else if (space.owner !== player.id) {
                const owner = state.players.find(p => p.id === space.owner); // Find owner object
                if (!owner) { // Should not happen
                    logMessage(`Error: Owner of ${space.name} not found.`, 'error');
                    break;
                }
                if (space.mortgaged) {
                    logMessage(`${space.name} is mortgaged by ${owner.name}. No rent.`, 'info');
                } else {
                    let rent = 0;
                    if (space.type === 'location') {
                        rent = space.rent[space.houses];
                        if (space.houses === 0 && checkMonopoly(owner, space.colorGroup)) {
                            rent *= 2;
                            logMessage(`Rent is doubled as ${owner.name} holds the full ${space.colorGroup} sector.`);
                        }
                    } else if (space.type === 'hyperspace_lane') {
                        rent = calculateHyperspaceLaneRent(owner, space);
                    } else if (space.type === 'facility') {
                        rent = calculateFacilityRent(owner, state.diceRoll[0] + state.diceRoll[1]);
                    }
                    logMessage(`${space.name} is owned by ${owner.name}. Rent: ₡${rent}.`);
                    payMoney(player, owner, rent);
                }
            } else {
                logMessage(`${player.name} owns ${space.name}.`);
                state.currentActionPending = 'manage';
            }
            break;
        case 'tax':
            logMessage(`${player.name} landed on ${space.name} and must pay ₡${space.amount}.`);
            payMoney(player, 'bank', space.amount);
            break;
        case 'force_card': // Chance
            drawCard(player, state.chanceCardsShuffled, 'Force Card');
            return; // drawCard will handle subsequent landOnSpace if needed
        case 'supply_drop': // Community Chest
            drawCard(player, state.communityChestCardsShuffled, 'Supply Drop');
            return; // drawCard will handle subsequent landOnSpace if needed
        case 'send_to_detention':
            sendToJail(player);
            return; // sendToJail handles UI updates and control setting
        case 'detention_block':
            logMessage(`${player.name} is just visiting the Detention Block.`, 'info');
            break;
        case 'start':
        case 'smugglers_hideout': // Free Parking
            logMessage(`${player.name} is on ${space.name}. Nothing to do.`, 'info');
            break;
        default:
            logMessage(`Landed on unhandled space type: ${space.type}`, 'warning');
    }
    setControls(); // Update controls based on landing outcome
}


function buyProperty(player, space) {
    if (player.money >= space.price && space.owner === null) {
        player.money -= space.price;
        space.owner = player.id;
        // player.properties.push(space.id); // This was incorrect way to track properties. Properties are on board.
        logMessage(`${player.name} bought ${space.name} for ₡${space.price}.`, 'success');
        updatePlayerInfo();
        updateBoardUI();
        state.currentActionPending = 'manage'; // Can now manage this property
    } else {
        logMessage(`Could not buy ${space.name}. Either not enough credits or already owned.`, 'error');
        state.currentActionPending = 'none';
    }
    setControls();
}


function payMoney(fromPlayer, toRecipient, amount) {
    if (fromPlayer.money >= amount) {
        fromPlayer.money -= amount;
        if (toRecipient !== 'bank' && typeof toRecipient === 'object' && toRecipient !== null) {
            toRecipient.money += amount;
            logMessage(`${fromPlayer.name} paid ₡${amount} to ${toRecipient.name}.`);
        } else {
            logMessage(`${fromPlayer.name} paid ₡${amount} to the Bank.`);
        }
        updatePlayerInfo(); // Update money display for both players potentially
        return true; // Payment successful
    } else {
        logMessage(`${fromPlayer.name} cannot pay ₡${amount}! Attempting to raise funds...`, 'warning');
        // Trigger bankruptcy process, but let it resolve. Don't immediately fail.
        // The bankruptcy function will ultimately determine if they can pay.
        handleBankruptcy(fromPlayer, toRecipient, amount);
        // After bankruptcy attempt, check again. This might be redundant if bankruptcy handles the payment.
        // For now, we assume bankruptcy handles the final payment if possible.
        return fromPlayer.money >= amount; // Return true if they could cover it after bankruptcy actions
    }
}

function handleBankruptcy(bankruptPlayer, recipient, debtAmount) {
    logMessage(`${bankruptPlayer.name} is trying to cover a debt of ₡${debtAmount}.`);

    // 1. Sell all houses/hotels evenly
    const ownedLocations = getPlayerOwnedProperties(bankruptPlayer, 'location', true);
    for (let i = 5; i > 0; i--) { // Sell hotels first, then houses evenly
        if (bankruptPlayer.money >= debtAmount) break;
        ownedLocations.forEach(prop => {
            if (bankruptPlayer.money >= debtAmount) return;
            if (prop.houses === i) {
                prop.houses--;
                bankruptPlayer.money += prop.houseCost / 2;
                logMessage(`${bankruptPlayer.name} sold a ${i===5 ? 'Fortress' : 'Dwelling'} on ${prop.name} for ₡${prop.houseCost/2}. Credits: ₡${bankruptPlayer.money}`);
                updateBoardUI();
                updatePlayerInfo();
            }
        });
    }

    // 2. Mortgage properties
    if (bankruptPlayer.money < debtAmount) {
        const allOwnableProps = getPlayerOwnedProperties(bankruptPlayer, null, true) // Get all, including mortgaged to check
            .filter(p => !p.mortgaged) // Filter to only unmortgaged
            .sort((a, b) => (a.price / 2) - (b.price / 2)); // Mortgage cheapest first

        allOwnableProps.forEach(prop => {
            if (bankruptPlayer.money >= debtAmount) return;
            if (!prop.mortgaged) { // Should always be true due to filter, but good check
                prop.mortgaged = true;
                bankruptPlayer.money += prop.price / 2;
                logMessage(`${bankruptPlayer.name} mortgaged ${prop.name} for ₡${prop.price / 2}. Credits: ₡${bankruptPlayer.money}`);
                updateBoardUI();
                updatePlayerInfo();
            }
        });
    }

    // 3. Check if debt can now be paid
    if (bankruptPlayer.money >= debtAmount) {
        logMessage(`${bankruptPlayer.name} managed to raise enough funds!`);
        payMoney(bankruptPlayer, recipient, debtAmount); // Make the actual payment
        return; // Not bankrupt
    }

    // 4. Declare bankruptcy
    logMessage(`${bankruptPlayer.name} is bankrupt and out of the game! Assets go to ${recipient === 'bank' ? 'the Bank' : recipient.name}.`, 'error');
    const recipientPlayer = (recipient === 'bank' || recipient === bankruptPlayer) ? null : recipient;

    board.forEach(prop => {
        if (prop.owner === bankruptPlayer.id) {
            if (recipientPlayer) {
                prop.owner = recipientPlayer.id;
                // Properties are transferred mortgaged to player
                prop.mortgaged = true;
                logMessage(`${prop.name} (mortgaged) transferred to ${recipientPlayer.name}.`);
            } else { // Assets go to bank
                prop.owner = null;
                prop.mortgaged = false;
                prop.houses = 0; // Houses are already sold
                logMessage(`${prop.name} returned to the Bank.`);
            }
        }
    });
    if(recipientPlayer && bankruptPlayer.getOutOfJailFreeCards > 0){
        recipientPlayer.getOutOfJailFreeCards += bankruptPlayer.getOutOfJailFreeCards;
        logMessage(`${recipientPlayer.name} receives ${bankruptPlayer.getOutOfJailFreeCards} Get Out of Detention Free card(s).`);
    }


    bankruptPlayer.money = 0; // Or negative to show debt
    bankruptPlayer.properties = []; // Clear properties array (though master list is on board)
    state.players = state.players.filter(p => p.id !== bankruptPlayer.id);

    if (state.players.length > 0 && state.currentPlayerIndex >= state.players.length) {
        state.currentPlayerIndex = 0; // Reset to first player if current bankrupt player was last in array
    } else if (state.players.length > 0 && state.players[state.currentPlayerIndex].id === bankruptPlayer.id) {
        // If the current player went bankrupt, the turn should pass.
        // The endTurn logic will handle finding the next valid player.
        // For now, ensure the index doesn't point to a non-existent player.
        // No need to explicitly call endTurn here, as the game flow will continue.
    }


    updatePlayerInfo();
    updateBoardUI();
    checkWinCondition();
    if (state.gameOver) return;

    // If the bankrupt player was the current player, we need to ensure the turn ends correctly.
    // The game should effectively move to the next player's turn start.
    // If bankruptcy happened mid-turn (e.g. paying rent), endTurn would normally be called.
    // If it happened at start of turn (e.g. can't pay to get out of jail), then setControlsForTurnStart for next player.

    // If the current player is the one who went bankrupt, and the game isn't over
    if (state.players.length > 0 && !state.players.find(p => p.id === bankruptPlayer.id)) {
         // Adjust currentPlayerIndex if needed to point to a valid player
        let validPlayerFound = false;
        for(let i = 0; i < state.players.length; i++) {
            if (state.players[state.currentPlayerIndex]) {
                validPlayerFound = true;
                break;
            }
            state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
        }
        if (validPlayerFound) {
            logMessage(`Advancing to ${state.players[state.currentPlayerIndex].name}'s turn.`);
            setControlsForTurnStart(); // Setup for the next player.
        } else {
            // This case should ideally not be reached if checkWinCondition works
            logMessage("Error: No valid next player after bankruptcy.", "error");
        }
    }
}


function checkWinCondition() {
    if (state.players.length === 1) {
        state.gameOver = true;
        logMessage(`${state.players[0].name} is the last player standing! ${state.players[0].name} wins!`, 'success');
        DOMElements.rollDiceBtn.disabled = true;
        DOMElements.endTurnBtn.disabled = true;
        // Hide all action panels
        if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display = 'none';
        if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'none';
        if(DOMElements.buyPropertyBtn) DOMElements.buyPropertyBtn.style.display = 'none';

    } else if (state.players.length === 0) {
        state.gameOver = true;
        logMessage("All players are bankrupt! No winner.", "error");
        DOMElements.rollDiceBtn.disabled = true;
        DOMElements.endTurnBtn.disabled = true;
    }
}


function drawCard(player, deck, cardType) {
    if (deck.length === 0) { // Should not happen if cards are recycled
        logMessage(`No ${cardType} cards left! Reshuffling.`, 'warning');
        if (cardType === 'Force Card') state.chanceCardsShuffled = shuffleArray([...chanceCards]);
        else state.communityChestCardsShuffled = shuffleArray([...communityChestCards]);
        deck = (cardType === 'Force Card') ? state.chanceCardsShuffled : state.communityChestCardsShuffled;
    }

    const cardText = deck.shift();
    deck.push(cardText); // Recycle card to bottom of deck

    logMessage(`${player.name} drew a ${cardType}: "${cardText}"`);

    let movedByCard = false;
    let oldPosition = player.position;
    let landOnNewSpace = true; // Assume player will land and trigger space action unless card says otherwise

    switch (cardText) {
        case "Advance to START (Collect ₡200)":
            player.position = 0;
            player.money += 200;
            logMessage(`${player.name} advanced to START and collected ₡200.`);
            movedByCard = true;
            landOnNewSpace = false; // START has no action other than collect
            break;
        case "Advance to Starkiller Base. If you pass START, collect ₡200.":
            if (player.position > 24) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`);}
            player.position = 24; // Starkiller Base ID
            logMessage(`${player.name} advanced to Starkiller Base.`);
            movedByCard = true;
            break;
        case "Advance to Cloud City. If you pass START, collect ₡200.":
            if (player.position > 11) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`);}
            player.position = 11; // Cloud City ID
            logMessage(`${player.name} advanced to Cloud City.`);
            movedByCard = true;
            break;
        case "Advance to nearest Facility. If unowned, you may buy it from the Bank. If owned, pay owner 10 times amount shown on dice.":
            const nearestFacility = findNextSpaceType(oldPosition, 'facility');
            if (nearestFacility) {
                if (player.position > nearestFacility.id && oldPosition > nearestFacility.id) { /* No change in passing START if moving backwards towards it */ }
                else if (player.position > nearestFacility.id || (oldPosition < nearestFacility.id && player.position < oldPosition /* full loop */ ) ) {
                     player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`);
                }
                player.position = nearestFacility.id;
                logMessage(`${player.name} advanced to nearest Facility: ${nearestFacility.name}.`);
                movedByCard = true; // landOnSpace will handle rent/buy
            }
            break;
        case "Advance to nearest Hyperspace Lane. If unowned, you may buy it from the Bank. If owned, pay owner twice the rental to which he/she is otherwise entitled.":
            const nearestLane = findNextSpaceType(oldPosition, 'hyperspace_lane');
            if (nearestLane) {
                if (player.position > nearestLane.id && oldPosition > nearestLane.id) {}
                else if (player.position > nearestLane.id || (oldPosition < nearestLane.id && player.position < oldPosition ) ) {
                     player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`);
                }
                player.position = nearestLane.id;
                logMessage(`${player.name} advanced to nearest Hyperspace Lane: ${nearestLane.name}.`);
                // Special rent for this card if owned
                if (nearestLane.owner !== null && nearestLane.owner !== player.id && !nearestLane.mortgaged) {
                    const owner = state.players.find(p=>p.id === nearestLane.owner);
                    const rent = calculateHyperspaceLaneRent(owner, nearestLane) * 2;
                    logMessage(`${player.name} pays ${owner.name} double rent of ₡${rent} for ${nearestLane.name}.`);
                    payMoney(player, owner, rent);
                    landOnNewSpace = false; // Rent handled, no further action on this space
                } else {
                    movedByCard = true; // landOnSpace will handle buy if unowned
                }
            }
            break;
        case "Bank pays you dividend of ₡50":
            player.money += 50;
            logMessage(`${player.name} collected ₡50 dividend.`);
            landOnNewSpace = false;
            break;
        case "Get Out of Detention Free Card":
            player.getOutOfJailFreeCards++;
            logMessage(`${player.name} received a Get Out of Detention Free Card.`);
            landOnNewSpace = false;
            break;
        case "Go back 3 spaces":
            player.position = (player.position - 3 + board.length) % board.length;
            logMessage(`${player.name} moved back 3 spaces to ${board[player.position].name}.`);
            movedByCard = true;
            break;
        case "Go to Detention Block – Go directly to Detention Block – Do not pass START, do not collect ₡200":
            sendToJail(player);
            landOnNewSpace = false; // sendToJail handles all necessary updates
            break;
        case "Make general repairs on all your holdings. For each Dwelling pay ₡25. For each Fortress pay ₡100.":
            let repairCost = 0;
            board.forEach(prop => {
                if (prop.owner === player.id && prop.type === 'location') {
                    if (prop.houses === 5) repairCost += 100; // Fortress
                    else repairCost += prop.houses * 25; // Dwellings
                }
            });
            if (repairCost > 0) {
                logMessage(`${player.name} pays ₡${repairCost} for repairs.`);
                payMoney(player, 'bank', repairCost);
            } else {
                logMessage(`${player.name} has no buildings, no repair costs.`);
            }
            landOnNewSpace = false;
            break;
        case "Pay poor tax of ₡15":
            payMoney(player, 'bank', 15);
            landOnNewSpace = false;
            break;
        case "Take a trip to Hyperspace Lane 1. If you pass START, collect ₡200.": // Reading Railroad
            if (player.position > 5) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`);}
            player.position = 5;
            logMessage(`${player.name} took a trip to Hyperspace Lane 1.`);
            movedByCard = true;
            break;
        case "Advance to Death Star Throne Room.": // Boardwalk
             // No GO collection even if passing, as per classic Monopoly rule for this card.
            player.position = 39;
            logMessage(`${player.name} advanced to Death Star Throne Room.`);
            movedByCard = true;
            break;
        case "You have been elected Chairman of the Galactic Senate – Pay each player ₡50.":
            state.players.forEach(p => {
                if (p.id !== player.id) {
                    payMoney(player, p, 50);
                }
            });
            landOnNewSpace = false;
            break;
        case "Your loan matures. Collect ₡150":
            player.money += 150;
            logMessage(`${player.name} collected ₡150.`);
            landOnNewSpace = false;
            break;
        case "You have won a droid race competition. Collect ₡100":
            player.money += 100;
            logMessage(`${player.name} collected ₡100.`);
            landOnNewSpace = false;
            break;
        // Community Chest Cards
        case "Bank error in your favor – Collect ₡200":
            player.money += 200;
            logMessage(`${player.name} collected ₡200.`);
            landOnNewSpace = false;
            break;
        case "Healer's fee – Pay ₡50":
            payMoney(player, 'bank', 50);
            landOnNewSpace = false;
            break;
        case "From sale of stolen goods you get ₡45.":
             player.money += 45;
             logMessage(`${player.name} collected ₡45.`);
             landOnNewSpace = false;
            break;
        case "Rebel Fund matures. Receive ₡100.":
            player.money += 100;
            logMessage(`${player.name} received ₡100.`);
            landOnNewSpace = false;
            break;
        case "Tax refund – Collect ₡20":
            player.money += 20;
            logMessage(`${player.name} collected ₡20.`);
            landOnNewSpace = false;
            break;
        case "It is your birth-cycle. Collect ₡10 from each player.":
            state.players.forEach(p => {
                if (p.id !== player.id) {
                    // Player p pays current player
                    if (p.money >= 10) { // Check if they can afford
                        p.money -=10;
                        player.money +=10;
                        logMessage(`${p.name} paid ₡10 to ${player.name}.`);
                    } else {
                        logMessage(`${p.name} cannot afford to pay ₡10.`);
                        // Potentially handle partial payment or bankruptcy for p
                        payMoney(p, player, 10); // This will trigger bankruptcy if needed
                    }
                }
            });
            updatePlayerInfo();
            landOnNewSpace = false;
            break;
        case "Life insurance matures – Collect ₡100":
            player.money += 100;
            logMessage(`${player.name} collected ₡100.`);
            landOnNewSpace = false;
            break;
        case "Pay medical bay ₡100":
            payMoney(player, 'bank', 100);
            landOnNewSpace = false;
            break;
        case "Pay training fees of ₡50":
            payMoney(player, 'bank', 50);
            landOnNewSpace = false;
            break;
        case "Receive ₡25 bounty fee":
            player.money += 25;
            logMessage(`${player.name} collected ₡25.`);
            landOnNewSpace = false;
            break;
        case "You are assessed for orbital repairs – Pay ₡40 per Dwelling, ₡115 per Fortress":
            let repairCostCC = 0;
            board.forEach(prop => {
                if (prop.owner === player.id && prop.type === 'location') {
                    if (prop.houses === 5) repairCostCC += 115; // Fortress
                    else repairCostCC += prop.houses * 40; // Dwellings
                }
            });
            if (repairCostCC > 0) {
                logMessage(`${player.name} pays ₡${repairCostCC} for orbital repairs.`);
                payMoney(player, 'bank', repairCostCC);
            } else {
                logMessage(`${player.name} has no buildings, no repair costs.`);
            }
            landOnNewSpace = false;
            break;
        case "You have won second prize in a beauty contest – Collect ₡10":
            player.money += 10;
            logMessage(`${player.name} collected ₡10.`);
            landOnNewSpace = false;
            break;
        case "Inherit ₡100":
            player.money += 100;
            logMessage(`${player.name} inherited ₡100.`);
            landOnNewSpace = false;
            break;
        default:
            logMessage(`Unhandled card: "${cardText}" from ${cardType}.`, 'warning');
            landOnNewSpace = false; // Default to no further space action for unhandled
    }

    updatePlayerInfo();
    updateBoardUI();

    if (movedByCard && landOnNewSpace && !player.inJail) {
        landOnSpace(player); // Process action for the new space
    } else {
        // If not moving or if landing action is handled by card, just update controls
        state.currentActionPending = 'none'; // Card action might supersede landing action
        setControls();
    }
}


function showBuyPropertyAction(player, space) {
    DOMElements.propertyActionsDiv.style.display = 'flex';
    DOMElements.buyPropertyBtn.style.display = 'inline-block';
    DOMElements.buyPropertyBtn.onclick = () => {
        buyProperty(player, space);
        // After buying, hide buy button and refresh management options
        DOMElements.buyPropertyBtn.style.display = 'none';
        state.currentActionPending = 'manage'; // Set to manage after buying
        showPropertyManagementActions(player); // Show other options
        setControls(); // Re-evaluate controls like end turn
    };

    // Hide other property management buttons when buy is available
    DOMElements.buildHouseBtn.style.display = 'none';
    DOMElements.sellHouseBtn.style.display = 'none';
    DOMElements.sellHouseSelect.style.display = 'none';
    DOMElements.mortgageSelect.style.display = 'none';
    DOMElements.mortgagePropertyBtn.style.display = 'none';
    DOMElements.unmortgageSelect.style.display = 'none';
    DOMElements.unmortgagePropertyBtn.style.display = 'none';
}

function showPropertyManagementActions(player) {
    // Always hide buy button when showing management actions
    DOMElements.buyPropertyBtn.style.display = 'none';

    const buildableProperties = getPlayerOwnedProperties(player, 'location')
        .filter(prop => !prop.mortgaged && prop.houses < 5 && player.money >= prop.houseCost && checkMonopoly(player, prop.colorGroup));

    let actuallyBuildable = [];
    if (buildableProperties.length > 0) {
        const groups = {}; // group properties by colorGroup
        buildableProperties.forEach(p => {
            if (!groups[p.colorGroup]) groups[p.colorGroup] = [];
            groups[p.colorGroup].push(p);
        });

        for (const color in groups) {
            const groupProps = groups[color];
            const minHousesInGroup = Math.min(...groupProps.map(p => p.houses));
            groupProps.forEach(p => {
                if (p.houses === minHousesInGroup) {
                    actuallyBuildable.push(p);
                }
            });
        }
    }
    actuallyBuildable.sort((a,b) => a.houses - b.houses || a.id - b.id); // Prioritize by fewer houses, then ID


    DOMElements.buildHouseBtn.style.display = actuallyBuildable.length > 0 ? 'inline-block' : 'none';
    if (actuallyBuildable.length > 0) {
        DOMElements.buildHouseBtn.onclick = () => showBuildHouseDialog(player, actuallyBuildable);
    } else {
        DOMElements.buildHouseBtn.onclick = null; // Clear listener if no buildable
    }

    const mortgagableProperties = getPlayerOwnedProperties(player, null, true) // Get all properties (location, lane, facility)
        .filter(prop => !prop.mortgaged && (prop.type !== 'location' || prop.houses === 0)); // Locations must have 0 houses

    populateSelect(DOMElements.mortgageSelect, mortgagableProperties, 'Mortgage Holding');
    DOMElements.mortgageSelect.style.display = mortgagableProperties.length > 0 ? 'block' : 'none';
    DOMElements.mortgagePropertyBtn.style.display = mortgagableProperties.length > 0 ? 'inline-block' : 'none';
    DOMElements.mortgagePropertyBtn.disabled = true; // Disable initially

    const unmortgagableProperties = getPlayerOwnedProperties(player, null, true)
        .filter(prop => prop.mortgaged && player.money >= Math.ceil(prop.price / 2 * 1.1));
    populateSelect(DOMElements.unmortgageSelect, unmortgagableProperties, 'Unmortgage Holding');
    DOMElements.unmortgageSelect.style.display = unmortgagableProperties.length > 0 ? 'block' : 'none';
    DOMElements.unmortgagePropertyBtn.style.display = unmortgagableProperties.length > 0 ? 'inline-block' : 'none';
    DOMElements.unmortgagePropertyBtn.disabled = true; // Disable initially


    const sellableHouseProperties = getPlayerOwnedProperties(player, 'location', true)
        .filter(prop => prop.houses > 0);
    let actuallySellable = [];
    if(sellableHouseProperties.length > 0) {
        const groups = {};
        sellableHouseProperties.forEach(p => {
            if (!groups[p.colorGroup]) groups[p.colorGroup] = [];
            groups[p.colorGroup].push(p);
        });
        for (const color in groups) {
            const groupProps = groups[color];
            const maxHousesInGroup = Math.max(...groupProps.map(p => p.houses));
            groupProps.forEach(p => {
                if (p.houses === maxHousesInGroup) {
                    actuallySellable.push(p);
                }
            });
        }
    }
    actuallySellable.sort((a,b) => b.houses - a.houses || a.id - b.id); // Prioritize by more houses, then ID

    populateSelect(DOMElements.sellHouseSelect, actuallySellable, 'Sell Dwelling');
    DOMElements.sellHouseSelect.style.display = actuallySellable.length > 0 ? 'block' : 'none';
    DOMElements.sellHouseBtn.style.display = actuallySellable.length > 0 ? 'inline-block' : 'none';
    DOMElements.sellHouseBtn.disabled = true; // Disable initially


    // Show the entire property actions panel if any action is available
    DOMElements.propertyActionsDiv.style.display = (
        DOMElements.buildHouseBtn.style.display !== 'none' ||
        DOMElements.mortgagePropertyBtn.style.display !== 'none' ||
        DOMElements.unmortgagePropertyBtn.style.display !== 'none' ||
        DOMElements.sellHouseBtn.style.display !== 'none'
    ) ? 'flex' : 'none';
}

function populateSelect(selectElement, properties, defaultOptionText) {
    selectElement.innerHTML = `<option value="">-- ${defaultOptionText} --</option>`;
    properties.forEach(prop => {
        const option = document.createElement('option');
        option.value = prop.id;
        let text = prop.name;
        if (prop.mortgaged) text += ' (M)';
        if (prop.type === 'location' && prop.houses > 0) text += ` (D: ${prop.houses === 5 ? 'F' : prop.houses})`;
        if (selectElement === DOMElements.unmortgageSelect && prop.mortgaged) {
            text += ` - Cost: ₡${Math.ceil(prop.price / 2 * 1.1)}`;
        }
        option.textContent = text;
        selectElement.appendChild(option);
    });

    selectElement.disabled = properties.length === 0;
    // Ensure corresponding button is enabled/disabled based on selection
    const buttonToToggle = {
        [DOMElements.mortgageSelect.id]: DOMElements.mortgagePropertyBtn,
        [DOMElements.unmortgageSelect.id]: DOMElements.unmortgagePropertyBtn,
        [DOMElements.sellHouseSelect.id]: DOMElements.sellHouseBtn
    }[selectElement.id];

    if (buttonToToggle) {
        buttonToToggle.disabled = true; // Always disable button initially
        selectElement.onchange = () => {
            buttonToToggle.disabled = !selectElement.value; // Enable if a value is selected
        };
    }
}


function showBuildHouseDialog(player, availableProperties) {
    // Remove any existing build dialog first
    const existingDialog = DOMElements.propertyActionsDiv.querySelector('.build-house-dialog');
    if (existingDialog) existingDialog.remove();

    const selectDiv = document.createElement('div');
    selectDiv.className = 'build-house-dialog'; // For potential specific styling
    selectDiv.style.marginTop = '10px';
    selectDiv.innerHTML = `
        <p>Build on:</p>
        <select id="build-house-prop-select" class="action-select" style="margin-bottom: 5px;"></select>
        <button id="confirm-build-btn" class="button-group button" style="width:auto; padding: 5px 10px;">Build</button>
        <button id="cancel-build-btn" class="button-group button" style="width:auto; padding: 5px 10px; background-color: #6c757d;">Cancel</button>
    `;
    const buildSelect = selectDiv.querySelector('#build-house-prop-select');
    const confirmBtn = selectDiv.querySelector('#confirm-build-btn');
    const cancelBtn = selectDiv.querySelector('#cancel-build-btn');

    availableProperties.forEach(prop => {
        const option = document.createElement('option');
        option.value = prop.id;
        option.textContent = `${prop.name} (D: ${prop.houses === 5 ? 'F' : prop.houses}) - Cost: ₡${prop.houseCost}`;
        buildSelect.appendChild(option);
    });
    if (availableProperties.length > 0) buildSelect.value = availableProperties[0].id; // Pre-select first
    confirmBtn.disabled = availableProperties.length === 0;


    DOMElements.propertyActionsDiv.appendChild(selectDiv); // Append to main actions div
    DOMElements.buildHouseBtn.style.display = 'none'; // Hide the generic build button

    confirmBtn.onclick = () => {
        const propId = parseInt(buildSelect.value);
        const prop = board.find(p => p.id === propId); // Find from board for safety

        if (!prop || prop.owner !== player.id || player.money < prop.houseCost || prop.houses >= 5 || prop.mortgaged) {
            logMessage("Cannot build Dwelling here (insufficient funds, maxed out, mortgaged, or not owned).", "error");
            return;
        }
        // Even build rule check (simplified: build on one with fewest houses in its group)
        const groupProperties = getPropertiesByColor(prop.colorGroup).filter(p => p.owner === player.id);
        const minHousesInGroup = Math.min(...groupProperties.map(p => p.houses));

        if (prop.houses > minHousesInGroup && checkMonopoly(player, prop.colorGroup)) {
             logMessage(`Must build evenly. Build on '${groupProperties.find(p=>p.houses === minHousesInGroup).name}' first.`, "error");
             return;
        }


        player.money -= prop.houseCost;
        prop.houses++;
        logMessage(`${player.name} built a ${prop.houses === 5 ? 'Fortress' : 'Dwelling'} on ${prop.name}. Dwellings: ${prop.houses}.`);
        updatePlayerInfo();
        updateBoardUI();
        selectDiv.remove(); // Remove this specific dialog
        showPropertyManagementActions(player); // Refresh management actions
        setControls();
    };
    cancelBtn.onclick = () => {
        selectDiv.remove();
        DOMElements.buildHouseBtn.style.display = 'inline-block'; // Show generic build button again
        showPropertyManagementActions(player); // Refresh management actions
    };
}

export function mortgageProperty(propId) {
    const player = state.players[state.currentPlayerIndex];
    const prop = board.find(p => p.id === propId);
    if (prop && prop.owner === player.id && !prop.mortgaged && (prop.type !== 'location' || prop.houses === 0)) {
        prop.mortgaged = true;
        player.money += prop.price / 2;
        logMessage(`${player.name} mortgaged ${prop.name} for ₡${prop.price / 2}.`, 'info');
        updatePlayerInfo();
        updateBoardUI();
    } else {
        logMessage(`Cannot mortgage ${prop ? prop.name : 'selected holding'}. Must have no Dwellings and be unmortgaged.`, 'error');
    }
    showPropertyManagementActions(player); // Refresh options
    setControls();
}

export function unmortgageProperty(propId) {
    const player = state.players[state.currentPlayerIndex];
    const prop = board.find(p => p.id === propId);
    if (!prop) { logMessage("Holding not found.", "error"); return; }

    const unmortgageCost = Math.ceil(prop.price / 2 * 1.1); // 10% interest
    if (prop.owner === player.id && prop.mortgaged && player.money >= unmortgageCost) {
        prop.mortgaged = false;
        player.money -= unmortgageCost;
        logMessage(`${player.name} unmortgaged ${prop.name} for ₡${unmortgageCost}.`, 'info');
        updatePlayerInfo();
        updateBoardUI();
    } else {
        logMessage(`Cannot unmortgage ${prop.name}. Insufficient credits or not mortgaged by you.`, 'error');
    }
    showPropertyManagementActions(player); // Refresh options
    setControls();
}

export function sellHouse(propId) {
    const player = state.players[state.currentPlayerIndex];
    const prop = board.find(p => p.id === propId); // Find from board for safety

    if (!prop || prop.type !== 'location' || prop.owner !== player.id || prop.houses === 0) {
        logMessage(`Cannot sell Dwelling on ${prop ? prop.name : 'selected holding'}. No Dwellings or not owned.`, 'error');
        showPropertyManagementActions(player); // Refresh options
        setControls();
        return;
    }

    // Even sell rule: sell from properties in the group with the MOST houses first
    const groupProperties = getPropertiesByColor(prop.colorGroup).filter(p => p.owner === player.id);
    const maxHousesInGroup = Math.max(...groupProperties.map(p => p.houses));

    if (prop.houses < maxHousesInGroup && checkMonopoly(player, prop.colorGroup)) {
        logMessage(`Must sell evenly. Sell from holdings with more Dwellings in the ${prop.colorGroup} sector first.`, "error");
        showPropertyManagementActions(player);
        setControls();
        return;
    }

    prop.houses--;
    player.money += prop.houseCost / 2; // Get half price back
    logMessage(`${player.name} sold a ${prop.houses === 4 ? 'Fortress (now 4 Dwellings)' : 'Dwelling'} on ${prop.name} for ₡${prop.houseCost / 2}. Dwellings left: ${prop.houses}.`, 'info');
    updatePlayerInfo();
    updateBoardUI();
    showPropertyManagementActions(player); // Crucial to refresh the select dropdowns
    setControls();
}


export function payBail() {
    const player = state.players[state.currentPlayerIndex];
    if (player.inJail && player.money >= 50) {
        player.money -= 50;
        player.inJail = false;
        player.jailTurns = 0;
        logMessage(`${player.name} paid ₡50 bail to get out of Detention Block.`, 'success');
        updatePlayerInfo();
        setControlsForTurnStart(); // Reset controls as if starting a new turn out of jail
    } else {
        logMessage("Not enough credits to pay bail, or not in Detention.", "error");
    }
}

export function useJailCard() {
    const player = state.players[state.currentPlayerIndex];
    if (player.inJail && player.getOutOfJailFreeCards > 0) {
        player.getOutOfJailFreeCards--;
        player.inJail = false;
        player.jailTurns = 0;
        logMessage(`${player.name} used a Get Out of Detention Free Card!`, 'success');
        updatePlayerInfo();
        setControlsForTurnStart(); // Reset controls
    } else {
        logMessage("No Get Out of Detention Free Cards available, or not in Detention.", "error");
    }
}

function setControls() {
    if (state.gameOver) {
        DOMElements.rollDiceBtn.disabled = true;
        DOMElements.endTurnBtn.disabled = true;
        DOMElements.proposeTradeBtn.disabled = true;
        if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display = 'none';
        if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'none';
        return;
    }

    const player = state.players[state.currentPlayerIndex];
    if (!player) return; // Should not happen if game not over

    // Default states
    DOMElements.rollDiceBtn.disabled = true;
    DOMElements.endTurnBtn.disabled = true;
    DOMElements.proposeTradeBtn.disabled = true; // Usually disabled unless explicitly enabled
    if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display = 'none';
    if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'none';
    if(DOMElements.buyPropertyBtn) DOMElements.buyPropertyBtn.style.display = 'none';


    if (player.inJail) {
        if (player.hasRolled) { // Rolled but didn't get doubles
            DOMElements.endTurnBtn.disabled = false;
             if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'flex'; // Still show bail/card options
             if(DOMElements.payBailBtn) DOMElements.payBailBtn.disabled = player.money < 50;
             if(DOMElements.useJailCardBtn) DOMElements.useJailCardBtn.disabled = player.getOutOfJailFreeCards === 0;

        } else { // Haven't rolled yet this turn in jail
            DOMElements.rollDiceBtn.disabled = false;
            if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'flex';
            if(DOMElements.payBailBtn) DOMElements.payBailBtn.disabled = player.money < 50;
            if(DOMElements.useJailCardBtn) DOMElements.useJailCardBtn.disabled = player.getOutOfJailFreeCards === 0;

            if (player.jailTurns >= 3) { // Force pay/card if 3 turns passed without rolling doubles
                logMessage(`${player.name} must pay or use a card.`, "warning");
                DOMElements.rollDiceBtn.disabled = true; // Cannot roll on 4th attempt
                if (DOMElements.payBailBtn.disabled && DOMElements.useJailCardBtn.disabled) {
                    handleBankruptcy(player, 'bank', 50); // Auto-bankrupt if cannot pay/use card
                }
            }
        }
    } else { // Not in jail
        if (!player.hasRolled) { // Start of turn, hasn't rolled
            DOMElements.rollDiceBtn.disabled = false;
            DOMElements.proposeTradeBtn.disabled = false;
            showPropertyManagementActions(player); // Show options like build/mortgage
        } else { // Has rolled
            if (player.doublesRolledThisTurn > 0 && player.doublesRolledThisTurn < 3) {
                // Rolled doubles, gets another turn (roll is enabled)
                DOMElements.rollDiceBtn.disabled = false;
                DOMElements.proposeTradeBtn.disabled = false; // Can trade before rolling again
                showPropertyManagementActions(player);
                // End turn should be disabled as they roll again
            } else {
                // Normal roll (not doubles, or 3rd double handled by sendToJail)
                // Or got out of jail by doubles (doublesRolledThisTurn reset)
                DOMElements.endTurnBtn.disabled = false;
                DOMElements.proposeTradeBtn.disabled = false; // Can trade before ending turn
                 if (state.currentActionPending === 'buy') {
                    showBuyPropertyAction(player, board[player.position]);
                } else { // Includes 'manage' or 'none' (after paying rent etc)
                    showPropertyManagementActions(player);
                }
            }
        }
    }

    // If auction or trade is active, override most controls
    if (state.isAuctionActive || state.isTradeActive) {
        DOMElements.rollDiceBtn.disabled = true;
        DOMElements.endTurnBtn.disabled = true;
        DOMElements.proposeTradeBtn.disabled = true;
        if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display = 'none';
        if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'none';
    }
}


function setControlsForTurnStart() {
    if (state.gameOver || !state.players[state.currentPlayerIndex]) return;
    const player = state.players[state.currentPlayerIndex];
    player.hasRolled = false;
    player.doublesRolledThisTurn = 0;
    state.currentActionPending = 'none';

    if (player.inJail) {
        logMessage(`${player.name} is in the Detention Block. Options: Roll, Pay Bail, Use Card.`, 'warning');
        if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'flex';
        if(DOMElements.payBailBtn) DOMElements.payBailBtn.disabled = player.money < 50;
        if(DOMElements.useJailCardBtn) DOMElements.useJailCardBtn.disabled = player.getOutOfJailFreeCards === 0;
        DOMElements.rollDiceBtn.disabled = false;
        DOMElements.endTurnBtn.disabled = true; // Can't end turn before attempting to get out
        if (player.jailTurns >= 3 && DOMElements.payBailBtn.disabled && DOMElements.useJailCardBtn.disabled) {
            handleBankruptcy(player, 'bank', 50);
        }

    } else {
        DOMElements.rollDiceBtn.disabled = false;
        DOMElements.endTurnBtn.disabled = true;
        if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'none';
    }
    DOMElements.proposeTradeBtn.disabled = player.inJail; // Can't propose trade from jail unless just got out
    showPropertyManagementActions(player); // Show mortgage/build options
}


export function endTurn() {
    if (state.isAuctionActive || state.isTradeActive || state.gameOver) return;

    const currentPlayer = state.players[state.currentPlayerIndex];

    if (state.currentActionPending === 'buy') {
        const spaceToAuction = board[currentPlayer.position];
        logMessage(`${currentPlayer.name} declined to buy ${spaceToAuction.name}. It will be auctioned.`);
        startAuction(spaceToAuction.id);
        // Auction will handle UI and next steps, so we don't proceed to next player yet.
        return;
    }

    logMessage(`${currentPlayer.name}'s turn ended.`);
    currentPlayer.doublesRolledThisTurn = 0; // Reset for next turn

    // Find next active player
    let nextPlayerIndex = state.currentPlayerIndex;
    do {
        nextPlayerIndex = (nextPlayerIndex + 1) % state.players.length;
    } while (state.players.length > 1 && state.players[nextPlayerIndex].money < 0 && state.players[nextPlayerIndex].properties.length === 0 && nextPlayerIndex !== state.currentPlayerIndex); // Skip bankrupt players, ensure loop terminates

    state.currentPlayerIndex = nextPlayerIndex;

    if (state.players.length <= 1) { // checkWinCondition might have been called by bankruptcy
        checkWinCondition(); // Call again to be sure if it wasn't due to bankruptcy
        if(state.gameOver) return;
    }
    
    logMessage(`It's ${state.players[state.currentPlayerIndex].name}'s turn.`);
    setControlsForTurnStart();
    updatePlayerInfo(); // Update for the new current player
}


// --- Auction Logic ---
function showAuctionMessage(message) {
    DOMElements.auctionMessageArea.textContent = message;
}

function startAuction(propId) {
    state.isAuctionActive = true;
    state.auctionPropertyId = propId;
    state.currentBid = 0;
    state.highestBidderId = null;
    // Only include non-bankrupt players in the auction
    state.auctionBidders = state.players.filter(p => p.money >= 1); // Must have at least 1 to bid
    if(state.auctionBidders.length === 0){
        logMessage("No players eligible for auction. Property remains unowned.", "info");
        endAuction(); // No one to bid
        return;
    }
    // Try to start with current player if eligible, otherwise first eligible bidder
    let initialBidderIndex = state.auctionBidders.findIndex(p=>p.id === state.players[state.currentPlayerIndex].id);
    state.auctionCurrentBidderIndex = initialBidderIndex !== -1 ? initialBidderIndex : 0;


    DOMElements.rollDiceBtn.disabled = true;
    DOMElements.endTurnBtn.disabled = true;
    if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display = 'none';
    if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'none';

    document.body.classList.add('auction-active');
    DOMElements.auctionModalOverlay.style.display = 'flex';
    DOMElements.auctionWithdrawBtn.textContent = "Pass"; // Or "Withdraw from Auction"
    updateAuctionUI();
}

function updateAuctionUI() {
    if (!state.isAuctionActive) return;
    showAuctionMessage('');
    const property = board[state.auctionPropertyId];
    DOMElements.auctionPropertyName.textContent = property.name;
    DOMElements.auctionCurrentBid.textContent = `₡${state.currentBid}`;
    DOMElements.auctionHighestBidder.textContent = state.highestBidderId !== null && state.players.find(p => p.id === state.highestBidderId) ? state.players.find(p => p.id === state.highestBidderId).name : 'None';

    if (state.auctionBidders.length === 0 || !state.auctionBidders[state.auctionCurrentBidderIndex]) {
        logMessage("Auction error: No current bidder.", "error");
        endAuction(); // Should not happen if startAuction checks bidders
        return;
    }
    const currentBidder = state.auctionBidders[state.auctionCurrentBidderIndex];
    DOMElements.auctionCurrentBidder.textContent = currentBidder.name;
    DOMElements.auctionBidAmountInput.value = state.currentBid + 1;
    DOMElements.auctionBidAmountInput.min = state.currentBid + 1; // Min bid is 1 more than current
}

export function handlePlaceBid() {
    if (!state.isAuctionActive || state.auctionBidders.length === 0) return;
    const bidAmount = parseInt(DOMElements.auctionBidAmountInput.value);
    const bidder = state.auctionBidders[state.auctionCurrentBidderIndex];

    if (isNaN(bidAmount) || bidAmount <= state.currentBid) {
        showAuctionMessage(`Invalid bid. Must be higher than ₡${state.currentBid}.`);
        return;
    }
    if (bidAmount > bidder.money) {
        showAuctionMessage(`${bidder.name} cannot afford to bid ₡${bidAmount}. Max bid: ₡${bidder.money}`);
        DOMElements.auctionBidAmountInput.value = bidder.money; // Suggest max affordable bid
        return;
    }

    state.currentBid = bidAmount;
    state.highestBidderId = bidder.id;
    logMessage(`${bidder.name} bids ₡${state.currentBid} for ${board[state.auctionPropertyId].name}.`, 'info');
    nextBidder();
}

export function handlePass() {
    if (!state.isAuctionActive || state.auctionBidders.length === 0) return;
    const currentPassingBidder = state.auctionBidders[state.auctionCurrentBidderIndex];
    logMessage(`${currentPassingBidder.name} passes.`, 'info');

    // Remove the player from the list of active bidders for this auction
    state.auctionBidders.splice(state.auctionCurrentBidderIndex, 1);

    if (state.auctionBidders.length === 0) { // No one left to bid
        endAuction(); // Property goes to last highest bidder or remains unowned
    } else if (state.auctionBidders.length === 1 && state.highestBidderId !== null) {
        // If only one bidder remains and there was a bid, they win by default
        if(state.auctionBidders[0].id === state.highestBidderId) {
            endAuction();
        } else {
             // This case is tricky: if the last remaining bidder is NOT the highest bidder,
             // they still get a chance to outbid or the property sells to highest.
             // For simplicity, let's assume highest bidder wins if only one other passes.
             // A more complex rule would allow the remaining bidder one more chance if they aren't highest.
             state.auctionCurrentBidderIndex = state.auctionCurrentBidderIndex % state.auctionBidders.length; // Adjust index
             updateAuctionUI();
        }
    } else {
        state.auctionCurrentBidderIndex = state.auctionCurrentBidderIndex % state.auctionBidders.length; // Adjust index due to removal
        updateAuctionUI();
    }
}


function nextBidder() {
    if (state.auctionBidders.length === 0) { // Should be caught by handlePass/handlePlaceBid
        endAuction();
        return;
    }
    if (state.auctionBidders.length === 1 && state.highestBidderId !== null && state.auctionBidders[0].id === state.highestBidderId) {
        // If only one bidder left and they are the highest bidder, they win.
        endAuction();
        return;
    }

    state.auctionCurrentBidderIndex = (state.auctionCurrentBidderIndex + 1) % state.auctionBidders.length;
    updateAuctionUI();
}


function endAuction() {
    const property = board[state.auctionPropertyId];
    if (state.highestBidderId !== null && state.players.find(p=>p.id === state.highestBidderId)) {
        const winner = state.players.find(p => p.id === state.highestBidderId);
        logMessage(`${winner.name} wins the auction for ${property.name} with a bid of ₡${state.currentBid}!`, 'success');
        // Actual payment and property transfer
        winner.money -= state.currentBid;
        property.owner = winner.id;
        // property.properties.push(property.id); // Not needed, owner is on board object
    } else {
        logMessage(`No valid bids were placed for ${property.name}. It remains unowned.`, 'info');
    }

    state.isAuctionActive = false;
    state.auctionPropertyId = null;
    state.auctionBidders = []; // Clear bidders for next auction
    document.body.classList.remove('auction-active');
    DOMElements.auctionModalOverlay.style.display = 'none';

    state.currentActionPending = 'none'; // Reset pending action
    setControlsForTurnStart(); // Or just setControls() if turn should not reset
    updatePlayerInfo();
    updateBoardUI();
}

// --- Trade Logic ---
function showTradeMessage(message) {
    DOMElements.tradeMessageArea.textContent = message;
}

export function showTradeModal() {
    if (state.isAuctionActive || state.gameOver) return;
    state.isTradeActive = true;
    showTradeMessage('');

    DOMElements.rollDiceBtn.disabled = true;
    DOMElements.endTurnBtn.disabled = true;

    DOMElements.tradeOfferMoney.value = 0;
    DOMElements.tradeRequestMoney.value = 0;
    DOMElements.tradeOfferCards.value = 0;
    DOMElements.tradeRequestCards.value = 0;

    DOMElements.tradePartnerSelect.innerHTML = '<option value="">-- Select Player --</option>';
    state.players.forEach((player) => { // Iterate over all players
        if (player.id !== state.players[state.currentPlayerIndex].id) { // Exclude current player
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.name;
            DOMElements.tradePartnerSelect.appendChild(option);
        }
    });
    DOMElements.tradePartnerSelect.value = ""; // Ensure no partner is pre-selected

    updateTradeModalAssets(); // Call once to populate based on no selection initially
    document.body.classList.add('trade-active');
    DOMElements.tradeModalOverlay.style.display = 'flex';
}

export function updateTradeModalAssets() {
    const proposer = state.players[state.currentPlayerIndex];
    const partnerId = parseInt(DOMElements.tradePartnerSelect.value);
    const partner = state.players.find(p => p.id === partnerId);

    DOMElements.tradeOfferProperties.innerHTML = '';
    getPlayerOwnedProperties(proposer, null, true)
        .filter(p => p.type !== 'location' || p.houses === 0) // Can't trade props with houses
        .forEach(prop => {
            const option = document.createElement('option');
            option.value = prop.id;
            option.textContent = `${prop.name}${prop.mortgaged ? ' (M)' : ''}`;
            DOMElements.tradeOfferProperties.appendChild(option);
        });
    DOMElements.tradeOfferCards.max = proposer.getOutOfJailFreeCards;
    DOMElements.tradeOfferMoney.max = proposer.money;


    DOMElements.tradeRequestProperties.innerHTML = '';
    if (partner) {
        getPlayerOwnedProperties(partner, null, true)
            .filter(p => p.type !== 'location' || p.houses === 0)
            .forEach(propId => {
                const prop = board.find(p => p.id === propId.id); // Ensure we get the board object
                const option = document.createElement('option');
                option.value = prop.id;
                option.textContent = `${prop.name}${prop.mortgaged ? ' (M)' : ''}`;
                DOMElements.tradeRequestProperties.appendChild(option);
            });
        DOMElements.tradeRequestCards.max = partner.getOutOfJailFreeCards;
        DOMElements.tradeRequestMoney.max = partner.money;

    } else {
        DOMElements.tradeRequestCards.max = 0;
        DOMElements.tradeRequestCards.value = 0;
        DOMElements.tradeRequestMoney.max = 0;
        DOMElements.tradeRequestMoney.value = 0;
    }
}


export function handleSendProposal() {
    showTradeMessage('');
    const proposer = state.players[state.currentPlayerIndex];
    state.tradePartnerId = parseInt(DOMElements.tradePartnerSelect.value);

    if (isNaN(state.tradePartnerId)) {
        showTradeMessage("Please select a player to trade with.");
        return;
    }
    const partner = state.players.find(p => p.id === state.tradePartnerId);
    if (!partner) {
        showTradeMessage("Selected trade partner not found.");
        return;
    }


    state.tradeOffer = {
        money: parseInt(DOMElements.tradeOfferMoney.value) || 0,
        properties: Array.from(DOMElements.tradeOfferProperties.selectedOptions).map(opt => parseInt(opt.value)),
        cards: parseInt(DOMElements.tradeOfferCards.value) || 0
    };
    state.tradeRequest = {
        money: parseInt(DOMElements.tradeRequestMoney.value) || 0,
        properties: Array.from(DOMElements.tradeRequestProperties.selectedOptions).map(opt => parseInt(opt.value)),
        cards: parseInt(DOMElements.tradeRequestCards.value) || 0
    };

    // Validations
    if (state.tradeOffer.money < 0 || state.tradeRequest.money < 0 || state.tradeOffer.cards < 0 || state.tradeRequest.cards < 0) {
        showTradeMessage("Amounts cannot be negative."); return;
    }
    if (state.tradeOffer.money > proposer.money) {
        showTradeMessage("You cannot offer more credits than you have."); return;
    }
    if (state.tradeOffer.cards > proposer.getOutOfJailFreeCards) {
        showTradeMessage("You cannot offer more Get Out of Detention cards than you have."); return;
    }
    if (state.tradeRequest.money > partner.money) {
        showTradeMessage(`${partner.name} does not have enough credits for this request.`); return;
    }
    if (state.tradeRequest.cards > partner.getOutOfJailFreeCards) {
        showTradeMessage(`${partner.name} does not have enough Get Out of Detention cards for this request.`); return;
    }

    // Check properties for houses (should be pre-filtered by updateTradeModalAssets, but double check)
    const allTradePropIds = [...state.tradeOffer.properties, ...state.tradeRequest.properties];
    for (const propId of allTradePropIds) {
        const prop = board.find(p => p.id === propId);
        if (prop && prop.type === 'location' && prop.houses > 0) {
            showTradeMessage(`Cannot trade ${prop.name} as it has Dwellings/Fortresses. They must be sold first.`);
            return;
        }
    }
    if(state.tradeOffer.properties.length === 0 && state.tradeRequest.properties.length === 0 && state.tradeOffer.money === 0 && state.tradeRequest.money === 0 && state.tradeOffer.cards === 0 && state.tradeRequest.cards === 0){
        showTradeMessage("Cannot send an empty trade proposal."); return;
    }


    showTradeReviewModal();
}

function showTradeReviewModal() {
    const proposer = state.players[state.currentPlayerIndex];
    const partner = state.players.find(p => p.id === state.tradePartnerId);

    DOMElements.reviewProposerName.textContent = proposer.name;
    DOMElements.reviewPartnerName.textContent = partner.name;

    DOMElements.reviewOfferMoney.textContent = `₡${state.tradeOffer.money}`;
    DOMElements.reviewOfferCards.textContent = state.tradeOffer.cards;
    DOMElements.reviewOfferProperties.innerHTML = state.tradeOffer.properties.map(id => `<li>${board.find(p=>p.id===id).name}</li>`).join('') || '<li>None</li>';

    DOMElements.reviewRequestMoney.textContent = `₡${state.tradeRequest.money}`;
    DOMElements.reviewRequestCards.textContent = state.tradeRequest.cards;
    DOMElements.reviewRequestProperties.innerHTML = state.tradeRequest.properties.map(id => `<li>${board.find(p=>p.id===id).name}</li>`).join('') || '<li>None</li>';

    DOMElements.tradeModalOverlay.style.display = 'none';
    DOMElements.tradeReviewModalOverlay.style.display = 'flex';
}

export function handleAcceptTrade() {
    const proposer = state.players[state.currentPlayerIndex]; // This is actually the RECIPIENT at this point
    const actualProposer = state.players.find(p => p.id === state.tradeOffer.originalProposerId); // Need to store original proposer ID
    const partner = state.players.find(p => p.id === state.tradePartnerId); // This is the one being traded with by actualProposer

    // The logic needs to be from the perspective of the original proposer and partner
    // Let's assume `proposer` from `state.currentPlayerIndex` is the one who SENT the proposal
    // and `partner` (derived from `state.tradePartnerId`) is the one REVIEWING.
    // So, when `handleAcceptTrade` is called, the `state.currentPlayerIndex` might be the partner.

    const playerA = state.players.find(p => p.id === DOMElements.tradePartnerSelect.options[DOMElements.tradePartnerSelect.selectedIndex].proposerOriginalId || state.currentPlayerIndex); // The one who initiated the trade UI
    const playerB = state.players.find(p => p.id === state.tradePartnerId); // The one who received the proposal and is accepting/rejecting

    if (!playerA || !playerB) {
        logMessage("Error processing trade: players not found.", "error");
        endTrade();
        return;
    }

    logMessage(`${playerB.name} accepted the trade with ${playerA.name}.`, 'success');

    // Money transfer
    playerA.money -= state.tradeOffer.money;
    playerB.money += state.tradeOffer.money;
    playerA.money += state.tradeRequest.money;
    playerB.money -= state.tradeRequest.money;

    // Card transfer
    playerA.getOutOfJailFreeCards -= state.tradeOffer.cards;
    playerB.getOutOfJailFreeCards += state.tradeOffer.cards;
    playerA.getOutOfJailFreeCards += state.tradeRequest.cards;
    playerB.getOutOfJailFreeCards -= state.tradeRequest.cards;

    // Property transfer (Offer from A to B)
    state.tradeOffer.properties.forEach(propId => {
        const prop = board.find(p => p.id === propId);
        prop.owner = playerB.id;
    });
    // Property transfer (Request from B to A)
    state.tradeRequest.properties.forEach(propId => {
        const prop = board.find(p => p.id === propId);
        prop.owner = playerA.id;
    });

    endTrade(); // This also calls updatePlayerInfo, updateBoardUI, setControls
}


export function handleRejectTrade() {
    // const partner = state.players.find(p => p.id === state.tradePartnerId);
    // The current player is the one rejecting
    const rejector = state.players[state.currentPlayerIndex]; // This is not necessarily the partner if proposer is viewing
    const proposerOriginalId = DOMElements.tradePartnerSelect.options[DOMElements.tradePartnerSelect.selectedIndex].proposerOriginalId || state.tradeOffer.originalProposerId; // Hacky, better to store this in state.tradeOffer
    const proposer = state.players.find(p=>p.id === proposerOriginalId);


    logMessage(`Trade proposal between ${proposer ? proposer.name : 'Player'} and ${rejector.name} was rejected.`, 'warning');
    endTrade();
}

export function endTrade() {
    state.isTradeActive = false;
    state.tradePartnerId = null;
    state.tradeOffer = {};
    state.tradeRequest = {};

    document.body.classList.remove('trade-active');
    DOMElements.tradeModalOverlay.style.display = 'none';
    DOMElements.tradeReviewModalOverlay.style.display = 'none';

    updatePlayerInfo();
    updateBoardUI();
    setControls(); // Re-enable general controls
}


// --- Debug Control Logic ---
export function debugMovePlayer() {
    const playerId = parseInt(DOMElements.debugMovePlayerSelect.value);
    const spaceId = parseInt(DOMElements.debugMoveSpaceSelect.value);
    if (isNaN(playerId) || isNaN(spaceId)) { logMessage("Please select a player and a space to move.", "error"); return; }
    const player = state.players.find(p => p.id === playerId);
    if (!player) { logMessage("Player not found.", "error"); return; }
    if (player.inJail && spaceId !== 10) { player.inJail = false; player.jailTurns = 0; logMessage(`DEBUG: ${player.name} moved out of Detention Block.`, 'debug'); }
    player.position = spaceId;
    logMessage(`DEBUG: ${player.name} moved directly to ${board[spaceId].name}.`, 'debug');
    updatePlayerInfo();
    updateBoardUI();
    landOnSpace(player); // Process landing on the new space
}

export function debugSimulateRoll() {
    const die1 = parseInt(DOMElements.debugDie1Input.value);
    const die2 = parseInt(DOMElements.debugDie2Input.value);
    if (isNaN(die1) || isNaN(die2) || die1 < 1 || die1 > 6 || die2 < 1 || die2 > 6) { logMessage("Please enter valid dice values (1-6).", "error"); return; }
    const currentPlayer = state.players[state.currentPlayerIndex];
    currentPlayer.hasRolled = false; // Allow debug roll even if already rolled
    rollDice(die1, die2);
    logMessage(`DEBUG: Simulated roll of ${die1}, ${die2}.`, 'debug');
}

export function debugChangeOwner() {
    const propId = parseInt(DOMElements.debugPropertySelect.value);
    const ownerValue = DOMElements.debugOwnerSelect.value;
    if (isNaN(propId) || !ownerValue) { logMessage("Please select a holding and an owner.", "error"); return; }
    const property = board.find(p => p.id === propId);
    if (!property || !['location', 'hyperspace_lane', 'facility'].includes(property.type)) { logMessage("Selected space is not a tradable holding.", "error"); return; }

    // Remove from old owner's list (if any)
    if (property.owner !== null) {
        const oldOwner = state.players.find(p => p.id === property.owner);
        // oldOwner.properties = oldOwner.properties.filter(p => p !== propId); // Not needed if master list is board
        if (property.type === 'location' && property.houses > 0) { // Refund houses if changing owner
            // oldOwner.money += property.houses * (property.houseCost / 2);
            // logMessage(`DEBUG: ${oldOwner.name} refunded for ${property.houses} Dwellings on ${property.name}.`, 'debug');
            property.houses = 0; // Houses are lost when ownership changes this way
        }
        property.mortgaged = false; // Unmortgage it
    }

    if (ownerValue === 'bank') {
        property.owner = null;
        logMessage(`DEBUG: ${property.name} is now unowned (Bank).`, 'debug');
    } else {
        const newOwnerId = parseInt(ownerValue);
        const newOwner = state.players.find(p => p.id === newOwnerId);
        if (newOwner) {
            property.owner = newOwnerId;
            // newOwner.properties.push(propId); // Not needed
            logMessage(`DEBUG: ${property.name} is now owned by ${newOwner.name}.`, 'debug');
        } else {
            logMessage("New owner not found.", "error"); return;
        }
    }
    updatePlayerInfo();
    updateBoardUI();
}

export function debugSetHouses() {
    const propId = parseInt(DOMElements.debugHousePropertySelect.value);
    const houseCount = parseInt(DOMElements.debugHouseCountInput.value);
    if (isNaN(propId) || isNaN(houseCount) || houseCount < 0 || houseCount > 5) { logMessage("Please select a location and a valid Dwelling count (0-5).", "error"); return; }
    const property = board.find(p => p.id === propId);
    if (!property || property.type !== 'location') { logMessage("Selected space is not a buildable location.", "error"); return; }
    if (property.owner === null) { logMessage("Location must be owned to set Dwellings.", "error"); return; }
    property.houses = houseCount;
    logMessage(`DEBUG: Set ${property.name} to ${houseCount} Dwellings/Fortress.`, 'debug');
    updatePlayerInfo();
    updateBoardUI();
}

export function debugSetMoney() {
    const playerId = parseInt(DOMElements.debugMoneyPlayerSelect.value);
    const moneyAmount = parseInt(DOMElements.debugMoneyAmountInput.value);
    if (isNaN(playerId) || isNaN(moneyAmount) || moneyAmount < 0) { logMessage("Please select a player and enter a valid credit amount.", "error"); return; }
    const player = state.players.find(p => p.id === playerId);
    if (!player) { logMessage("Player not found.", "error"); return; }
    player.money = moneyAmount;
    logMessage(`DEBUG: Set ${player.name}'s credits to ₡${moneyAmount}.`, 'debug');
    updatePlayerInfo();
}

export function debugSendToJail() {
    const playerId = parseInt(DOMElements.debugJailPlayerSelect.value);
    if (isNaN(playerId)) { logMessage("Please select a player to send to Detention Block.", "error"); return; }
    const player = state.players.find(p => p.id === playerId);
    if (!player) { logMessage("Player not found.", "error"); return; }
    logMessage(`DEBUG: ${player.name} sent to Detention Block via debug.`, 'debug');
    sendToJail(player); // This will also update UI and set controls
}
