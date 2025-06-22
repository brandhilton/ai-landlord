import { board, chanceCards, communityChestCards } from './config.js';
import { DOMElements, logMessage, updatePlayerInfo, updateBoardUI, createBoardUI, populateDebugPlayerSelects, populateDebugSpaceSelect, populateDebugPropertySelects } from './ui.js';

// --- Game State Variables ---
export let state = {
    players: [],
    currentPlayerIndex: 0,
    diceRoll: [0, 0],
    // doublesCount: 0, // Redundant
    gameOver: false,
    currentActionPending: null, // e.g., 'buy', 'manage', or null
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
    if (ownedFacilities === 1) return diceSum * 4;
    if (ownedFacilities === 2) return diceSum * 10;
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
            id: i, name: nameInput.value || `Player ${i + 1}`, money: 1500, position: 0,
            inJail: false, jailTurns: 0, doublesRolledThisTurn: 0, hasRolled: false, getOutOfJailFreeCards: 0
        });
    }
    board.forEach(space => {
        if (['location', 'hyperspace_lane', 'facility'].includes(space.type)) {
            space.owner = null; if (space.type === 'location') space.houses = 0; space.mortgaged = false;
        }
    });
    state.chanceCardsShuffled = shuffleArray([...chanceCards]);
    state.communityChestCardsShuffled = shuffleArray([...communityChestCards]);
    state.currentPlayerIndex = 0; state.gameOver = false; state.diceRoll = [0,0]; state.currentActionPending = null;

    DOMElements.setupScreen.style.display = 'none'; DOMElements.gameScreen.style.display = 'block';
    createBoardUI(); updatePlayerInfo(); updateBoardUI();
    logMessage("Game Started!", "success");
    setControlsForTurnStart();
    refreshDebugControls();
}

function refreshDebugControls() { /* ... as before ... */
    populateDebugPlayerSelects(); populateDebugSpaceSelect(); populateDebugPropertySelects();
}

export function rollDice(simulatedDie1 = null, simulatedDie2 = null) {
    if (state.isAuctionActive || state.isTradeActive || state.gameOver) return;
    const player = state.players[state.currentPlayerIndex];

    // Prevent rolling if not allowed by current turn state
    if (player.hasRolled && !(player.doublesRolledThisTurn > 0 && player.doublesRolledThisTurn < 3 && !player.inJail)) {
        logMessage("You cannot roll again now.", "warning"); return;
    }
    if (player.inJail && player.hasRolled && player.doublesRolledThisTurn === 0) { // Already attempted jail roll without doubles
        logMessage("You have already attempted your roll for this turn in Detention.", "warning"); return;
    }

    const die1 = simulatedDie1 !== null ? simulatedDie1 : Math.floor(Math.random() * 6) + 1;
    const die2 = simulatedDie2 !== null ? simulatedDie2 : Math.floor(Math.random() * 6) + 1;
    state.diceRoll = [die1, die2];
    DOMElements.diceDisplay.textContent = `Dice: ${die1}, ${die2}`;
    logMessage(`${player.name} rolled ${die1} + ${die2} = ${die1+die2}.`);
    player.hasRolled = true;
    state.currentActionPending = null; // Clear pending 'buy' before move

    if (die1 === die2) {
        if (player.inJail) {
            logMessage(`${player.name} rolled doubles to get out of Detention!`, 'success');
            player.inJail = false; player.jailTurns = 0; player.doublesRolledThisTurn = 0; // Doubles out of jail don't grant another turn
            movePlayer(player, die1 + die2); // landOnSpace will call setControls
            return;
        }
        player.doublesRolledThisTurn++;
        logMessage(`${player.name} rolled doubles! (${player.doublesRolledThisTurn} time(s))`, 'warning');
        if (player.doublesRolledThisTurn === 3) {
            logMessage(`${player.name} rolled 3 doubles! Go to Detention!`, 'error');
            sendToJail(player); // sendToJail calls setControls
            return;
        }
        // If 1st or 2nd double, player rolls again. Move first.
        movePlayer(player, die1 + die2); // landOnSpace will call setControls, which enables roll again
    } else { // Not doubles
        player.doublesRolledThisTurn = 0;
        if (player.inJail) {
            handleJailRoll(player, die1, die2); // This calls setControls
        } else {
            movePlayer(player, die1 + die2); // landOnSpace will call setControls
        }
    }
}


