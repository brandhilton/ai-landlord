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
    return propertiesInGroup.every(prop => prop.owner === player.id);
}

function getPlayerOwnedProperties(player, type = null) {
    return board.filter(space => space.owner === player.id && (type ? ['location', 'hyperspace_lane', 'facility'].includes(space.type) : true));
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

    state.chanceCardsShuffled = shuffleArray([...chanceCards]);
    state.communityChestCardsShuffled = shuffleArray([...communityChestCards]);

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
    if (state.isAuctionActive || state.isTradeActive) return;
    const die1 = simulatedDie1 !== null ? simulatedDie1 : Math.floor(Math.random() * 6) + 1;
    const die2 = simulatedDie2 !== null ? simulatedDie2 : Math.floor(Math.random() * 6) + 1;
    
    state.diceRoll = [die1, die2];
    DOMElements.diceDisplay.textContent = `Dice: ${die1}, ${die2}`;
    logMessage(`${state.players[state.currentPlayerIndex].name} rolled a ${die1} and a ${die2} (total ${die1 + die2}).`);

    const player = state.players[state.currentPlayerIndex];
    player.hasRolled = true;

    if (die1 === die2) {
        player.doublesRolledThisTurn++;
        logMessage(`${player.name} rolled doubles!`, 'warning');
        if (player.doublesRolledThisTurn === 3) {
            logMessage(`${player.name} rolled 3 consecutive doubles! Go directly to Detention Block!`, 'error');
            sendToJail(player);
            player.doublesRolledThisTurn = 0;
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
    } else {
        player.jailTurns++;
        logMessage(`${player.name} rolled ${die1}, ${die2}. Still in Detention Block. Turns left: ${3 - player.jailTurns}.`);

        if (player.jailTurns === 3 && player.money < 50 && player.getOutOfJailFreeCards === 0) {
            logMessage(`${player.name} cannot pay bail or use a card and is bankrupt!`, 'error');
            handleBankruptcy(player, 'bank', 50);
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
                const owner = state.players[space.owner];
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
                        const ownedLanes = getPlayerOwnedProperties(owner, 'hyperspace_lane').filter(r => !r.mortgaged).length;
                        rent = space.rent[ownedLanes - 1];
                    } else if (space.type === 'facility') {
                        const ownedFacilities = getPlayerOwnedProperties(owner, 'facility').filter(u => !u.mortgaged).length;
                        if (ownedFacilities === 1) {
                            rent = (state.diceRoll[0] + state.diceRoll[1]) * 4;
                        } else if (ownedFacilities === 2) {
                            rent = (state.diceRoll[0] + state.diceRoll[1]) * 10;
                        }
                    }
                    logMessage(`${space.name} is owned by ${owner.name}. Rent: ₡${rent}.`);
                    payMoney(player, owner, rent);
                }
                state.currentActionPending = 'none';
            } else {
                logMessage(`${player.name} owns ${space.name}.`);
                state.currentActionPending = 'manage';
            }
            break;
        case 'tax':
            logMessage(`${player.name} landed on ${space.name} and must pay ₡${space.amount}.`);
            payMoney(player, 'bank', space.amount);
            state.currentActionPending = 'none';
            break;
        case 'force_card':
            drawCard(player, state.chanceCardsShuffled);
            break;
        case 'supply_drop':
            drawCard(player, state.communityChestCardsShuffled);
            break;
        case 'send_to_detention':
            sendToJail(player);
            break;
        case 'detention_block':
            logMessage(`${player.name} is just visiting the Detention Block.`, 'info');
            state.currentActionPending = 'none';
            break;
        case 'start':
        case 'smugglers_hideout':
            logMessage(`${player.name} is on ${space.name}. Nothing to do.`, 'info');
            state.currentActionPending = 'none';
            break;
    }
    setControls();
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
    state.currentActionPending = 'none';
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
        logMessage(`${fromPlayer.name} cannot pay ₡${amount}! Declaring bankruptcy...`, 'error');
        handleBankruptcy(fromPlayer, toRecipient, amount);
    }
    updatePlayerInfo();
}

