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
            properties: [], // This array can be removed if not used for direct property list. Board is master.
            inJail: false,
            jailTurns: 0,
            doublesRolledThisTurn: 0,
            hasRolled: false,
            getOutOfJailFreeCards: 0
        });
    }

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
    state.doublesCount = 0;


    DOMElements.setupScreen.style.display = 'none';
    DOMElements.gameScreen.style.display = 'block';

    createBoardUI();
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
            DOMElements.rollDiceBtn.disabled = true;
            DOMElements.endTurnBtn.disabled = false;
            return;
        }
    } else {
        player.doublesRolledThisTurn = 0;
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

    if (player.position < oldPosition && !player.inJail) {
        player.money += 200;
        logMessage(`${player.name} passed START and collected ₡200!`);
    }
    updatePlayerInfo();
    updateBoardUI();
    landOnSpace(player);
}

function sendToJail(player) {
    player.position = 10;
    player.inJail = true;
    player.jailTurns = 0;
    player.doublesRolledThisTurn = 0;
    player.hasRolled = true;
    logMessage(`${player.name} is now in the Detention Block!`);
    updatePlayerInfo();
    updateBoardUI();
    state.currentActionPending = 'none';
    setControls();
}

function handleJailRoll(player, die1, die2) {
    if (die1 === die2) {
        logMessage(`${player.name} rolled doubles (${die1}, ${die2}) and got out of the Detention Block!`, 'success');
        player.inJail = false;
        player.jailTurns = 0;
        movePlayer(player, die1 + die2);
        player.doublesRolledThisTurn = 0;
    } else {
        player.jailTurns++;
        logMessage(`${player.name} rolled ${die1}, ${die2}. Still in Detention Block. Turns left in Detention: ${3 - player.jailTurns}.`);
        if (player.jailTurns >= 3) {
            logMessage(`${player.name} must pay or use a card next turn if still in Detention.`, "warning");
        }
        state.currentActionPending = 'none';
        setControls();
    }
}

function landOnSpace(player) {
    const space = board[player.position];
    logMessage(`${player.name} landed on ${space.name}.`);

    state.currentActionPending = 'none';

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
                    return;
                }
            } else if (space.owner !== player.id) {
                const owner = state.players.find(p => p.id === space.owner);
                if (!owner) {
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
        case 'force_card':
            drawCard(player, state.chanceCardsShuffled, 'Force Card');
            return;
        case 'supply_drop':
            drawCard(player, state.communityChestCardsShuffled, 'Supply Drop');
            return;
        case 'send_to_detention':
            sendToJail(player);
            return;
        case 'detention_block':
            logMessage(`${player.name} is just visiting the Detention Block.`, 'info');
            break;
        case 'start':
        case 'smugglers_hideout':
            logMessage(`${player.name} is on ${space.name}. Nothing to do.`, 'info');
            break;
        default:
            logMessage(`Landed on unhandled space type: ${space.type}`, 'warning');
    }
    setControls();
}


function buyProperty(player, space) {
    if (player.money >= space.price && space.owner === null) {
        player.money -= space.price;
        space.owner = player.id;
        logMessage(`${player.name} bought ${space.name} for ₡${space.price}.`, 'success');
        updatePlayerInfo();
        updateBoardUI();
        state.currentActionPending = 'manage';
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
        updatePlayerInfo();
        return true;
    } else {
        logMessage(`${fromPlayer.name} cannot pay ₡${amount}! Attempting to raise funds...`, 'warning');
        handleBankruptcy(fromPlayer, toRecipient, amount);
        return fromPlayer.money >= amount; // This will be true if bankruptcy actions covered the debt
    }
}