function movePlayer(player, steps) { /* ... as before ... */
    const oldPosition = player.position;
    player.position = (player.position + steps) % board.length;
    logMessage(`${player.name} moved from ${board[oldPosition].name} to ${board[player.position].name}.`);
    if (player.position < oldPosition && !player.inJail) { // Passed START
        player.money += 200;
        logMessage(`${player.name} passed START and collected ₡200!`);
    }
    updatePlayerInfo(); updateBoardUI();
    landOnSpace(player); // This is crucial and will call setControls()
}

function sendToJail(player) { /* ... as before ... */
    player.position = 10; player.inJail = true; player.jailTurns = 0;
    player.doublesRolledThisTurn = 0; player.hasRolled = true; // Considered their roll action
    logMessage(`${player.name} is now in the Detention Block!`);
    updatePlayerInfo(); updateBoardUI(); state.currentActionPending = null;
    setControls();
}

function handleJailRoll(player, die1, die2) { /* ... as before ... */
    player.jailTurns++;
    logMessage(`${player.name} did not roll doubles. In Detention for ${player.jailTurns} turn(s).`);
    if (player.jailTurns >= 3) logMessage(`${player.name} must pay or use card next turn.`, "warning");
    state.currentActionPending = null;
    setControls();
}

function landOnSpace(player) { /* ... largely as before ... ensure all paths call setControls() */
    const space = board[player.position];
    logMessage(`${player.name} landed on ${space.name}.`);
    state.currentActionPending = null;

    switch (space.type) {
        case 'location': case 'hyperspace_lane': case 'facility':
            if (space.owner === null) state.currentActionPending = 'buy';
            else if (space.owner !== player.id) { /* ... rent logic ... */
                const owner = state.players.find(p => p.id === space.owner);
                if (owner && !space.mortgaged) {
                    let rent = 0;
                    if (space.type === 'location') rent = space.rent[space.houses] * (space.houses === 0 && checkMonopoly(owner, space.colorGroup) ? 2 : 1);
                    else if (space.type === 'hyperspace_lane') rent = calculateHyperspaceLaneRent(owner, space);
                    else if (space.type === 'facility') rent = calculateFacilityRent(owner, state.diceRoll[0] + state.diceRoll[1]);
                    logMessage(`${space.name} owned by ${owner.name}. Rent: ₡${rent}.`);
                    payMoney(player, owner, rent);
                } else if (owner && space.mortgaged) logMessage(`${space.name} is mortgaged.`);
            } else state.currentActionPending = 'manage';
            break;
        case 'tax': payMoney(player, 'bank', space.amount); break;
        case 'force_card': drawCard(player, state.chanceCardsShuffled, 'Force Card'); return;
        case 'supply_drop': drawCard(player, state.communityChestCardsShuffled, 'Supply Drop'); return;
        case 'send_to_detention': sendToJail(player); return;
        // START, Detention (visiting), Free Parking: no action, currentActionPending remains null
    }
    setControls(); // This is the key call after landing action resolved
}

function buyProperty(player, space) { /* ... as before ... */
    if (player.money >= space.price && space.owner === null) {
        player.money -= space.price; space.owner = player.id;
        logMessage(`${player.name} bought ${space.name}.`, 'success');
        state.currentActionPending = 'manage'; // Now they can manage
    } else { state.currentActionPending = null; } // Reset if buy failed
    updatePlayerInfo(); updateBoardUI();
    // showPropertyManagementActions(player); // setControls will handle this
    setControls();
}

function payMoney(fromPlayer, toRecipient, amount) { /* ... as before ... */
    if (fromPlayer.money >= amount) {
        fromPlayer.money -= amount;
        if (toRecipient !== 'bank' && typeof toRecipient === 'object' && toRecipient !== null) {
            toRecipient.money += amount;
            logMessage(`${fromPlayer.name} paid ₡${amount} to ${toRecipient.name}.`);
        } else { logMessage(`${fromPlayer.name} paid ₡${amount} to the Bank.`);}
        updatePlayerInfo(); return true;
    } else { handleBankruptcy(fromPlayer, toRecipient, amount); return fromPlayer.money >= 0; }
}