function handleBankruptcy(bankruptPlayer, recipient, debtAmount) {
    logMessage(`${bankruptPlayer.name} has gone bankrupt!`);
    bankruptPlayer.properties.sort((a,b) => board[a].price - board[b].price);

    while (bankruptPlayer.money < debtAmount && bankruptPlayer.properties.length > 0) {
        const propId = bankruptPlayer.properties[0];
        const prop = board[propId];

        while(prop.houses > 0) {
            prop.houses--;
            bankruptPlayer.money += prop.houseCost / 2;
            logMessage(`${bankruptPlayer.name} sold a Dwelling on ${prop.name} for ₡${prop.houseCost / 2}.`);
            updatePlayerInfo();
            updateBoardUI();
        }

        if (!prop.mortgaged) {
            prop.mortgaged = true;
            bankruptPlayer.money += prop.price / 2;
            logMessage(`${bankruptPlayer.name} mortgaged ${prop.name} for ₡${prop.price / 2}.`);
            updatePlayerInfo();
            updateBoardUI();
        } else {
            break;
        }
    }

    if (bankruptPlayer.money < debtAmount) {
        logMessage(`${bankruptPlayer.name} cannot cover the debt and is out of the game!`, 'error');
        if (recipient !== 'bank' && recipient.id !== bankruptPlayer.id) {
            bankruptPlayer.properties.forEach(propId => {
                const prop = board[propId];
                prop.owner = recipient.id;
                recipient.properties.push(propId);
                prop.mortgaged = true;
                prop.houses = 0;
                logMessage(`${prop.name} transferred to ${recipient.name} (mortgaged).`);
            });
        } else {
            bankruptPlayer.properties.forEach(propId => {
                const prop = board[propId];
                prop.owner = null;
                prop.houses = 0;
                prop.mortgaged = false;
                logMessage(`${prop.name} returned to the bank.`);
            });
        }
        state.players = state.players.filter(p => p.id !== bankruptPlayer.id);
        if (state.currentPlayerIndex >= state.players.length) {
            state.currentPlayerIndex = 0;
        }
        updatePlayerInfo();
        updateBoardUI();
        checkWinCondition();
    } else {
        logMessage(`${bankruptPlayer.name} managed to pay the debt after selling assets.`);
        payMoney(bankruptPlayer, recipient, debtAmount);
    }
}

function checkWinCondition() {
    if (state.players.length === 1) {
        state.gameOver = true;
        logMessage(`${state.players[0].name} is the last player standing! ${state.players[0].name} wins!`, 'success');
        DOMElements.rollDiceBtn.disabled = true;
        DOMElements.endTurnBtn.disabled = true;
        DOMElements.propertyActionsDiv.style.display = 'none';
        DOMElements.jailActionsDiv.style.display = 'none';
    }
}