function handleBankruptcy(bankruptPlayer, recipient, debtAmount) {
    logMessage(`${bankruptPlayer.name} is trying to cover a debt of ₡${debtAmount}.`);

    const ownedLocations = getPlayerOwnedProperties(bankruptPlayer, 'location', true);
    for (let i = 5; i > 0; i--) {
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

    if (bankruptPlayer.money < debtAmount) {
        const allOwnableProps = getPlayerOwnedProperties(bankruptPlayer, null, true)
            .filter(p => !p.mortgaged)
            .sort((a, b) => (a.price / 2) - (b.price / 2));

        allOwnableProps.forEach(prop => {
            if (bankruptPlayer.money >= debtAmount) return;
            if (!prop.mortgaged) {
                prop.mortgaged = true;
                bankruptPlayer.money += prop.price / 2;
                logMessage(`${bankruptPlayer.name} mortgaged ${prop.name} for ₡${prop.price / 2}. Credits: ₡${bankruptPlayer.money}`);
                updateBoardUI();
                updatePlayerInfo();
            }
        });
    }

    if (bankruptPlayer.money >= debtAmount) {
        logMessage(`${bankruptPlayer.name} managed to raise enough funds!`);
        payMoney(bankruptPlayer, recipient, debtAmount);
        return;
    }

    logMessage(`${bankruptPlayer.name} is bankrupt and out of the game! Assets go to ${recipient === 'bank' ? 'the Bank' : recipient.name}.`, 'error');
    const recipientPlayer = (recipient === 'bank' || recipient === bankruptPlayer) ? null : recipient;

    board.forEach(prop => {
        if (prop.owner === bankruptPlayer.id) {
            if (recipientPlayer) {
                prop.owner = recipientPlayer.id;
                prop.mortgaged = true;
                logMessage(`${prop.name} (mortgaged) transferred to ${recipientPlayer.name}.`);
            } else {
                prop.owner = null;
                prop.mortgaged = false;
                prop.houses = 0;
                logMessage(`${prop.name} returned to the Bank.`);
            }
        }
    });
    if(recipientPlayer && bankruptPlayer.getOutOfJailFreeCards > 0){
        recipientPlayer.getOutOfJailFreeCards += bankruptPlayer.getOutOfJailFreeCards;
        logMessage(`${recipientPlayer.name} receives ${bankruptPlayer.getOutOfJailFreeCards} Get Out of Detention Free card(s).`);
    }

    bankruptPlayer.money = -1; // Mark as bankrupt effectively
    state.players = state.players.filter(p => p.id !== bankruptPlayer.id);

    let refreshPlayerForTurn = false;
    if (state.players.length > 0) {
        if (state.players.every(p => p.id !== state.players[state.currentPlayerIndex]?.id)) {
             state.currentPlayerIndex = state.players.findIndex(p => p.id !== bankruptPlayer.id); // Find first non-bankrupt
             if(state.currentPlayerIndex === -1 && state.players.length > 0) state.currentPlayerIndex = 0; // Fallback
             refreshPlayerForTurn = true;
        }
    }


    updatePlayerInfo();
    updateBoardUI();
    checkWinCondition(); // This will set state.gameOver if applicable

    if (refreshPlayerForTurn && !state.gameOver && state.players[state.currentPlayerIndex]) {
        logMessage(`Advancing to ${state.players[state.currentPlayerIndex].name}'s turn.`);
        setControlsForTurnStart();
    } else if (!state.gameOver && state.players.length > 0) {
        // If current player is still valid after another player's bankruptcy, ensure their controls are fine
        setControls();
    }
}


function checkWinCondition() {
    const activePlayers = state.players.filter(p => p.money >= 0); // Consider players not yet fully processed as bankrupt
    if (activePlayers.length === 1) {
        state.gameOver = true;
        logMessage(`${activePlayers[0].name} is the last player standing! ${activePlayers[0].name} wins!`, 'success');
        DOMElements.rollDiceBtn.disabled = true;
        DOMElements.endTurnBtn.disabled = true;
        if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display = 'none';
        if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'none';
        if(DOMElements.buyPropertyBtn) DOMElements.buyPropertyBtn.style.display = 'none';

    } else if (activePlayers.length === 0) {
        state.gameOver = true;
        logMessage("All players are bankrupt! No winner.", "error");
        DOMElements.rollDiceBtn.disabled = true;
        DOMElements.endTurnBtn.disabled = true;
    }
}


function drawCard(player, deck, cardType) {
    if (deck.length === 0) {
        logMessage(`No ${cardType} cards left! Reshuffling.`, 'warning');
        if (cardType === 'Force Card') state.chanceCardsShuffled = shuffleArray([...chanceCards]);
        else state.communityChestCardsShuffled = shuffleArray([...communityChestCards]);
        deck = (cardType === 'Force Card') ? state.chanceCardsShuffled : state.communityChestCardsShuffled;
    }

    const cardText = deck.shift();
    deck.push(cardText);

    logMessage(`${player.name} drew a ${cardType}: "${cardText}"`);

    let movedByCard = false;
    let oldPosition = player.position;
    let landOnNewSpace = true;

    switch (cardText) {
        case "Advance to START (Collect ₡200)":
            player.position = 0;
            player.money += 200;
            logMessage(`${player.name} advanced to START and collected ₡200.`);
            movedByCard = true;
            landOnNewSpace = false;
            break;
        case "Advance to Starkiller Base. If you pass START, collect ₡200.":
            if (player.position > 24) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`);}
            player.position = 24;
            logMessage(`${player.name} advanced to Starkiller Base.`);
            movedByCard = true;
            break;
        case "Advance to Cloud City. If you pass START, collect ₡200.":
            if (player.position > 11) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`);}
            player.position = 11;
            logMessage(`${player.name} advanced to Cloud City.`);
            movedByCard = true;
            break;
        case "Advance to nearest Facility. If unowned, you may buy it from the Bank. If owned, pay owner 10 times amount shown on dice.":
            const nearestFacility = findNextSpaceType(oldPosition, 'facility');
            if (nearestFacility) {
                let passedGo = (oldPosition > nearestFacility.id && nearestFacility.id !==0) || (oldPosition < nearestFacility.id && player.position > nearestFacility.id /* full loop check might be complex*/);
                // Simplified: if new position is numerically smaller than old, assume passed go unless going to jail.
                if (nearestFacility.id < oldPosition && nearestFacility.id !== 0) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`); }

                player.position = nearestFacility.id;
                logMessage(`${player.name} advanced to nearest Facility: ${nearestFacility.name}.`);
                movedByCard = true;
            }
            break;
        case "Advance to nearest Hyperspace Lane. If unowned, you may buy it from the Bank. If owned, pay owner twice the rental to which he/she is otherwise entitled.":
            const nearestLane = findNextSpaceType(oldPosition, 'hyperspace_lane');
            if (nearestLane) {
                 if (nearestLane.id < oldPosition && nearestLane.id !== 0) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`); }
                player.position = nearestLane.id;
                logMessage(`${player.name} advanced to nearest Hyperspace Lane: ${nearestLane.name}.`);
                if (nearestLane.owner !== null && nearestLane.owner !== player.id && !nearestLane.mortgaged) {
                    const owner = state.players.find(p=>p.id === nearestLane.owner);
                    const rent = calculateHyperspaceLaneRent(owner, nearestLane) * 2;
                    logMessage(`${player.name} pays ${owner.name} double rent of ₡${rent} for ${nearestLane.name}.`);
                    payMoney(player, owner, rent);
                    landOnNewSpace = false;
                } else {
                    movedByCard = true;
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
            landOnNewSpace = false;
            break;
        case "Make general repairs on all your holdings. For each Dwelling pay ₡25. For each Fortress pay ₡100.":
            let repairCost = 0;
            board.forEach(prop => {
                if (prop.owner === player.id && prop.type === 'location') {
                    if (prop.houses === 5) repairCost += 100;
                    else repairCost += prop.houses * 25;
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
        case "Take a trip to Hyperspace Lane 1. If you pass START, collect ₡200.":
            if (player.position > 5) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`);}
            player.position = 5;
            logMessage(`${player.name} took a trip to Hyperspace Lane 1.`);
            movedByCard = true;
            break;
        case "Advance to Death Star Throne Room.":
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
                    if (p.money >= 10) {
                        p.money -=10;
                        player.money +=10;
                        logMessage(`${p.name} paid ₡10 to ${player.name}.`);
                    } else {
                        payMoney(p, player, 10);
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
                    if (prop.houses === 5) repairCostCC += 115;
                    else repairCostCC += prop.houses * 40;
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
            landOnNewSpace = false;
    }

    updatePlayerInfo();
    updateBoardUI();

    if (movedByCard && landOnNewSpace && !player.inJail) {
        landOnSpace(player);
    } else {
        state.currentActionPending = 'none';
        setControls();
    }
}


function showBuyPropertyAction(player, space) {
    DOMElements.propertyActionsDiv.style.display = 'flex';
    DOMElements.buyPropertyBtn.style.display = 'inline-block';
    DOMElements.buyPropertyBtn.onclick = () => {
        buyProperty(player, space);
        DOMElements.buyPropertyBtn.style.display = 'none';
        state.currentActionPending = 'manage';
        showPropertyManagementActions(player);
        setControls();
    };

    DOMElements.buildHouseBtn.style.display = 'none';
    DOMElements.sellHouseBtn.style.display = 'none';
    DOMElements.sellHouseSelect.style.display = 'none';
    DOMElements.mortgageSelect.style.display = 'none';
    DOMElements.mortgagePropertyBtn.style.display = 'none';
    DOMElements.unmortgageSelect.style.display = 'none';
    DOMElements.unmortgagePropertyBtn.style.display = 'none';
}

function showPropertyManagementActions(player) {
    DOMElements.buyPropertyBtn.style.display = 'none';

    const buildableProperties = getPlayerOwnedProperties(player, 'location')
        .filter(prop => !prop.mortgaged && prop.houses < 5 && player.money >= prop.houseCost && checkMonopoly(player, prop.colorGroup));
    let actuallyBuildable = [];
    if (buildableProperties.length > 0) {
        const groups = {};
        buildableProperties.forEach(p => {
            if (!groups[p.colorGroup]) groups[p.colorGroup] = [];
            groups[p.colorGroup].push(p);
        });
        for (const color in groups) {
            const groupProps = groups[color];
            const minHousesInGroup = Math.min(...groupProps.map(p => p.houses));
            groupProps.forEach(p => {
                if (p.houses === minHousesInGroup) actuallyBuildable.push(p);
            });
        }
    }
    actuallyBuildable.sort((a,b) => a.houses - b.houses || a.id - b.id);

    DOMElements.buildHouseBtn.style.display = actuallyBuildable.length > 0 ? 'inline-block' : 'none';
    DOMElements.buildHouseBtn.onclick = actuallyBuildable.length > 0 ? () => showBuildHouseDialog(player, actuallyBuildable) : null;

    const mortgagableProperties = getPlayerOwnedProperties(player, null, true)
        .filter(prop => {
            if (prop.mortgaged) return false; // Can't mortgage already mortgaged
            if (prop.type === 'location') {
                // Check if any property in its color group has houses
                const groupHasHouses = getPropertiesByColor(prop.colorGroup)
                                        .some(p => p.owner === player.id && p.houses > 0);
                return !groupHasHouses; // Can mortgage if no houses in entire group
            }
            return true; // Hyperspace Lanes and Facilities can be mortgaged if unmortgaged
        });


    populateSelect(DOMElements.mortgageSelect, mortgagableProperties, 'Mortgage Holding');
    DOMElements.mortgageSelect.style.display = mortgagableProperties.length > 0 ? 'block' : 'none';
    DOMElements.mortgagePropertyBtn.style.display = mortgagableProperties.length > 0 ? 'inline-block' : 'none';
    DOMElements.mortgagePropertyBtn.disabled = true;

    const unmortgagableProperties = getPlayerOwnedProperties(player, null, true)
        .filter(prop => prop.mortgaged && player.money >= Math.ceil(prop.price / 2 * 1.1));
    populateSelect(DOMElements.unmortgageSelect, unmortgagableProperties, 'Unmortgage Holding');
    DOMElements.unmortgageSelect.style.display = unmortgagableProperties.length > 0 ? 'block' : 'none';
    DOMElements.unmortgagePropertyBtn.style.display = unmortgagableProperties.length > 0 ? 'inline-block' : 'none';
    DOMElements.unmortgagePropertyBtn.disabled = true;

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
                if (p.houses === maxHousesInGroup) actuallySellable.push(p);
            });
        }
    }
    actuallySellable.sort((a,b) => b.houses - a.houses || a.id - b.id);

    populateSelect(DOMElements.sellHouseSelect, actuallySellable, 'Sell Dwelling');
    DOMElements.sellHouseSelect.style.display = actuallySellable.length > 0 ? 'block' : 'none';
    DOMElements.sellHouseBtn.style.display = actuallySellable.length > 0 ? 'inline-block' : 'none';
    DOMElements.sellHouseBtn.disabled = true;

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
    const buttonToToggle = {
        [DOMElements.mortgageSelect.id]: DOMElements.mortgagePropertyBtn,
        [DOMElements.unmortgageSelect.id]: DOMElements.unmortgagePropertyBtn,
        [DOMElements.sellHouseSelect.id]: DOMElements.sellHouseBtn
    }[selectElement.id];

    if (buttonToToggle) {
        buttonToToggle.disabled = true;
        selectElement.onchange = () => {
            buttonToToggle.disabled = !selectElement.value;
        };
    }
}


function showBuildHouseDialog(player, availableProperties) {
    const existingDialog = DOMElements.propertyActionsDiv.querySelector('.build-house-dialog');
    if (existingDialog) existingDialog.remove();

    const selectDiv = document.createElement('div');
    selectDiv.className = 'build-house-dialog';
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
    if (availableProperties.length > 0) buildSelect.value = availableProperties[0].id;
    confirmBtn.disabled = availableProperties.length === 0;

    DOMElements.propertyActionsDiv.appendChild(selectDiv);
    DOMElements.buildHouseBtn.style.display = 'none';

    confirmBtn.onclick = () => {
        const propId = parseInt(buildSelect.value);
        const prop = board.find(p => p.id === propId);

        if (!prop || prop.owner !== player.id || player.money < prop.houseCost || prop.houses >= 5 || prop.mortgaged) {
            logMessage("Cannot build Dwelling here (insufficient funds, maxed out, mortgaged, or not owned).", "error");
            return;
        }
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
        selectDiv.remove();
        showPropertyManagementActions(player);
        setControls();
    };
    cancelBtn.onclick = () => {
        selectDiv.remove();
        DOMElements.buildHouseBtn.style.display = 'inline-block';
        showPropertyManagementActions(player);
    };
}

export function mortgageProperty(propId) {
    const player = state.players[state.currentPlayerIndex];
    const prop = board.find(p => p.id === propId);

    if (!prop || prop.owner !== player.id || prop.mortgaged) {
        logMessage(`Cannot mortgage ${prop ? prop.name : 'selected holding'}. Not owned or already mortgaged.`, 'error');
        showPropertyManagementActions(player);
        setControls();
        return;
    }
    // Check for houses on any property in the same color group IF it's a location
    if (prop.type === 'location') {
        const groupHasHouses = getPropertiesByColor(prop.colorGroup)
                                .some(p => p.owner === player.id && p.houses > 0);
        if (groupHasHouses) {
            logMessage(`Cannot mortgage ${prop.name}. Sell all Dwellings in the ${prop.colorGroup} sector first.`, 'error');
            showPropertyManagementActions(player);
            setControls();
            return;
        }
    }
    // If it's a location, it must have 0 houses (already implicitly checked by groupHasHouses for locations)
    // For other types (hyperspace_lane, facility), houses check is not applicable.

    prop.mortgaged = true;
    player.money += prop.price / 2;
    logMessage(`${player.name} mortgaged ${prop.name} for ₡${prop.price / 2}.`, 'info');
    updatePlayerInfo();
    updateBoardUI();
    showPropertyManagementActions(player);
    setControls();
}

export function unmortgageProperty(propId) {
    const player = state.players[state.currentPlayerIndex];
    const prop = board.find(p => p.id === propId);
    if (!prop) { logMessage("Holding not found.", "error"); return; }

    const unmortgageCost = Math.ceil(prop.price / 2 * 1.1);
    if (prop.owner === player.id && prop.mortgaged && player.money >= unmortgageCost) {
        prop.mortgaged = false;
        player.money -= unmortgageCost;
        logMessage(`${player.name} unmortgaged ${prop.name} for ₡${unmortgageCost}.`, 'info');
        updatePlayerInfo();
        updateBoardUI();
    } else {
        logMessage(`Cannot unmortgage ${prop.name}. Insufficient credits or not mortgaged by you.`, 'error');
    }
    showPropertyManagementActions(player);
    setControls();
}

export function sellHouse(propId) {
    const player = state.players[state.currentPlayerIndex];
    const prop = board.find(p => p.id === propId);

    if (!prop || prop.type !== 'location' || prop.owner !== player.id || prop.houses === 0) {
        logMessage(`Cannot sell Dwelling on ${prop ? prop.name : 'selected holding'}. No Dwellings or not owned.`, 'error');
        showPropertyManagementActions(player);
        setControls();
        return;
    }

    const groupProperties = getPropertiesByColor(prop.colorGroup).filter(p => p.owner === player.id);
    const maxHousesInGroup = Math.max(...groupProperties.map(p => p.houses));

    if (prop.houses < maxHousesInGroup && checkMonopoly(player, prop.colorGroup)) {
        logMessage(`Must sell evenly. Sell from holdings with more Dwellings in the ${prop.colorGroup} sector first.`, "error");
        showPropertyManagementActions(player);
        setControls();
        return;
    }

    prop.houses--;
    player.money += prop.houseCost / 2;
    logMessage(`${player.name} sold a ${prop.houses === 4 ? 'Fortress (now 4 Dwellings)' : 'Dwelling'} on ${prop.name} for ₡${prop.houseCost / 2}. Dwellings left: ${prop.houses}.`, 'info');
    updatePlayerInfo();
    updateBoardUI();
    showPropertyManagementActions(player);
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
        setControlsForTurnStart();
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
        setControlsForTurnStart();
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
    if (!player) return;

    DOMElements.rollDiceBtn.disabled = true;
    DOMElements.endTurnBtn.disabled = true;
    DOMElements.proposeTradeBtn.disabled = true;
    if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display = 'none'; // Hide by default
    if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'none';
    if(DOMElements.buyPropertyBtn) DOMElements.buyPropertyBtn.style.display = 'none';


    if (player.inJail) {
        if (player.hasRolled) {
            DOMElements.endTurnBtn.disabled = false;
             if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'flex';
             if(DOMElements.payBailBtn) DOMElements.payBailBtn.disabled = player.money < 50;
             if(DOMElements.useJailCardBtn) DOMElements.useJailCardBtn.disabled = player.getOutOfJailFreeCards === 0;

        } else {
            DOMElements.rollDiceBtn.disabled = false;
            if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'flex';
            if(DOMElements.payBailBtn) DOMElements.payBailBtn.disabled = player.money < 50;
            if(DOMElements.useJailCardBtn) DOMElements.useJailCardBtn.disabled = player.getOutOfJailFreeCards === 0;

            if (player.jailTurns >= 3) {
                logMessage(`${player.name} must pay or use a card.`, "warning");
                DOMElements.rollDiceBtn.disabled = true;
                if (DOMElements.payBailBtn.disabled && DOMElements.useJailCardBtn.disabled) {
                    handleBankruptcy(player, 'bank', 50);
                } else {
                    // If they can pay or use card, they still need to click the button, don't auto end turn
                }
            }
        }
    } else { // Not in jail
        if (!player.hasRolled) {
            DOMElements.rollDiceBtn.disabled = false;
            DOMElements.proposeTradeBtn.disabled = false;
            showPropertyManagementActions(player);
        } else {
            if (player.doublesRolledThisTurn > 0 && player.doublesRolledThisTurn < 3 && player.position !== 10 /* not just sent to jail by 3rd double */) {
                DOMElements.rollDiceBtn.disabled = false;
                DOMElements.proposeTradeBtn.disabled = false;
                showPropertyManagementActions(player);
            } else {
                DOMElements.endTurnBtn.disabled = false;
                DOMElements.proposeTradeBtn.disabled = false;
                 if (state.currentActionPending === 'buy') {
                    showBuyPropertyAction(player, board[player.position]);
                } else {
                    showPropertyManagementActions(player);
                }
            }
        }
    }

    if (state.isAuctionActive || state.isTradeActive) {
        DOMElements.rollDiceBtn.disabled = true;
        DOMElements.endTurnBtn.disabled = true;
        DOMElements.proposeTradeBtn.disabled = true;
        if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display = 'none';
        if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'none';
    }
}


function setControlsForTurnStart() {
    if (state.gameOver || !state.players.length || !state.players[state.currentPlayerIndex]) {
        if (!state.gameOver && state.players.length > 0) { // Attempt to recover if index is bad
             state.currentPlayerIndex = 0;
             if (!state.players[state.currentPlayerIndex]) {
                checkWinCondition(); // No valid players left
                return;
             }
        } else {
             checkWinCondition();
             return;
        }
    }

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
        DOMElements.endTurnBtn.disabled = true;
        if (player.jailTurns >= 3 && player.money < 50 && player.getOutOfJailFreeCards === 0) {
            handleBankruptcy(player, 'bank', 50); // Force bankruptcy if stuck on 3rd turn
        }

    } else {
        DOMElements.rollDiceBtn.disabled = false;
        DOMElements.endTurnBtn.disabled = true;
        if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'none';
    }
    DOMElements.proposeTradeBtn.disabled = player.inJail;
    showPropertyManagementActions(player);
}


export function endTurn() {
    if (state.isAuctionActive || state.isTradeActive || state.gameOver) return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer) {
        checkWinCondition(); // No current player, game might be over or in error state
        return;
    }


    if (state.currentActionPending === 'buy' && board[currentPlayer.position].owner === null) {
        const spaceToAuction = board[currentPlayer.position];
        logMessage(`${currentPlayer.name} declined to buy ${spaceToAuction.name}. It will be auctioned.`);
        startAuction(spaceToAuction.id);
        return;
    }

    logMessage(`${currentPlayer.name}'s turn ended.`);
    currentPlayer.doublesRolledThisTurn = 0;

    if (state.players.length <= 1) {
        checkWinCondition();
        return;
    }

    let nextPlayerIndex = state.currentPlayerIndex;
    let attempts = 0;
    do {
        nextPlayerIndex = (nextPlayerIndex + 1) % state.players.length;
        attempts++;
        if (attempts > state.players.length * 2) { // Prevent infinite loop
            logMessage("Error finding next player, ending game.", "error");
            state.gameOver = true;
            checkWinCondition(); // Should declare no winner or last one standing
            return;
        }
    } while (state.players[nextPlayerIndex].money < 0 && state.players.length > 1); // Skip fully bankrupt players

    state.currentPlayerIndex = nextPlayerIndex;
    
    logMessage(`It's ${state.players[state.currentPlayerIndex].name}'s turn.`);
    setControlsForTurnStart();
    updatePlayerInfo();
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
    state.auctionBidders = state.players.filter(p => p.money >= 1);
    if(state.auctionBidders.length === 0){
        logMessage("No players eligible for auction. Property remains unowned.", "info");
        endAuction();
        return;
    }
    let initialBidderIndex = state.auctionBidders.findIndex(p=>p.id === state.players[state.currentPlayerIndex].id);
    state.auctionCurrentBidderIndex = initialBidderIndex !== -1 ? initialBidderIndex : 0;

    DOMElements.rollDiceBtn.disabled = true;
    DOMElements.endTurnBtn.disabled = true;
    if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display = 'none';
    if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'none';

    document.body.classList.add('auction-active');
    DOMElements.auctionModalOverlay.style.display = 'flex';
    DOMElements.auctionWithdrawBtn.textContent = "Pass";
    updateAuctionUI();
}

function updateAuctionUI() {
    if (!state.isAuctionActive) return;
    showAuctionMessage('');
    const property = board.find(p => p.id === state.auctionPropertyId);
    if(!property) { endAuction(); return;} // Safety
    DOMElements.auctionPropertyName.textContent = property.name;
    DOMElements.auctionCurrentBid.textContent = `₡${state.currentBid}`;
    const highestBidderObj = state.highestBidderId !== null ? state.players.find(p => p.id === state.highestBidderId) : null;
    DOMElements.auctionHighestBidder.textContent = highestBidderObj ? highestBidderObj.name : 'None';

    if (state.auctionBidders.length === 0 || !state.auctionBidders[state.auctionCurrentBidderIndex]) {
        endAuction();
        return;
    }
    const currentBidder = state.auctionBidders[state.auctionCurrentBidderIndex];
    DOMElements.auctionCurrentBidder.textContent = currentBidder.name;
    DOMElements.auctionBidAmountInput.value = state.currentBid + 1;
    DOMElements.auctionBidAmountInput.min = state.currentBid + 1;
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
        DOMElements.auctionBidAmountInput.value = bidder.money;
        return;
    }

    state.currentBid = bidAmount;
    state.highestBidderId = bidder.id;
    logMessage(`${bidder.name} bids ₡${state.currentBid} for ${board.find(p=>p.id === state.auctionPropertyId).name}.`, 'info');
    nextBidder();
}

export function handlePass() {
    if (!state.isAuctionActive || state.auctionBidders.length === 0) return;
    const currentPassingBidder = state.auctionBidders[state.auctionCurrentBidderIndex];
    logMessage(`${currentPassingBidder.name} passes.`, 'info');

    state.auctionBidders.splice(state.auctionCurrentBidderIndex, 1);

    if (state.auctionBidders.length === 0) {
        endAuction();
    } else if (state.auctionBidders.length === 1 && state.highestBidderId !== null) {
        if(state.auctionBidders[0].id === state.highestBidderId) { // Last bidder is already highest
            endAuction();
        } else { // Last bidder gets a chance to bid or highest bidder wins
             state.auctionCurrentBidderIndex = 0; // Only one left
             updateAuctionUI(); // Let them make a final bid or pass
        }
    } else {
        state.auctionCurrentBidderIndex = state.auctionCurrentBidderIndex % state.auctionBidders.length;
        updateAuctionUI();
    }
}


function nextBidder() {
    if (!state.isAuctionActive || state.auctionBidders.length === 0) {
        endAuction();
        return;
    }
    // If only one bidder remains and they are the highest bidder, they win.
    if (state.auctionBidders.length === 1 && state.highestBidderId !== null && state.auctionBidders[0].id === state.highestBidderId) {
        endAuction();
        return;
    }
     // If highestBidderId is set, and the next designated bidder is the highestBidderId (meaning everyone else passed)
    if (state.highestBidderId !== null && state.auctionBidders[(state.auctionCurrentBidderIndex + 1) % state.auctionBidders.length].id === state.highestBidderId) {
        endAuction();
        return;
    }


    state.auctionCurrentBidderIndex = (state.auctionCurrentBidderIndex + 1) % state.auctionBidders.length;
    updateAuctionUI();
}


function endAuction() {
    const property = board.find(p => p.id === state.auctionPropertyId);
    if (state.highestBidderId !== null) {
        const winner = state.players.find(p => p.id === state.highestBidderId);
        if (winner && winner.money >= state.currentBid) { // Final check winner can afford
            logMessage(`${winner.name} wins the auction for ${property.name} with a bid of ₡${state.currentBid}!`, 'success');
            winner.money -= state.currentBid;
            property.owner = winner.id;
        } else {
             logMessage(`Auction for ${property.name} ended. Highest bidder ${winner? winner.name: 'unknown'} could not afford. Property remains unowned.`, 'info');
             property.owner = null; // Ensure it's unowned
        }
    } else {
        logMessage(`No valid bids were placed for ${property.name}. It remains unowned.`, 'info');
        property.owner = null; // Ensure it's unowned
    }

    state.isAuctionActive = false;
    state.auctionPropertyId = null;
    state.auctionBidders = [];
    document.body.classList.remove('auction-active');
    DOMElements.auctionModalOverlay.style.display = 'none';

    state.currentActionPending = 'manage'; // Or 'none' if they can't manage after auction
    // Determine who's turn it is after auction - usually the player whose turn it was.
    // If auction happened because player couldn't afford, their turn might effectively be over.
    // For now, restore controls for the player who initiated the turn.
    // This might need refinement based on when auction is triggered.
    setControls();
    updatePlayerInfo();
    updateBoardUI();
}

// --- Trade Logic ---
function showTradeMessage(message) {
    DOMElements.tradeMessageArea.textContent = message;
}

export function showTradeModal() {
    if (state.isAuctionActive || state.gameOver) return;
    const proposer = state.players[state.currentPlayerIndex];
    state.isTradeActive = true;
    state.tradeOffer.originalProposerId = proposer.id; // Store who opened the trade modal
    showTradeMessage('');

    DOMElements.rollDiceBtn.disabled = true;
    DOMElements.endTurnBtn.disabled = true;

    DOMElements.tradeOfferMoney.value = 0;
    DOMElements.tradeRequestMoney.value = 0;
    DOMElements.tradeOfferCards.value = 0;
    DOMElements.tradeRequestCards.value = 0;

    DOMElements.tradePartnerSelect.innerHTML = '<option value="">-- Select Player --</option>';
    state.players.forEach((player) => {
        if (player.id !== proposer.id) {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.name;
            DOMElements.tradePartnerSelect.appendChild(option);
        }
    });
    DOMElements.tradePartnerSelect.value = "";

    updateTradeModalAssets();
    document.body.classList.add('trade-active');
    DOMElements.tradeModalOverlay.style.display = 'flex';
}

export function updateTradeModalAssets() {
    const proposer = state.players.find(p => p.id === state.tradeOffer.originalProposerId || p.id === state.currentPlayerIndex); // Get the actual proposer
    const partnerId = parseInt(DOMElements.tradePartnerSelect.value);
    const partner = state.players.find(p => p.id === partnerId);

    DOMElements.tradeOfferProperties.innerHTML = '';
    getPlayerOwnedProperties(proposer, null, true)
        .filter(p => p.type !== 'location' || p.houses === 0)
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
            .forEach(propObj => { // propId was actually the object from getPlayerOwnedProperties
                const prop = board.find(p => p.id === propObj.id);
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
    const proposer = state.players.find(p => p.id === state.tradeOffer.originalProposerId); // The one who INITIATED the trade screen
    state.tradePartnerId = parseInt(DOMElements.tradePartnerSelect.value); // This IS the partner

    if (isNaN(state.tradePartnerId)) {
        showTradeMessage("Please select a player to trade with.");
        return;
    }
    const partner = state.players.find(p => p.id === state.tradePartnerId);
    if (!partner) {
        showTradeMessage("Selected trade partner not found.");
        return;
    }

    state.tradeOffer.money = parseInt(DOMElements.tradeOfferMoney.value) || 0;
    state.tradeOffer.properties = Array.from(DOMElements.tradeOfferProperties.selectedOptions).map(opt => parseInt(opt.value));
    state.tradeOffer.cards = parseInt(DOMElements.tradeOfferCards.value) || 0;

    state.tradeRequest.money = parseInt(DOMElements.tradeRequestMoney.value) || 0;
    state.tradeRequest.properties = Array.from(DOMElements.tradeRequestProperties.selectedOptions).map(opt => parseInt(opt.value));
    state.tradeRequest.cards = parseInt(DOMElements.tradeRequestCards.value) || 0;

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

    // Store whose turn it is for the review modal, it's the partner
    state.tradeOffer.reviewingPlayerId = partner.id;
    showTradeReviewModal();
}

function showTradeReviewModal() {
    // Proposer is who INITIATED the trade setup
    const proposer = state.players.find(p => p.id === state.tradeOffer.originalProposerId);
    // Partner is who the trade is WITH (and who is now reviewing)
    const partner = state.players.find(p => p.id === state.tradePartnerId);

    DOMElements.reviewProposerName.textContent = proposer.name; // They (proposer) offer
    DOMElements.reviewPartnerName.textContent = partner.name;   // You (partner) offer

    // "They Offer" is what the PROPOSER (playerA) offers to the PARTNER (playerB)
    DOMElements.reviewOfferMoney.textContent = `₡${state.tradeOffer.money}`;
    DOMElements.reviewOfferCards.textContent = state.tradeOffer.cards;
    DOMElements.reviewOfferProperties.innerHTML = state.tradeOffer.properties.map(id => `<li>${board.find(p=>p.id===id).name}</li>`).join('') || '<li>None</li>';

    // "You Offer" is what the PARTNER (playerB) offers to the PROPOSER (playerA)
    DOMElements.reviewRequestMoney.textContent = `₡${state.tradeRequest.money}`;
    DOMElements.reviewRequestCards.textContent = state.tradeRequest.cards;
    DOMElements.reviewRequestProperties.innerHTML = state.tradeRequest.properties.map(id => `<li>${board.find(p=>p.id===id).name}</li>`).join('') || '<li>None</li>';


    DOMElements.tradeModalOverlay.style.display = 'none';
    DOMElements.tradeReviewModalOverlay.style.display = 'flex';
}

export function handleAcceptTrade() {
    // The player who INITIATED the trade setup
    const playerA_proposer = state.players.find(p => p.id === state.tradeOffer.originalProposerId);
    // The player who RECEIVED and is ACCEPTING the trade
    const playerB_partner = state.players.find(p => p.id === state.tradePartnerId);

    if (!playerA_proposer || !playerB_partner) {
        logMessage("Error processing trade: players not found.", "error");
        endTrade();
        return;
    }

    logMessage(`${playerB_partner.name} accepted the trade with ${playerA_proposer.name}.`, 'success');

    // Player A (proposer) gives offer, receives request
    playerA_proposer.money = playerA_proposer.money - state.tradeOffer.money + state.tradeRequest.money;
    playerA_proposer.getOutOfJailFreeCards = playerA_proposer.getOutOfJailFreeCards - state.tradeOffer.cards + state.tradeRequest.cards;

    // Player B (partner) receives offer, gives request
    playerB_partner.money = playerB_partner.money + state.tradeOffer.money - state.tradeRequest.money;
    playerB_partner.getOutOfJailFreeCards = playerB_partner.getOutOfJailFreeCards + state.tradeOffer.cards - state.tradeRequest.cards;

    // Transfer properties from A's offer to B
    state.tradeOffer.properties.forEach(propId => {
        const prop = board.find(p => p.id === propId);
        prop.owner = playerB_partner.id;
    });
    // Transfer properties from B's request to A
    state.tradeRequest.properties.forEach(propId => {
        const prop = board.find(p => p.id === propId);
        prop.owner = playerA_proposer.id;
    });

    endTrade();
}


export function handleRejectTrade() {
    const proposer = state.players.find(p => p.id === state.tradeOffer.originalProposerId);
    const partner = state.players.find(p => p.id === state.tradePartnerId); // Person who would have received the proposal
    // The current player (who clicked reject) is 'partner'

    logMessage(`Trade proposal from ${proposer.name} to ${partner.name} was rejected by ${partner.name}.`, 'warning');
    endTrade();
}

export function endTrade() {
    state.isTradeActive = false;
    state.tradePartnerId = null;
    state.tradeOffer = {}; // Clear trade details
    state.tradeRequest = {};

    document.body.classList.remove('trade-active');
    DOMElements.tradeModalOverlay.style.display = 'none';
    DOMElements.tradeReviewModalOverlay.style.display = 'none';

    updatePlayerInfo();
    updateBoardUI();
    setControls();
}


// --- Debug Control Logic ---
export function debugMovePlayer() {
    const playerId = parseInt(DOMElements.debugMovePlayerSelect.value);
    const spaceId = parseInt(DOMElements.debugMoveSpaceSelect.value);
    if (isNaN(playerId) || isNaN(spaceId)) { logMessage("Please select a player and a space to move.", "error"); return; }
    const player = state.players.find(p => p.id === playerId);
    if (!player) { logMessage("Player not found.", "error"); return; }
    if (player.inJail && spaceId !== 10) { player.inJail = false; player.jailTurns = 0; logMessage(`DEBUG: ${player.name} moved out of Detention Block.`, 'debug'); }
    const oldPosition = player.position;
    player.position = spaceId;
    player.hasRolled = true; // Simulate that a roll/move occurred for turn logic purposes
    player.doublesRolledThisTurn = 0; // Reset doubles

    logMessage(`DEBUG: ${player.name} moved directly from ${board[oldPosition].name} to ${board[spaceId].name}.`, 'debug');
    updatePlayerInfo();
    updateBoardUI();
    landOnSpace(player);
}

export function debugSimulateRoll() {
    const die1 = parseInt(DOMElements.debugDie1Input.value);
    const die2 = parseInt(DOMElements.debugDie2Input.value);
    if (isNaN(die1) || isNaN(die2) || die1 < 1 || die1 > 6 || die2 < 1 || die2 > 6) { logMessage("Please enter valid dice values (1-6).", "error"); return; }
    const currentPlayer = state.players[state.currentPlayerIndex];
    currentPlayer.hasRolled = false;
    rollDice(die1, die2);
    logMessage(`DEBUG: Simulated roll of ${die1}, ${die2}.`, 'debug');
}

export function debugChangeOwner() {
    const propId = parseInt(DOMElements.debugPropertySelect.value);
    const ownerValue = DOMElements.debugOwnerSelect.value;
    if (isNaN(propId) || !ownerValue) { logMessage("Please select a holding and an owner.", "error"); return; }
    const property = board.find(p => p.id === propId);
    if (!property || !['location', 'hyperspace_lane', 'facility'].includes(property.type)) { logMessage("Selected space is not a tradable holding.", "error"); return; }

    if (property.owner !== null) {
        // const oldOwner = state.players.find(p => p.id === property.owner);
        if (property.type === 'location' && property.houses > 0) {
            property.houses = 0;
        }
        property.mortgaged = false;
    }

    if (ownerValue === 'bank') {
        property.owner = null;
        logMessage(`DEBUG: ${property.name} is now unowned (Bank).`, 'debug');
    } else {
        const newOwnerId = parseInt(ownerValue);
        const newOwner = state.players.find(p => p.id === newOwnerId);
        if (newOwner) {
            property.owner = newOwnerId;
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
    sendToJail(player);
}