function handleBankruptcy(bankruptPlayer, recipient, debtAmount) { /* ... as before ... */
    // Ensure that if current player goes bankrupt, game moves to next valid player or ends
    logMessage(`${bankruptPlayer.name} is trying to cover a debt of ₡${debtAmount}.`);
    const ownedLocations = getPlayerOwnedProperties(bankruptPlayer, 'location', true);
    for (let i = 5; i > 0; i--) { if (bankruptPlayer.money >= debtAmount) break; ownedLocations.forEach(prop => { if (bankruptPlayer.money >= debtAmount) return; if (prop.houses === i) { prop.houses--; bankruptPlayer.money += prop.houseCost / 2; logMessage(`${bankruptPlayer.name} sold a ${i===5 ? 'Fortress' : 'Dwelling'} on ${prop.name}. Credits: ₡${bankruptPlayer.money}`); updateBoardUI(); updatePlayerInfo();}}); }
    if (bankruptPlayer.money < debtAmount) { getPlayerOwnedProperties(bankruptPlayer, null, true).filter(p => !p.mortgaged).sort((a, b) => (a.price / 2) - (b.price / 2)).forEach(prop => { if (bankruptPlayer.money >= debtAmount) return; prop.mortgaged = true; bankruptPlayer.money += prop.price / 2; logMessage(`${bankruptPlayer.name} mortgaged ${prop.name}. Credits: ₡${bankruptPlayer.money}`); updateBoardUI(); updatePlayerInfo(); }); }
    if (bankruptPlayer.money >= debtAmount) { logMessage(`${bankruptPlayer.name} managed to raise funds!`); payMoney(bankruptPlayer, recipient, debtAmount); return; }
    logMessage(`${bankruptPlayer.name} is bankrupt! Assets to ${recipient === 'bank' ? 'Bank' : recipient.name}.`, 'error');
    const recipientPlayer = (recipient === 'bank' || recipient === bankruptPlayer) ? null : recipient;
    board.forEach(prop => { if (prop.owner === bankruptPlayer.id) { prop.owner = recipientPlayer ? recipientPlayer.id : null; prop.mortgaged = !!recipientPlayer; prop.houses = 0; logMessage(`${prop.name} ${recipientPlayer ? 'transferred (M)' : 'returned to Bank'}.`); } });
    if(recipientPlayer && bankruptPlayer.getOutOfJailFreeCards > 0) recipientPlayer.getOutOfJailFreeCards += bankruptPlayer.getOutOfJailFreeCards;
    bankruptPlayer.money = -1;
    const wasCurrentPlayer = state.players[state.currentPlayerIndex]?.id === bankruptPlayer.id;
    state.players = state.players.filter(p => p.id !== bankruptPlayer.id);
    updatePlayerInfo(); updateBoardUI(); checkWinCondition();
    if (state.gameOver) return;
    if (wasCurrentPlayer && state.players.length > 0) { // If current player went bankrupt, effectively end their turn
        state.currentPlayerIndex = state.currentPlayerIndex % state.players.length; // Adjust index if it was the last player
        logMessage(`Advancing to next player due to bankruptcy.`);
        setControlsForTurnStart(); // Setup for the (potentially new) current player
    } else if (state.players.length > 0) {
        setControls(); // Re-evaluate for current player if someone else went bankrupt
    }
}

function checkWinCondition() { /* ... as before ... */
    const activePlayers = state.players.filter(p => p.money >= 0);
    if (activePlayers.length === 1 && state.players.length === 1) { state.gameOver = true; logMessage(`${activePlayers[0].name} wins!`, 'success'); DOMElements.rollDiceBtn.disabled = true; DOMElements.endTurnBtn.disabled = true; if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display = 'none'; if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = 'none'; }
    else if (activePlayers.length === 0 && state.players.length === 0) { state.gameOver = true; logMessage("All players bankrupt! No winner.", "error"); DOMElements.rollDiceBtn.disabled = true; DOMElements.endTurnBtn.disabled = true; }
}