function drawCard(player, deck) {
    const card = deck.shift();
    deck.push(card);

    logMessage(`${player.name} drew a ${deck === state.chanceCardsShuffled ? 'Force Card' : 'Supply Drop'} : "${card}"`);

    let movedByCard = false;
    let oldPosition = player.position;

    switch (card) {
        case "Advance to START (Collect ₡200)":
            player.position = 0;
            player.money += 200;
            logMessage(`${player.name} advanced to START and collected ₡200.`);
            movedByCard = true;
            break;
        case "Advance to Starkiller Base. If you pass START, collect ₡200.":
            player.position = 24;
            if (player.position < oldPosition) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`); }
            logMessage(`${player.name} advanced to Starkiller Base.`);
            movedByCard = true;
            break;
        case "Advance to Cloud City. If you pass START, collect ₡200.":
            player.position = 11;
            if (player.position < oldPosition) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`); }
            logMessage(`${player.name} advanced to Cloud City.`);
            movedByCard = true;
            break;
        case "Advance to nearest Facility. If unowned, you may buy it from the Bank. If owned, pay owner 10 times amount shown on dice.":
            const nearestFacility = findNextSpaceType(oldPosition, 'facility');
            player.position = nearestFacility.id;
            if (player.position < oldPosition) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`); }
            logMessage(`${player.name} advanced to nearest Facility: ${nearestFacility.name}.`);
            if (nearestFacility.owner !== null && nearestFacility.owner !== player.id) {
                const owner = state.players[nearestFacility.owner];
                if (!nearestFacility.mortgaged) {
                    const rent = calculateFacilityRent(owner, state.diceRoll[0] + state.diceRoll[1]);
                    logMessage(`${player.name} pays ${owner.name} ₡${rent} rent for ${nearestFacility.name}.`);
                    payMoney(player, owner, rent);
                    state.currentActionPending = 'none';
                } else {
                    logMessage(`${nearestFacility.name} is mortgaged. No rent due.`);
                    state.currentActionPending = 'none';
                }
            }
            movedByCard = true;
            break;
        case "Advance to nearest Hyperspace Lane. If unowned, you may buy it from the Bank. If owned, pay owner twice the rental to which he/she is otherwise entitled.":
            const nearestHyperspaceLane = findNextSpaceType(oldPosition, 'hyperspace_lane');
            player.position = nearestHyperspaceLane.id;
            if (player.position < oldPosition) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`); }
            logMessage(`${player.name} advanced to nearest Hyperspace Lane: ${nearestHyperspaceLane.name}.`);
            if (nearestHyperspaceLane.owner !== null && nearestHyperspaceLane.owner !== player.id) {
                const owner = state.players[nearestHyperspaceLane.owner];
                if (!nearestHyperspaceLane.mortgaged) {
                    const rent = calculateHyperspaceLaneRent(owner, nearestHyperspaceLane) * 2;
                    logMessage(`${player.name} pays ${owner.name} ₡${rent} rent for ${nearestHyperspaceLane.name}.`);
                    payMoney(player, owner, rent);
                    state.currentActionPending = 'none';
                } else {
                    logMessage(`${nearestHyperspaceLane.name} is mortgaged. No rent due.`);
                    state.currentActionPending = 'none';
                }
            }
            movedByCard = true;
            break;
        case "Take a trip to Hyperspace Lane 1. If you pass START, collect ₡200.":
            player.position = 5;
            if (player.position < oldPosition) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`); }
            logMessage(`${player.name} advanced to Hyperspace Lane 1.`);
            movedByCard = true;
            break;
        case "Advance to Death Star Throne Room.":
            player.position = 39;
            if (player.position < oldPosition) { player.money += 200; logMessage(`${player.name} passed START and collected ₡200!`); }
            logMessage(`${player.name} advanced to Death Star Throne Room.`);
            movedByCard = true;
            break;
        case "Go to Detention Block – Go directly to Detention Block – Do not pass START, do not collect ₡200":
            sendToJail(player);
            break;
        case "Go back 3 spaces":
            player.position = (player.position - 3 + board.length) % board.length;
            logMessage(`${player.name} moved back 3 spaces to ${board[player.position].name}.`);
            movedByCard = true;
            break;
        case "Get Out of Detention Free Card":
            player.getOutOfJailFreeCards++;
            logMessage(`${player.name} received a Get Out of Detention Free Card.`);
            state.currentActionPending = 'none';
            break;
        case "Bank pays you dividend of ₡50":
            player.money += 50;
            logMessage(`${player.name} collected ₡50 dividend from the Bank.`);
            state.currentActionPending = 'none';
            break;
        case "Your loan matures. Collect ₡150":
            player.money += 150;
            logMessage(`${player.name} collected ₡150 from loan maturity.`);
            state.currentActionPending = 'none';
            break;
        case "You have won a droid race competition. Collect ₡100":
            player.money += 100;
            logMessage(`${player.name} collected ₡100 from winning a droid race competition.`);
            state.currentActionPending = 'none';
            break;
        case "Pay poor tax of ₡15":
            payMoney(player, 'bank', 15);
            state.currentActionPending = 'none';
            break;
        case "Make general repairs on all your holdings. For each Dwelling pay ₡25. For each Fortress pay ₡100.":
            let repairCostChance = 0;
            player.properties.forEach(propId => {
                const prop = board[propId];
                if (prop.type === 'location' && prop.owner === player.id) {
                    if (prop.houses < 5) {
                        repairCostChance += prop.houses * 25;
                    } else if (prop.houses === 5) {
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
            state.currentActionPending = 'none';
            break;
        case "You have been elected Chairman of the Galactic Senate – Pay each player ₡50.":
            let totalPaid = 0;
            state.players.forEach(p => {
                if (p.id !== player.id) {
                    payMoney(player, p, 50); 
                    totalPaid += 50;
                }
            });
            logMessage(`${player.name} paid ₡50 to each other player (total ₡${totalPaid}).`);
            state.currentActionPending = 'none';
            break;
        case "Bank error in your favor – Collect ₡200":
            player.money += 200;
            logMessage(`${player.name} collected ₡200 due to a bank error.`);
            state.currentActionPending = 'none';
            break;
        case "Healer's fee – Pay ₡50":
            payMoney(player, 'bank', 50);
            state.currentActionPending = 'none';
            break;
        case "From sale of stolen goods you get ₡45.":
            player.money += 45;
            logMessage(`${player.name} collected ₡45 from stolen goods sale.`);
            state.currentActionPending = 'none';
            break;
        case "Rebel Fund matures. Receive ₡100.":
            player.money += 100;
            logMessage(`${player.name} received ₡100 from Rebel Fund.`);
            state.currentActionPending = 'none';
            break;
        case "Tax refund – Collect ₡20":
            player.money += 20;
            logMessage(`${player.name} collected ₡20 tax refund.`);
            state.currentActionPending = 'none';
            break;
        case "It is your birth-cycle. Collect ₡10 from each player.":
            let totalCollected = 0;
            state.players.forEach(p => {
                if (p.id !== player.id && p.money >= 10) {
                    payMoney(p, player, 10);
                    totalCollected += 10;
                } else if (p.id !== player.id && p.money < 10) {
                    logMessage(`${p.name} cannot afford to pay ${player.name} ₡10 for birth-cycle.`, 'warning');
                    payMoney(p, player, 10);
                }
            });
            logMessage(`${player.name} collected ₡10 from each other player (total ₡${totalCollected}).`);
            state.currentActionPending = 'none';
            break;
        case "Life insurance matures – Collect ₡100":
            player.money += 100;
            logMessage(`${player.name} collected ₡100 from life insurance maturity.`);
            state.currentActionPending = 'none';
            break;
        case "Pay medical bay ₡100":
            payMoney(player, 'bank', 100);
            state.currentActionPending = 'none';
            break;
        case "Pay training fees of ₡50":
            payMoney(player, 'bank', 50);
            state.currentActionPending = 'none';
            break;
        case "Receive ₡25 bounty fee":
            player.money += 25;
            logMessage(`${player.name} collected ₡25 bounty fee.`);
            state.currentActionPending = 'none';
            break;
        case "You are assessed for orbital repairs – Pay ₡40 per Dwelling, ₡115 per Fortress":
            let repairCostCC = 0;
            player.properties.forEach(propId => {
                const prop = board[propId];
                if (prop.type === 'location' && prop.owner === player.id) {
                    if (prop.houses < 5) {
                        repairCostCC += prop.houses * 40;
                    } else if (prop.houses === 5) {
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
            state.currentActionPending = 'none';
            break;
        case "You have won second prize in a beauty contest – Collect ₡10":
            player.money += 10;
            logMessage(`${player.name} collected ₡10 from beauty contest prize.`);
            state.currentActionPending = 'none';
            break;
        case "Inherit ₡100":
            player.money += 100;
            logMessage(`${player.name} inherited ₡100.`);
            state.currentActionPending = 'none';
            break;
        default:
            logMessage(`Unhandled card: "${card}".`, 'warning');
    }

    updatePlayerInfo();
    updateBoardUI();

    if (player.inJail) {
        return;
    }

    if (movedByCard) {
        landOnSpace(player);
    } else {
        state.currentActionPending = 'none';
        setControls();
    }
}

function showBuyPropertyAction(player, space) {
    DOMElements.propertyActionsDiv.style.display = 'flex';
    DOMElements.buyPropertyBtn.style.display = 'inline-block';
    DOMElements.buyPropertyBtn.onclick = () => buyProperty(player, space);

    DOMElements.buildHouseBtn.style.display = 'none';
    DOMElements.mortgageSelect.style.display = 'none';
    DOMElements.mortgagePropertyBtn.style.display = 'none';
    DOMElements.unmortgageSelect.style.display = 'none';
    DOMElements.unmortgagePropertyBtn.style.display = 'none';
    DOMElements.sellHouseSelect.style.display = 'none';
    DOMElements.sellHouseBtn.style.display = 'none';
}

function showPropertyManagementActions(player) {
    DOMElements.buyPropertyBtn.style.display = 'none';

    let buildableProperties = getPlayerOwnedProperties(player, 'location').filter(prop =>
        !prop.mortgaged && prop.houses < 5 && checkMonopoly(player, prop.colorGroup) &&
        player.money >= prop.houseCost
    ).sort((a,b) => a.houses - b.houses);

    const availableToBuild = [];
    if (buildableProperties.length > 0) {
        const minHousesInAnyGroup = Math.min(...buildableProperties.map(p => p.houses));
        for (const prop of buildableProperties) {
            if (prop.houses === minHousesInAnyGroup) {
                availableToBuild.push(prop);
            }
        }
    }

    DOMElements.buildHouseBtn.style.display = availableToBuild.length > 0 ? 'inline-block' : 'none';
    if (availableToBuild.length > 0) {
        DOMElements.buildHouseBtn.onclick = () => showBuildHouseDialog(player, availableToBuild);
    }

    let mortgagableProperties = getPlayerOwnedProperties(player, 'location').filter(prop =>
        !prop.mortgaged && prop.houses === 0
    ).concat(getPlayerOwnedProperties(player, 'hyperspace_lane').filter(prop => !prop.mortgaged))
    .concat(getPlayerOwnedProperties(player, 'facility').filter(prop => !prop.mortgaged));

    populateSelect(DOMElements.mortgageSelect, mortgagableProperties, 'Mortgage');
    DOMElements.mortgageSelect.style.display = mortgagableProperties.length > 0 ? 'block' : 'none';
    DOMElements.mortgagePropertyBtn.style.display = mortgagableProperties.length > 0 ? 'inline-block' : 'none';

    let unmortgagableProperties = getPlayerOwnedProperties(player).filter(prop => prop.mortgaged && player.money >= Math.ceil(prop.price / 2 * 1.1));
    populateSelect(DOMElements.unmortgageSelect, unmortgagableProperties, 'Unmortgage');
    DOMElements.unmortgageSelect.style.display = unmortgagableProperties.length > 0 ? 'block' : 'none';
    DOMElements.unmortgagePropertyBtn.style.display = unmortgagableProperties.length > 0 ? 'inline-block' : 'none';

    let sellableHouseProperties = getPlayerOwnedProperties(player, 'location').filter(prop => prop.houses > 0);
    populateSelect(DOMElements.sellHouseSelect, sellableHouseProperties, 'Sell Dwellings');
    DOMElements.sellHouseSelect.style.display = sellableHouseProperties.length > 0 ? 'block' : 'none';
    DOMElements.sellHouseBtn.style.display = sellableHouseProperties.length > 0 ? 'inline-block' : 'none';

    DOMElements.propertyActionsDiv.style.display = (
        DOMElements.buildHouseBtn.style.display !== 'none' ||
        DOMElements.mortgageSelect.style.display !== 'none' ||
        DOMElements.unmortgageSelect.style.display !== 'none' ||
        DOMElements.sellHouseSelect.style.display !== 'none'
    ) ? 'flex' : 'none';
}

function populateSelect(selectElement, properties, defaultOptionText) {
    selectElement.innerHTML = `<option value="">-- ${defaultOptionText} --</option>`;
    properties.forEach(prop => {
        const option = document.createElement('option');
        option.value = prop.id;
        option.textContent = `${prop.name} ${prop.mortgaged ? '(Mortgaged)' : ''} ${prop.houses > 0 ? `(D: ${prop.houses})` : ''}`;
        if (selectElement === DOMElements.unmortgageSelect && prop.mortgaged) {
            option.textContent = `${prop.name} (M) - Cost: ₡${Math.ceil(prop.price / 2 * 1.1)}`;
        }
        selectElement.appendChild(option);
    });
    selectElement.onchange = () => {
        if (selectElement === DOMElements.mortgageSelect) DOMElements.mortgagePropertyBtn.disabled = !selectElement.value;
        if (selectElement === DOMElements.unmortgageSelect) DOMElements.unmortgagePropertyBtn.disabled = !selectElement.value;
        if (selectElement === DOMElements.sellHouseSelect) DOMElements.sellHouseBtn.disabled = !selectElement.value;
    };
    if (properties.length > 0) {
        selectElement.value = '';
    } else {
        selectElement.value = '';
    }
    selectElement.disabled = properties.length === 0;
    if (selectElement === DOMElements.mortgageSelect) DOMElements.mortgagePropertyBtn.disabled = true;
    if (selectElement === DOMElements.unmortgageSelect) DOMElements.unmortgagePropertyBtn.disabled = true;
    if (selectElement === DOMElements.sellHouseSelect) DOMElements.sellHouseBtn.disabled = true;
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
    confirmBtn.disabled = true;

    buildSelect.onchange = () => {
        confirmBtn.disabled = !buildSelect.value;
    };

    DOMElements.propertyActionsDiv.appendChild(selectDiv);
    DOMElements.buildHouseBtn.style.display = 'none';

    confirmBtn.onclick = () => {
        const propId = parseInt(buildSelect.value);
        const prop = board[propId];
        if (prop && prop.owner === player.id && player.money >= prop.houseCost && prop.houses < 5) {
            const group = getPropertiesByColor(prop.colorGroup);
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
            DOMElements.propertyActionsDiv.removeChild(selectDiv);
            showPropertyManagementActions(player);
            setControls();
        } else {
            logMessage("Cannot build Dwelling here.", "error");
        }
    };
    cancelBtn.onclick = () => {
        DOMElements.propertyActionsDiv.removeChild(selectDiv);
        showPropertyManagementActions(player);
        setControls();
    };
}

export function mortgageProperty(propId) {
    const player = state.players[state.currentPlayerIndex];
    const prop = board[propId];
    if (prop && prop.owner === player.id && !prop.mortgaged && prop.houses === 0) {
        prop.mortgaged = true;
        player.money += prop.price / 2;
        logMessage(`${player.name} mortgaged ${prop.name} for ₡${prop.price / 2}.`, 'info');
        updatePlayerInfo();
        updateBoardUI();
        showPropertyManagementActions(player);
    } else {
        logMessage(`Cannot mortgage ${prop.name}. Must have no Dwellings and own it.`, 'error');
    }
}

export function unmortgageProperty(propId) {
    const player = state.players[state.currentPlayerIndex];
    const prop = board[propId];
    const unmortgageCost = Math.ceil(prop.price / 2 * 1.1);
    if (prop && prop.owner === player.id && prop.mortgaged && player.money >= unmortgageCost) {
        prop.mortgaged = false;
        player.money -= unmortgageCost;
        logMessage(`${player.name} unmortgaged ${prop.name} for ₡${unmortgageCost}.`, 'info');
        updatePlayerInfo();
        updateBoardUI();
        showPropertyManagementActions(player);
    } else {
        logMessage(`Cannot unmortgage ${prop.name}. Not enough credits or not mortgaged.`, 'error');
    }
}

export function sellHouse(propId) {
    const player = state.players[state.currentPlayerIndex];
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
        showPropertyManagementActions(player);
    } else {
        logMessage(`Cannot sell Dwelling on ${prop.name}. No Dwellings to sell or not owned.`, 'error');
    }
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
        logMessage("Not enough credits to pay bail.", "error");
    }
}

export function useJailCard() {
    const player = state.players[state.currentPlayerIndex];
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
}

function setControls() {
    const player = state.players[state.currentPlayerIndex];

    DOMElements.propertyActionsDiv.style.display = 'none';
    DOMElements.jailActionsDiv.style.display = 'none';
    DOMElements.buyPropertyBtn.style.display = 'none';
    DOMElements.buildHouseBtn.style.display = 'none';
    showPropertyManagementActions(player);

    if (state.gameOver) {
        DOMElements.rollDiceBtn.disabled = true;
        DOMElements.endTurnBtn.disabled = true;
        return;
    }

    if (player.inJail && player.hasRolled) {
        DOMElements.rollDiceBtn.disabled = true;
        DOMElements.endTurnBtn.disabled = false;
        DOMElements.jailActionsDiv.style.display = 'none';
        state.currentActionPending = 'none';
    } else if (player.inJail) {
        DOMElements.jailActionsDiv.style.display = 'flex';
        DOMElements.payBailBtn.disabled = (player.money < 50);
        DOMElements.useJailCardBtn.disabled = (player.getOutOfJailFreeCards === 0);

        if (player.jailTurns === 3) {
            logMessage(`${player.name} is on their 3rd turn in the Detention Block. Must pay ₡50 bail or use a Get Out of Detention Free Card.`, 'warning');
            DOMElements.rollDiceBtn.disabled = true;
            DOMElements.endTurnBtn.disabled = true;
            DOMElements.propertyActionsDiv.style.display = 'none';

            if (DOMElements.payBailBtn.disabled && DOMElements.useJailCardBtn.disabled) {
                logMessage(`${player.name} cannot pay bail or use a card and is bankrupt!`, 'error');
                handleBankruptcy(player, 'bank', 50);
                state.currentActionPending = 'none';
                setControls();
                return;
            }
        } else {
            DOMElements.rollDiceBtn.disabled = false;
            DOMElements.endTurnBtn.disabled = true;
        }
    } else if (player.doublesRolledThisTurn > 0 && player.doublesRolledThisTurn < 3) {
        DOMElements.rollDiceBtn.disabled = false;
        DOMElements.endTurnBtn.disabled = true;
        if (state.currentActionPending === 'buy') {
            showBuyPropertyAction(player, board[player.position]);
        } else if (state.currentActionPending === 'manage') {
            showPropertyManagementActions(player);
        }
    } else if (state.currentActionPending === 'buy') {
        DOMElements.rollDiceBtn.disabled = true;
        DOMElements.endTurnBtn.disabled = false;
        showBuyPropertyAction(player, board[player.position]);
    } else if (state.currentActionPending === 'manage') {
        DOMElements.rollDiceBtn.disabled = true;
        DOMElements.endTurnBtn.disabled = false;
        showPropertyManagementActions(player);
    } else {
        DOMElements.rollDiceBtn.disabled = true;
        DOMElements.endTurnBtn.disabled = false;
    }
}

function setControlsForTurnStart() {
    const player = state.players[state.currentPlayerIndex];
    player.hasRolled = false;
    player.doublesRolledThisTurn = 0;
    state.currentActionPending = 'none';

    DOMElements.rollDiceBtn.disabled = false;
    DOMElements.endTurnBtn.disabled = true;
    DOMElements.propertyActionsDiv.style.display = 'none';
    DOMElements.jailActionsDiv.style.display = 'none';
    DOMElements.buyPropertyBtn.style.display = 'none';
    showPropertyManagementActions(player);

    if (player.inJail) {
        logMessage(`${player.name} is in the Detention Block.`, 'warning');
        setControlsForJailStartTurn();
    }
}

function setControlsForJailStartTurn() {
    const player = state.players[state.currentPlayerIndex];
    DOMElements.jailActionsDiv.style.display = 'flex';
    DOMElements.payBailBtn.disabled = (player.money < 50);
    DOMElements.useJailCardBtn.disabled = (player.getOutOfJailFreeCards === 0);

    if (player.jailTurns === 3) {
        logMessage(`${player.name} is on their 3rd turn in the Detention Block. Must pay ₡50 bail or use a Get Out of Detention Free Card.`, 'warning');
        DOMElements.rollDiceBtn.disabled = true;
        DOMElements.endTurnBtn.disabled = true;
        DOMElements.propertyActionsDiv.style.display = 'none';

        if (DOMElements.payBailBtn.disabled && DOMElements.useJailCardBtn.disabled) {
            logMessage(`${player.name} cannot pay bail or use a card and is bankrupt!`, 'error');
            handleBankruptcy(player, 'bank', 50);
            state.currentActionPending = 'none';
            setControls();
            return;
        }
    } else {
        DOMElements.rollDiceBtn.disabled = false;
        DOMElements.endTurnBtn.disabled = true;
    }
}

export function endTurn() {
    if (state.isAuctionActive || state.isTradeActive) return;

    if (state.currentActionPending === 'buy') {
        const space = board[state.players[state.currentPlayerIndex].position];
        logMessage(`${state.players[state.currentPlayerIndex].name} declined to buy ${space.name}. It will be auctioned.`);
        startAuction(space.id);
        return;
    }

    logMessage(`${state.players[state.currentPlayerIndex].name}'s turn ended.`);

    let nextPlayerFound = false;
    let loopCount = 0;

    do {
        state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
        loopCount++;
        if (loopCount > state.players.length * 2) {
            logMessage("Error: Could not find next player.", "error");
            state.gameOver = true;
            return;
        }
        nextPlayerFound = true;
    } while (!nextPlayerFound);

    if (state.players.length <= 1) {
        checkWinCondition();
        return;
    }

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
    state.auctionBidders = [...state.players];
    state.auctionCurrentBidderIndex = state.currentPlayerIndex;

    DOMElements.rollDiceBtn.disabled = true;
    DOMElements.endTurnBtn.disabled = true;
    DOMElements.propertyActionsDiv.style.display = 'none';
    DOMElements.jailActionsDiv.style.display = 'none';

    document.body.classList.add('auction-active');
    DOMElements.auctionModalOverlay.style.display = 'flex';
    DOMElements.auctionWithdrawBtn.textContent = "Pass";
    updateAuctionUI();
}

function updateAuctionUI() {
    showAuctionMessage('');
    const property = board[state.auctionPropertyId];
    DOMElements.auctionPropertyName.textContent = property.name;
    DOMElements.auctionCurrentBid.textContent = `₡${state.currentBid}`;
    DOMElements.auctionHighestBidder.textContent = state.highestBidderId !== null ? state.players.find(p => p.id === state.highestBidderId).name : 'None';
    
    const currentBidder = state.auctionBidders[state.auctionCurrentBidderIndex];
    DOMElements.auctionCurrentBidder.textContent = currentBidder.name;
    DOMElements.auctionBidAmountInput.value = state.currentBid + 1;
    DOMElements.auctionBidAmountInput.min = state.currentBid + 1;
}

export function handlePlaceBid() {
    const bidAmount = parseInt(DOMElements.auctionBidAmountInput.value);
    const bidder = state.auctionBidders[state.auctionCurrentBidderIndex];

    if (isNaN(bidAmount) || bidAmount <= state.currentBid) {
        showAuctionMessage(`Invalid bid. Must be higher than ₡${state.currentBid}.`);
        return;
    }
    if (bidAmount > bidder.money) {
        showAuctionMessage(`${bidder.name} cannot afford to bid ₡${bidAmount}.`);
        return;
    }

    state.currentBid = bidAmount;
    state.highestBidderId = bidder.id;
    logMessage(`${bidder.name} bids ₡${state.currentBid}.`, 'info');
    nextBidder();
}