function drawCard(player, deck, cardType) { /* ... as before ... ensures setControls() or landOnSpace() (which calls setControls()) is hit */
    const cardText = deck.shift(); deck.push(cardText); logMessage(`${player.name} drew ${cardType}: "${cardText}"`);
    let movedByCard = false, oldPosition = player.position, landOnNewSpace = true;
    switch (cardText) { /* ... all card cases ... */
        case "Advance to START (Collect ₡200)": player.position = 0; player.money += 200; movedByCard = true; landOnNewSpace = false; break;
        case "Advance to Starkiller Base. If you pass START, collect ₡200.": if (player.position > 24) player.money += 200; player.position = 24; movedByCard = true; break;
        case "Advance to Cloud City. If you pass START, collect ₡200.": if (player.position > 11) player.money += 200; player.position = 11; movedByCard = true; break;
        case "Advance to nearest Facility. If unowned, you may buy it from the Bank. If owned, pay owner 10 times amount shown on dice.": const fac = findNextSpaceType(oldPosition, 'facility'); if (fac) { if (fac.id < oldPosition && fac.id !==0) player.money+=200; player.position = fac.id; movedByCard = true; } break;
        case "Advance to nearest Hyperspace Lane. If unowned, you may buy it from the Bank. If owned, pay owner twice the rental to which he/she is otherwise entitled.": const lane = findNextSpaceType(oldPosition, 'hyperspace_lane'); if (lane) { if (lane.id < oldPosition && lane.id !==0) player.money+=200; player.position = lane.id; if (lane.owner !== null && lane.owner !== player.id && !lane.mortgaged) { const o = state.players.find(p=>p.id===lane.owner); payMoney(player,o,calculateHyperspaceLaneRent(o,lane)*2); landOnNewSpace=false;} else movedByCard = true;} break;
        case "Bank pays you dividend of ₡50": player.money += 50; landOnNewSpace = false; break;
        case "Get Out of Detention Free Card": player.getOutOfJailFreeCards++; landOnNewSpace = false; break;
        case "Go back 3 spaces": player.position = (player.position - 3 + board.length) % board.length; movedByCard = true; break;
        case "Go to Detention Block – Go directly to Detention Block – Do not pass START, do not collect ₡200": sendToJail(player); landOnNewSpace = false; break;
        case "Make general repairs on all your holdings. For each Dwelling pay ₡25. For each Fortress pay ₡100.": let rc=0; board.forEach(p=>{if(p.owner===player.id&&p.type==='location'){if(p.houses===5)rc+=100;else rc+=p.houses*25;}}); if(rc>0)payMoney(player,'bank',rc); landOnNewSpace=false; break;
        case "Pay poor tax of ₡15": payMoney(player, 'bank', 15); landOnNewSpace = false; break;
        case "Take a trip to Hyperspace Lane 1. If you pass START, collect ₡200.": if (player.position > 5) player.money+=200; player.position = 5; movedByCard = true; break;
        case "Advance to Death Star Throne Room.": player.position = 39; movedByCard = true; break;
        case "You have been elected Chairman of the Galactic Senate – Pay each player ₡50.": state.players.forEach(p=>{if(p.id!==player.id)payMoney(player,p,50);}); landOnNewSpace=false; break;
        case "Your loan matures. Collect ₡150": player.money+=150; landOnNewSpace=false; break;
        case "You have won a droid race competition. Collect ₡100": player.money+=100; landOnNewSpace=false; break;
        case "Bank error in your favor – Collect ₡200": player.money+=200; landOnNewSpace=false; break;
        case "Healer's fee – Pay ₡50": payMoney(player,'bank',50); landOnNewSpace=false; break;
        case "From sale of stolen goods you get ₡45.": player.money+=45; landOnNewSpace=false; break;
        case "Rebel Fund matures. Receive ₡100.": player.money+=100; landOnNewSpace=false; break;
        case "Tax refund – Collect ₡20": player.money+=20; landOnNewSpace=false; break;
        case "It is your birth-cycle. Collect ₡10 from each player.": state.players.forEach(p=>{if(p.id!==player.id) if(p.money>=10){p.money-=10;player.money+=10;}else{payMoney(p,player,10);}}); landOnNewSpace=false; break;
        case "Life insurance matures – Collect ₡100": player.money+=100; landOnNewSpace=false; break;
        case "Pay medical bay ₡100": payMoney(player,'bank',100); landOnNewSpace=false; break;
        case "Pay training fees of ₡50": payMoney(player,'bank',50); landOnNewSpace=false; break;
        case "Receive ₡25 bounty fee": player.money+=25; landOnNewSpace=false; break;
        case "You are assessed for orbital repairs – Pay ₡40 per Dwelling, ₡115 per Fortress": let rcc=0; board.forEach(p=>{if(p.owner===player.id&&p.type==='location'){if(p.houses===5)rcc+=115;else rcc+=p.houses*40;}}); if(rcc>0)payMoney(player,'bank',rcc); landOnNewSpace=false; break;
        case "You have won second prize in a beauty contest – Collect ₡10": player.money+=10; landOnNewSpace=false; break;
        case "Inherit ₡100": player.money+=100; landOnNewSpace=false; break;
        default: logMessage(`Unhandled card: "${cardText}"`, 'warning'); landOnNewSpace = false;
    }
    updatePlayerInfo(); updateBoardUI();
    if (movedByCard && landOnNewSpace && !player.inJail) landOnSpace(player); else setControls();
}