export function handlePass() {
    const bidder = state.auctionBidders[state.auctionCurrentBidderIndex];
    if (state.highestBidderId === null) {
        if (bidder.money >= 1) {
            showAuctionMessage(`${bidder.name}, you must place an opening bid of at least ₡1.`);
            return;
        }
    }

    logMessage(`${bidder.name} passed their turn to bid.`, 'info');
    nextBidder();
}

function nextBidder() {
    state.auctionCurrentBidderIndex = (state.auctionCurrentBidderIndex + 1) % state.auctionBidders.length;
    
    if (state.auctionBidders[state.auctionCurrentBidderIndex].id === state.highestBidderId) {
        endAuction();
    } else {
        updateAuctionUI();
    }
}

function endAuction() {
    const property = board[state.auctionPropertyId];
    if (state.highestBidderId !== null) {
        const winner = state.players.find(p => p.id === state.highestBidderId);
        logMessage(`${winner.name} wins the auction for ${property.name} with a bid of ₡${state.currentBid}!`, 'success');
        
        winner.money -= state.currentBid;
        property.owner = winner.id;
        winner.properties.push(property.id);
    } else {
        logMessage(`No bids were placed for ${property.name}. It remains unowned.`, 'info');
    }

    state.isAuctionActive = false;
    state.auctionPropertyId = null;
    document.body.classList.remove('auction-active');
    DOMElements.auctionModalOverlay.style.display = 'none';
    DOMElements.auctionWithdrawBtn.textContent = "Withdraw";

    state.currentActionPending = 'none';
    setControls();
    updatePlayerInfo();
    updateBoardUI();
}