function showBuyPropertyAction(player, space) { /* ... as before ... */
    if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display = 'flex';
    if(DOMElements.buyPropertyBtn) DOMElements.buyPropertyBtn.style.display = 'inline-block';
    DOMElements.buyPropertyBtn.onclick = () => { buyProperty(player, space); };
    if(DOMElements.buildHouseBtn) DOMElements.buildHouseBtn.style.display = 'none';
    if(DOMElements.sellHouseBtn) DOMElements.sellHouseBtn.style.display = 'none';
    if(DOMElements.sellHouseSelect) DOMElements.sellHouseSelect.style.display = 'none';
    if(DOMElements.mortgageSelect) DOMElements.mortgageSelect.style.display = 'none';
    if(DOMElements.mortgagePropertyBtn) DOMElements.mortgagePropertyBtn.style.display = 'none';
    if(DOMElements.unmortgageSelect) DOMElements.unmortgageSelect.style.display = 'none';
    if(DOMElements.unmortgagePropertyBtn) DOMElements.unmortgagePropertyBtn.style.display = 'none';
}

// showPropertyManagementActions - ensure this logic is correct for enabling mortgage
function showPropertyManagementActions(player) { /* ... (ensure mortgage logic includes the house check) ... */
    if(DOMElements.buyPropertyBtn) DOMElements.buyPropertyBtn.style.display = 'none';
    const buildable = getPlayerOwnedProperties(player,'location').filter(p=>!p.mortgaged&&p.houses<5&&player.money>=p.houseCost&&checkMonopoly(player,p.colorGroup));
    let actualBuildable=[];if(buildable.length>0){const g={};buildable.forEach(p=>{if(!g[p.colorGroup])g[p.colorGroup]=[];g[p.colorGroup].push(p);});for(const c in g){const gp=g[c];const m=Math.min(...gp.map(x=>x.houses));gp.forEach(p=>{if(p.houses===m)actualBuildable.push(p);});}}
    actualBuildable.sort((a,b)=>a.houses-b.houses||a.id-b.id);
    DOMElements.buildHouseBtn.style.display=actualBuildable.length>0?'inline-block':'none';
    DOMElements.buildHouseBtn.onclick=actualBuildable.length>0?()=>showBuildHouseDialog(player,actualBuildable):null;

    const mortgagable = getPlayerOwnedProperties(player,null,true).filter(p=>{if(p.mortgaged)return false;if(p.type==='location'){const groupHasHouses=getPropertiesByColor(p.colorGroup).some(gp=>gp.owner===player.id&&gp.houses>0);return !groupHasHouses;}return true;});
    populateSelect(DOMElements.mortgageSelect,mortgagable,'Mortgage');
    DOMElements.mortgageSelect.style.display=mortgagable.length>0?'block':'none';
    DOMElements.mortgagePropertyBtn.style.display=mortgagable.length>0?'inline-block':'none';
    DOMElements.mortgagePropertyBtn.disabled=true;

    const unmortgagable=getPlayerOwnedProperties(player,null,true).filter(p=>p.mortgaged&&player.money>=Math.ceil(p.price/2*1.1));
    populateSelect(DOMElements.unmortgageSelect,unmortgagable,'Unmortgage');
    DOMElements.unmortgageSelect.style.display=unmortgagable.length>0?'block':'none';
    DOMElements.unmortgagePropertyBtn.style.display=unmortgagable.length>0?'inline-block':'none';
    DOMElements.unmortgagePropertyBtn.disabled=true;

    const sellable=getPlayerOwnedProperties(player,'location',true).filter(p=>p.houses>0);
    let actualSellable=[];if(sellable.length>0){const g={};sellable.forEach(p=>{if(!g[p.colorGroup])g[p.colorGroup]=[];g[p.colorGroup].push(p);});for(const c in g){const gp=g[c];const m=Math.max(...gp.map(x=>x.houses));gp.forEach(p=>{if(p.houses===m)actualSellable.push(p);});}}
    actualSellable.sort((a,b)=>b.houses-a.houses||a.id-b.id);
    populateSelect(DOMElements.sellHouseSelect,actualSellable,'Sell Dwelling');
    DOMElements.sellHouseSelect.style.display=actualSellable.length>0?'block':'none';
    DOMElements.sellHouseBtn.style.display=actualSellable.length>0?'inline-block':'none';
    DOMElements.sellHouseBtn.disabled=true;

    if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display=(DOMElements.buildHouseBtn.style.display!=='none'||DOMElements.mortgagePropertyBtn.style.display!=='none'||DOMElements.unmortgagePropertyBtn.style.display!=='none'||DOMElements.sellHouseBtn.style.display!=='none')?'flex':'none';
}

function populateSelect(select,props,text){ /* ... as before ... */
    select.innerHTML=`<option value="">-- ${text} --</option>`;props.forEach(p=>{const o=document.createElement('option');o.value=p.id;let t=p.name;if(p.mortgaged)t+=' (M)';if(p.type==='location'&&p.houses>0)t+=` (D:${p.houses===5?'F':p.houses})`;if(select===DOMElements.unmortgageSelect&&p.mortgaged)t+=` Cost:₡${Math.ceil(p.price/2*1.1)}`;o.textContent=t;select.appendChild(o);});select.disabled=props.length===0;const btn=({[DOMElements.mortgageSelect.id]:DOMElements.mortgagePropertyBtn,[DOMElements.unmortgageSelect.id]:DOMElements.unmortgagePropertyBtn,[DOMElements.sellHouseSelect.id]:DOMElements.sellHouseBtn})[select.id];if(btn){btn.disabled=true;select.onchange=()=>btn.disabled=!select.value;}}


function showBuildHouseDialog(player, props){ /* ... as before ... calls showPropertyManagementActions & setControls */
    const ex=DOMElements.propertyActionsDiv.querySelector('.build-house-dialog');if(ex)ex.remove();const d=document.createElement('div');d.className='build-house-dialog';d.style.marginTop='10px';d.innerHTML=`<p>Build on:</p><select id="bld-sel" class="action-select" style="margin-bottom:5px;"></select><button id="conf-bld" class="button-group button" style="width:auto;padding:5px 10px;">Build</button><button id="canc-bld" class="button-group button" style="width:auto;padding:5px 10px;background-color:#6c757d;">Cancel</button>`;const s=d.querySelector('#bld-sel'),c=d.querySelector('#conf-bld'),n=d.querySelector('#canc-bld');props.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=`${p.name}(D:${p.houses===5?'F':p.houses}) Cost:₡${p.houseCost}`;s.appendChild(o);});if(props.length>0)s.value=props[0].id;c.disabled=props.length===0;DOMElements.propertyActionsDiv.appendChild(d);DOMElements.buildHouseBtn.style.display='none';c.onclick=()=>{const pId=parseInt(s.value),p=board.find(x=>x.id===pId);if(!p||p.owner!==player.id||player.money<p.houseCost||p.houses>=5||p.mortgaged){logMessage("Cannot build.","error");return;}const grp=getPropertiesByColor(p.colorGroup).filter(x=>x.owner===player.id),minH=Math.min(...grp.map(x=>x.houses));if(p.houses>minH&&checkMonopoly(player,p.colorGroup)){logMessage(`Build evenly on '${grp.find(x=>x.houses===minH).name}'.`,"error");return;}player.money-=p.houseCost;p.houses++;logMessage(`${player.name} built on ${p.name}. D:${p.houses}.`,'info');updatePlayerInfo();updateBoardUI();d.remove();showPropertyManagementActions(player);setControls();};n.onclick=()=>{d.remove();DOMElements.buildHouseBtn.style.display='inline-block';showPropertyManagementActions(player);setControls();};
}

export function mortgageProperty(propId){ /* ... as before ... calls showPropertyManagementActions & setControls */
    const p=state.players[state.currentPlayerIndex],prop=board.find(x=>x.id===propId);if(!prop||prop.owner!==p.id||prop.mortgaged){logMessage(`Cannot mortgage ${prop?prop.name:'it'}.`,'error');}else if(prop.type==='location'&&getPropertiesByColor(prop.colorGroup).some(x=>x.owner===p.id&&x.houses>0)){logMessage(`Sell Dwellings in ${prop.colorGroup} sector first.`,'error');}else{prop.mortgaged=true;p.money+=prop.price/2;logMessage(`${p.name} mortgaged ${prop.name} for ₡${prop.price/2}.`,'info');updatePlayerInfo();updateBoardUI();}showPropertyManagementActions(p);setControls();
}
export function unmortgageProperty(propId){ /* ... as before ... calls showPropertyManagementActions & setControls */
    const p=state.players[state.currentPlayerIndex],prop=board.find(x=>x.id===propId);if(!prop){logMessage("Not found.","error");return;}const cost=Math.ceil(prop.price/2*1.1);if(prop.owner===p.id&&prop.mortgaged&&p.money>=cost){prop.mortgaged=false;p.money-=cost;logMessage(`${p.name} unmortgaged ${prop.name} for ₡${cost}.`,'info');updatePlayerInfo();updateBoardUI();}else{logMessage(`Cannot unmortgage ${prop.name}.`,'error');}showPropertyManagementActions(p);setControls();
}
export function sellHouse(propId){ /* ... as before ... calls showPropertyManagementActions & setControls */
    const p=state.players[state.currentPlayerIndex],prop=board.find(x=>x.id===propId);if(!prop||prop.type!=='location'||prop.owner!==p.id||prop.houses===0){logMessage(`Cannot sell on ${prop?prop.name:'it'}.`,'error');}else{const grp=getPropertiesByColor(prop.colorGroup).filter(x=>x.owner===p.id),maxH=Math.max(...grp.map(x=>x.houses));if(prop.houses<maxH&&checkMonopoly(p,prop.colorGroup)){logMessage(`Sell Dwellings evenly in ${prop.colorGroup} sector.`,"error");}else{prop.houses--;p.money+=prop.houseCost/2;logMessage(`${p.name} sold on ${prop.name}. D:${prop.houses}.`,'info');updatePlayerInfo();updateBoardUI();}}showPropertyManagementActions(p);setControls();
}