// --- Trade Logic ---
function showTradeMessage(message) {
    DOMElements.tradeMessageArea.textContent = message;
}

export function showTradeModal() {
    if (state.isAuctionActive) return;
    state.isTradeActive = true;
    showTradeMessage('');

    DOMElements.rollDiceBtn.disabled = true;
    DOMElements.endTurnBtn.disabled = true;

    DOMElements.tradeOfferMoney.value = 0;
    DOMElements.tradeRequestMoney.value = 0;
    DOMElements.tradeOfferCards.value = 0;
    DOMElements.tradeRequestCards.value = 0;

    DOMElements.tradePartnerSelect.innerHTML = '<option value="">-- Select Player --</option>';
    state.players.forEach((player, index) => {
        if (index !== state.currentPlayerIndex) {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.name;
            DOMElements.tradePartnerSelect.appendChild(option);
        }
    });

    updateTradeModalAssets();
    document.body.classList.add('trade-active');
    DOMElements.tradeModalOverlay.style.display = 'flex';
}

export function updateTradeModalAssets() {
    const proposer = state.players[state.currentPlayerIndex];
    const partnerId = parseInt(DOMElements.tradePartnerSelect.value);
    const partner = state.players.find(p => p.id === partnerId);

    DOMElements.tradeOfferProperties.innerHTML = '';
    proposer.properties.forEach(propId => {
        const prop = board[propId];
        const option = document.createElement('option');
        option.value = prop.id;
        option.textContent = prop.name;
        DOMElements.tradeOfferProperties.appendChild(option);
    });
    DOMElements.tradeOfferCards.max = proposer.getOutOfJailFreeCards;
    DOMElements.tradeOfferMoney.max = proposer.money;

    DOMElements.tradeRequestProperties.innerHTML = '';
    if (partner) {
        partner.properties.forEach(propId => {
            const prop = board[propId];
            const option = document.createElement('option');
            option.value = prop.id;
            option.textContent = prop.name;
            DOMElements.tradeRequestProperties.appendChild(option);
        });
        DOMElements.tradeRequestCards.max = partner.getOutOfJailFreeCards;
        DOMElements.tradeRequestMoney.max = partner.money;
    } else {
        DOMElements.tradeRequestCards.max = 0;
        DOMElements.tradeRequestMoney.max = 0;
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

    if (state.tradeOffer.money > proposer.money || state.tradeOffer.cards > proposer.getOutOfJailFreeCards) {
        showTradeMessage("You cannot offer more credits or cards than you have.");
        return;
    }
    if (state.tradeRequest.money > partner.money || state.tradeRequest.cards > partner.getOutOfJailFreeCards) {
        showTradeMessage(`${partner.name} does not have enough credits or cards for this trade.`);
        return;
    }
    const allTradeProps = [...state.tradeOffer.properties, ...state.tradeRequest.properties];
    for (const propId of allTradeProps) {
        if (board[propId].houses > 0) {
            showTradeMessage("Cannot trade holdings with Dwellings/Fortresses. They must be sold first.");
            return;
        }
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
    DOMElements.reviewOfferProperties.innerHTML = state.tradeOffer.properties.map(id => `<li>${board[id].name}</li>`).join('') || '<li>None</li>';

    DOMElements.reviewRequestMoney.textContent = `₡${state.tradeRequest.money}`;
    DOMElements.reviewRequestCards.textContent = state.tradeRequest.cards;
    DOMElements.reviewRequestProperties.innerHTML = state.tradeRequest.properties.map(id => `<li>${board[id].name}</li>`).join('') || '<li>None</li>';

    DOMElements.tradeModalOverlay.style.display = 'none';
    DOMElements.tradeReviewModalOverlay.style.display = 'flex';
}

export function handleAcceptTrade() {
    const proposer = state.players[state.currentPlayerIndex];
    const partner = state.players.find(p => p.id === state.tradePartnerId);

    logMessage(`${partner.name} accepted the trade with ${proposer.name}.`, 'success');

    proposer.money += state.tradeRequest.money - state.tradeOffer.money;
    partner.money += state.tradeOffer.money - state.tradeRequest.money;

    proposer.getOutOfJailFreeCards += state.tradeRequest.cards - state.tradeOffer.cards;
    partner.getOutOfJailFreeCards += state.tradeOffer.cards - state.tradeRequest.cards;

    state.tradeOffer.properties.forEach(propId => {
        proposer.properties = proposer.properties.filter(id => id !== propId);
        partner.properties.push(propId);
        board[propId].owner = partner.id;
    });
    state.tradeRequest.properties.forEach(propId => {
        partner.properties = partner.properties.filter(id => id !== propId);
        proposer.properties.push(propId);
        board[propId].owner = proposer.id;
    });

    endTrade();
}

export function handleRejectTrade() {
    const partner = state.players.find(p => p.id === state.tradePartnerId);
    logMessage(`${partner.name} rejected the trade.`, 'warning');
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
    player.position = spaceId;
    logMessage(`DEBUG: ${player.name} moved directly to ${board[spaceId].name}.`, 'debug');
    updatePlayerInfo();
    updateBoardUI();
    landOnSpace(player);
}

export function debugSimulateRoll() {
    const die1 = parseInt(DOMElements.debugDie1Input.value);
    const die2 = parseInt(DOMElements.debugDie2Input.value);
    if (isNaN(die1) || isNaN(die2) || die1 < 1 || die1 > 6 || die2 < 1 || die2 > 6) { logMessage("Please enter valid dice values (1-6).", "error"); return; }
    rollDice(die1, die2);
    logMessage(`DEBUG: Simulated roll of ${die1}, ${die2}.`, 'debug');
}

export function debugChangeOwner() {
    const propId = parseInt(DOMElements.debugPropertySelect.value);
    const ownerValue = DOMElements.debugOwnerSelect.value;
    if (isNaN(propId) || !ownerValue) { logMessage("Please select a holding and an owner.", "error"); return; }
    const property = board[propId];
    if (!property || !['location', 'hyperspace_lane', 'facility'].includes(property.type)) { logMessage("Selected space is not a tradable holding.", "error"); return; }
    if (property.owner !== null) {
        const oldOwner = state.players.find(p => p.id === property.owner);
        if (oldOwner) {
            oldOwner.properties = oldOwner.properties.filter(p => p !== propId);
            if (property.type === 'location') {
                oldOwner.money += property.houses * (property.houseCost / 2);
                logMessage(`DEBUG: ${oldOwner.name} refunded ₡${property.houses * (property.houseCost / 2)} for Dwellings on ${property.name}.`, 'debug');
                property.houses = 0;
            }
            property.mortgaged = false;
        }
    }
    if (ownerValue === 'bank') {
        property.owner = null;
        logMessage(`DEBUG: ${property.name} is now unowned (Bank).`, 'debug');
    } else {
        const newOwnerId = parseInt(ownerValue);
        const newOwner = state.players.find(p => p.id === newOwnerId);
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
}

export function debugSetHouses() {
    const propId = parseInt(DOMElements.debugHousePropertySelect.value);
    const houseCount = parseInt(DOMElements.debugHouseCountInput.value);
    if (isNaN(propId) || isNaN(houseCount) || houseCount < 0 || houseCount > 5) { logMessage("Please select a location and a valid Dwelling count (0-5).", "error"); return; }
    const property = board[propId];
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
    sendToJail(player);
    logMessage(`DEBUG: ${player.name} sent to Detention Block.`, 'debug');
    updatePlayerInfo();
    updateBoardUI();
}