export function payBail(){ /* ... as before ... calls setControlsForTurnStart */
    const p=state.players[state.currentPlayerIndex];if(p.inJail&&p.money>=50){p.money-=50;p.inJail=false;p.jailTurns=0;logMessage(`${p.name} paid bail.`,'success');updatePlayerInfo();setControlsForTurnStart();}else{logMessage("Cannot pay bail.","error");}
}
export function useJailCard(){ /* ... as before ... calls setControlsForTurnStart */
    const p=state.players[state.currentPlayerIndex];if(p.inJail&&p.getOutOfJailFreeCards>0){p.getOutOfJailFreeCards--;p.inJail=false;p.jailTurns=0;logMessage(`${p.name} used card.`,'success');updatePlayerInfo();setControlsForTurnStart();}else{logMessage("No card or not in Detention.","error");}
}

// MODIFIED: Simplified setControls and setControlsForTurnStart
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

    // Default button states
    let canRoll = false;
    let canEndTurn = false;
    let canTrade = false;
    let showJailActions = false;

    if (player.inJail) {
        showJailActions = true;
        if(DOMElements.payBailBtn) DOMElements.payBailBtn.disabled = player.money < 50;
        if(DOMElements.useJailCardBtn) DOMElements.useJailCardBtn.disabled = player.getOutOfJailFreeCards === 0;

        if (!player.hasRolled) { // Hasn't attempted to roll out this turn
            canRoll = true;
             if (player.jailTurns >= 3) { // Forced action on 3rd turn
                canRoll = false; // Cannot roll, must pay or use card
                if (DOMElements.payBailBtn.disabled && DOMElements.useJailCardBtn.disabled) {
                    handleBankruptcy(player, 'bank', 50); // Auto-bankrupt if no other option
                    // If bankrupt, game might end or turn passes, so controls will be re-evaluated
                    return; // Stop further control setting for this player this turn
                }
            }
        } else { // Already rolled (and failed to get doubles)
            canEndTurn = true; // Can only end turn or pay/use card
        }
        if(DOMElements.propertyActionsDiv) DOMElements.propertyActionsDiv.style.display = 'none'; // No property actions in jail
    } else { // Not in jail
        canTrade = true; // Can generally trade if not in jail
        showPropertyManagementActions(player); // Show property options

        if (!player.hasRolled) {
            canRoll = true;
        } else { // Has rolled
            if (player.doublesRolledThisTurn > 0 && player.doublesRolledThisTurn < 3) {
                canRoll = true; // Can roll again
            } else {
                canEndTurn = true; // Normal roll, or 3rd double (which calls sendToJail, then setControls)
            }
        }
        if (state.currentActionPending === 'buy') {
            showBuyPropertyAction(player, board[player.position]);
            // Property actions div will be managed by showBuyPropertyAction and showPropertyManagementActions
        }
    }

    DOMElements.rollDiceBtn.disabled = !canRoll;
    DOMElements.endTurnBtn.disabled = !canEndTurn;
    DOMElements.proposeTradeBtn.disabled = !canTrade;
    if(DOMElements.jailActionsDiv) DOMElements.jailActionsDiv.style.display = showJailActions ? 'flex' : 'none';

    // Auction/Trade overrides
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
    updatePlayerInfo(); // Update for the new current player
    setControls();      // Call the main setControls logic
}

export function endTurn() {
    if (state.isAuctionActive || state.isTradeActive || state.gameOver) return;
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer) { checkWinCondition(); return; }

    if (state.currentActionPending === 'buy' && board[currentPlayer.position].owner === null) {
        const spaceToAuction = board[currentPlayer.position];
        logMessage(`${currentPlayer.name} declined to buy ${spaceToAuction.name}. Auctioning.`);
        startAuction(spaceToAuction.id); return;
    }
    logMessage(`${currentPlayer.name}'s turn ended.`);
    currentPlayer.doublesRolledThisTurn = 0; // Reset for their next turn

    if (state.players.length <= 1) { checkWinCondition(); return; }

    let nextPlayerIndex = state.currentPlayerIndex;
    let attempts = 0;
    do {
        nextPlayerIndex = (nextPlayerIndex + 1) % state.players.length; attempts++;
        if (attempts > state.players.length + 1 && state.players.length > 1) {
            logMessage("Error finding next player. Game may be stuck.", "error");
            // Potentially force game over or pick first available player
            const firstAvailable = state.players.findIndex(p => p.money >=0);
            if(firstAvailable !== -1) state.currentPlayerIndex = firstAvailable;
            else { state.gameOver = true; checkWinCondition(); return;}
            break;
        }
    } while (state.players[nextPlayerIndex].money < 0 && state.players.length > 1);

    state.currentPlayerIndex = nextPlayerIndex;
    setControlsForTurnStart(); // This sets up for the new player
}

// Auction and Trade logic largely unchanged, ensure they call setControls or setControlsForTurnStart on completion.
function showAuctionMessage(message) { DOMElements.auctionMessageArea.textContent = message; }
function startAuction(propId) { /* ... as before ... */ updateAuctionUI(); }
function updateAuctionUI() { /* ... as before ... */ }
export function handlePlaceBid() { /* ... as before ... */ nextBidder(); }
export function handlePass() { /* ... as before ... if auction ends, call endAuction ... else updateAuctionUI */ }
function nextBidder() { /* ... as before ... if auction ends, call endAuction ... else updateAuctionUI */ }
function endAuction() { /* ... as before ... AT THE END, call setControls(); updatePlayerInfo(); updateBoardUI(); */
    const property = board.find(p => p.id === state.auctionPropertyId);
    if (state.highestBidderId !== null) { const winner = state.players.find(p => p.id === state.highestBidderId); if (winner && winner.money >= state.currentBid) { logMessage(`${winner.name} wins auction for ${property.name} (₡${state.currentBid}).`, 'success'); winner.money -= state.currentBid; property.owner = winner.id; } else { property.owner = null; logMessage(`Auction for ${property.name} ended. Bidder issue. Unowned.`, 'info');}} else { property.owner = null; logMessage(`No bids for ${property.name}. Unowned.`, 'info');}
    state.isAuctionActive = false; state.auctionPropertyId = null; state.auctionBidders = []; document.body.classList.remove('auction-active'); DOMElements.auctionModalOverlay.style.display = 'none';
    state.currentActionPending = null; // Player who's turn it was might not be winner
    setControls(); updatePlayerInfo(); updateBoardUI(); // Re-evaluate controls for current player
}

function showTradeMessage(message) { DOMElements.tradeMessageArea.textContent = message; }
export function showTradeModal() { /* ... as before ... */ }
export function updateTradeModalAssets() { /* ... as before ... */ }
export function handleSendProposal() { /* ... as before ... */ }
function showTradeReviewModal() { /* ... as before ... */ }
export function handleAcceptTrade() { /* ... as before ... AT THE END call endTrade(); */ }
export function handleRejectTrade() { /* ... as before ... AT THE END call endTrade(); */ }
export function endTrade() { /* ... as before ... AT THE END call setControls(); */
    state.isTradeActive = false; state.tradePartnerId = null; state.tradeOffer = {}; state.tradeRequest = {};
    document.body.classList.remove('trade-active'); DOMElements.tradeModalOverlay.style.display = 'none'; DOMElements.tradeReviewModalOverlay.style.display = 'none';
    updatePlayerInfo(); updateBoardUI(); setControls();
}

// Debug Logic (unchanged)
export function debugMovePlayer() { /* ... */ landOnSpace(player); }
export function debugSimulateRoll() { /* ... */ rollDice(die1, die2); }
export function debugChangeOwner() { /* ... */ updatePlayerInfo(); updateBoardUI(); }
export function debugSetHouses() { /* ... */ updatePlayerInfo(); updateBoardUI(); }
export function debugSetMoney() { /* ... */ updatePlayerInfo(); }
export function debugSendToJail() { /* ... */ sendToJail(player); }