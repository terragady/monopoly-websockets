const express = require('express');
const app = express();
const server = require('http').createServer(app);
const path = require('path');
const socketIO = require('socket.io');
const tileState = require('./tileState');
const chestCards = require('./chestCards');

const io = socketIO(server, { cors: { origin: 'http://localhost:3000' } });
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client', 'build')));
  app.get('/', (req, res) => {
    res.sendFile(`${__dirname}client/build/index.html`);
  });
}

// io.emit is to everyone
// socket.broadcast.emit is to everyone except sender

const state = {
  boardState: {
    gameStarted: false,
    players: [],
    finishedPlayers: {},
    currentPlayer: {
      id: '',
      hasMoved: false,
    },
    logs: [],
    diceValue: { dice1: ['⚅', 0], dice2: ['⚅', 0] },
    ownedProps: {
      42: {
        id: '',
        color: 'blue',
      },
    },
    openMarket: {},
  },
  players: {},
  turnInfo: {},
  loaded: true,
};

/// ///////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////FUNCTIONS///////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////

// current date function for logs
const date = () => new Date(Date.now()).toLocaleTimeString('en-GB', { hour12: false });

// Log a message
const sendToLog = (text) => {
  state.boardState.logs = [...state.boardState.logs, `${date()} - ${text}`];
};

// check balance if not below 0
const checkBalance = (noNextTurn) => {
  Object.keys(state.players).forEach((e) => {
    if (state.players[e].accountBalance < 1) {
      state.boardState.finishedPlayers[e] = {
        name: state.players[e].name,
        color: state.players[e].color,
      };
      sendToLog(
        `<span class="bancrupt-message">${state.players[e].name} went bancrupt and can no longer play the game, all his properties were put on sale again!</span>`
      );
      delete state.players[e];
      if (e === state.boardState.currentPlayer.id) {
        const currentPlayer = state.boardState.currentPlayer.id;
        const indexOfCurrentPlayer = state.boardState.players.indexOf(currentPlayer);
        if (indexOfCurrentPlayer > 0) {
          state.boardState.currentPlayer.id = state.boardState.players[indexOfCurrentPlayer - 1];
        } else {
          const playersLength = state.boardState.players;
          state.boardState.currentPlayer.id = state.boardState.players[playersLength.length - 1];
        }
        const { hasMoved } = state.boardState.currentPlayer;
        if (hasMoved) state.boardState.currentPlayer.hasMoved = false;
      }
      state.boardState.players = Object.keys(state.players);
      if (noNextTurn) nextTurn();
      for (let i = 0; i < 40; i++) {
        if (state.boardState.ownedProps[i] && state.boardState.ownedProps[i].id === e) {
          delete state.boardState.ownedProps[i];
        }
        if (state.boardState.openMarket[i] && state.boardState.openMarket[i].seller === e) {
          delete state.boardState.openMarket[i];
        }
      }
    }
  });
};

// player change
const nextTurn = () => {
  // remove player when less than 0 balance
  checkBalance();

  // next turn
  if (state.boardState.players.includes(state.boardState.currentPlayer.id) === -1) {
    state.boardState.currentPlayer.id = state.boardState.players[0] || 0;
  }
  const numberOfPlayers = state.boardState.players.length;
  const currentPlayerIndex = state.boardState.players.indexOf(state.boardState.currentPlayer.id);
  if (currentPlayerIndex + 1 < numberOfPlayers) {
    state.boardState.currentPlayer.id = state.boardState.players[currentPlayerIndex + 1];
  } else {
    const firstPlayer = state.boardState.players[0];
    state.boardState.currentPlayer.id = firstPlayer;
  }
  state.turnInfo = {};
};

// Check if property is owned and pay accordingly
const checkOwned = (playerId, currentTile, callback) => {
  if (!Object.prototype.hasOwnProperty.call(state.boardState.ownedProps, currentTile)) {
    state.turnInfo.canBuyProp = true;
  } else if (state.boardState.ownedProps[currentTile].id !== playerId) {
    callback();
    nextTurn();
  } else {
    nextTurn();
  }
};

// color array for players
const colors = ['black', 'white', 'orange', 'red', 'blue', 'green', 'yellow'];

/// /////////////////////////////////////////////////////////////////////////////////////////
/// ///////////SOCKET FUNCTIONS////////////////////////;/////////////////////////////////////
/// /////////////////////////////////////////////////////////////////////////////////////////

// On client connection
io.on('connection', (socket) => {
  socket.emit('update', state);

  // when a new player enters
  socket.on('new player', (newName) => {
    const { id } = socket;
    if (!state.boardState.gameStarted) {
      state.players[id] = {
        name: newName,
        currentTile: 0,
        color: colors.pop(),
        accountBalance: 1500,
        isJail: false,
        jailRounds: 0,
      };
      sendToLog(`${newName} joined the game as ${state.players[socket.id].color}`);
      state.boardState.players = Object.keys(state.players);
    } else {
      sendToLog(`${newName}, game has already started, you are not able to join!`);
    }
    io.emit('update', state);
  });

  // start game
  socket.on('start game', (newName) => {
    state.boardState.gameStarted = true;
    sendToLog('The Game has started!!! Good luck players!');
    nextTurn();
    io.emit('update', state);
  });

  // move when dice is rolled
  socket.on('makeMove', (num) => {
    const { id } = socket;
    const cTile = state.players[id].currentTile;
    if (cTile + num < 40) {
      state.players[id].currentTile = cTile + num;
    } else {
      const left = 40 - cTile;
      const more = num - left;
      state.players[id].currentTile = more;
      state.players[id].accountBalance += 200;
      sendToLog(`${state.players[socket.id].name} has passed start and recieved $200M`);
    }
    io.emit('update', state);
  });

  // send chat
  socket.on('send chat', (message) => {
    if (state.boardState.players.includes(socket.id)) {
      sendToLog(
        `<span style="color:${state.players[socket.id].color}" class="log-chat-name" >${
          state.players[socket.id].name
        }</span> says: ${message}`
      );
    } else if (state.boardState.finishedPlayers[socket.id]) {
      sendToLog(
        `<span style="color:${state.boardState.finishedPlayers[socket.id].color}" class="log-chat-name" >${
          state.boardState.finishedPlayers[socket.id].name
        }</span> says: ${message}`
      );
    } else {
      sendToLog(`<span style="color:grey" class="log-chat-name">Spectator</span> says: ${message}`);
    }
    io.emit('update', state);
  });

  // next turn
  socket.on('end turn', () => {
    nextTurn();
    state.boardState.currentPlayer.hasMoved = false; // move to function?
    io.emit('update', state);
  });

  // hasMoved
  socket.on('player has moved', (bool) => {
    state.boardState.currentPlayer.hasMoved = bool;
    const { currentTile } = state.players[socket.id];
    const railRoadArray = [5, 15, 25, 35];
    const { dice1, dice2 } = state.boardState.diceValue;
    const diceResult = dice1[1] + dice2[1];
    const playerName = state.players[socket.id].name;

    switch (tileState[currentTile].tileType) {
      case 'normal':
        checkOwned(socket.id, currentTile, () => {
          const currentTileOwner = state.boardState.ownedProps[currentTile].id;
          state.players[socket.id].accountBalance -= tileState[currentTile].rent;
          state.players[currentTileOwner].accountBalance += tileState[currentTile].rent;
          sendToLog(
            `${playerName} have paid rent $${tileState[currentTile].rent}M to ${
              state.players[state.boardState.ownedProps[currentTile].id].name
            }`
          );
        });
        break;
      case 'expense':
        state.players[socket.id].accountBalance -= tileState[currentTile].rent;
        sendToLog(`${playerName} paid ${tileState[currentTile].rent} in taxes.`);
        nextTurn();
        break;
      case 'railroad': {
        checkOwned(socket.id, currentTile, () => {
          let ownedRailroads = 0;
          railRoadArray.forEach((tileNumb) => {
            if (
              state.boardState.ownedProps[tileNumb] &&
              state.boardState.ownedProps[tileNumb].id === state.boardState.ownedProps[currentTile].id
            ) {
              ownedRailroads += 1;
            }
          });
          const priceToPay = 25 * 2 ** (ownedRailroads - 1);
          state.players[socket.id].accountBalance -= priceToPay;
          state.players[state.boardState.ownedProps[currentTile].id].accountBalance += priceToPay;
          if (ownedRailroads > 1) {
            sendToLog(
              `${playerName} have paid rent $${priceToPay}M for ${ownedRailroads} owned railroads to ${
                state.players[state.boardState.ownedProps[currentTile].id].name
              }`
            );
          } else {
            sendToLog(`${playerName} have paid rent $${priceToPay}M to ${state.players[state.boardState.ownedProps[currentTile].id].name}`);
          }
        });
        break;
      }
      case 'gojail':
        state.players[socket.id].isJail = true;
        state.players[socket.id].jailRounds = 0;
        state.players[socket.id].currentTile = 10;
        sendToLog(`${playerName} was sent to jail for tax fraud.`);
        nextTurn();
        break;
      case 'jail':
        sendToLog(`${playerName}, dont't worry! You're just visiting.`);
        nextTurn();
        break;
      case 'company': {
        checkOwned(socket.id, currentTile, () => {
          let priceToPay = 0;
          if (
            state.boardState.ownedProps[12] &&
            state.boardState.ownedProps[28] &&
            state.boardState.ownedProps[12].id === state.boardState.ownedProps[currentTile].id &&
            state.boardState.ownedProps[28].id === state.boardState.ownedProps[currentTile].id
          ) {
            priceToPay = diceResult * 10;
          } else {
            priceToPay = diceResult * 4;
          }
          state.players[socket.id].accountBalance -= priceToPay;
          state.players[state.boardState.ownedProps[currentTile].id].accountBalance += priceToPay;
          sendToLog(`${playerName} have paid rent $${priceToPay}M to ${state.players[state.boardState.ownedProps[currentTile].id].name}`);
        });
        break;
      }
      case 'chance': {
        const randomNumber = Math.floor(Math.random() * chestCards.length);
        const chestCard = chestCards[randomNumber];
        state.players[socket.id].accountBalance += chestCard.reward;
        state.players[socket.id].accountBalance -= chestCard.penalty;
        if (chestCard.moveToTile > 0) state.players[socket.id].currentTile = chestCard.moveToTile;

        if (chestCard.moveToTile === 10) {
          state.players[socket.id].isJail = true;
        }
        sendToLog(`${playerName}: ${chestCard.message}`);
        nextTurn();
        break;
      }
      case 'chest': {
        const randomNumber = Math.floor(Math.random() * chestCards.length);
        const chestCard = chestCards[randomNumber];
        state.players[socket.id].accountBalance += chestCard.reward;
        state.players[socket.id].accountBalance -= chestCard.penalty;
        if (chestCard.moveToTile > 0) state.players[socket.id].currentTile = chestCard.moveToTile;

        if (chestCard.moveToTile === 10) {
          state.players[socket.id].isJail = true;
        }
        sendToLog(`${playerName}: ${chestCard.message}`);
        nextTurn();
        break;
      }
      default:
        nextTurn();
        break;
    }
    io.emit('update', state);
  });

  // buy property
  socket.on('buy property', () => {
    const { accountBalance } = state.players[socket.id];
    const { currentTile } = state.players[socket.id];
    const playerName = state.players[socket.id].name;
    state.players[socket.id].accountBalance = accountBalance - tileState[currentTile].price;
    state.boardState.ownedProps[currentTile] = {
      id: socket.id,
      color: state.players[socket.id].color,
    };
    sendToLog(`${playerName} bought a property!`);
    nextTurn();
    io.emit('update', state);
  });

  // update dice state
  socket.on('send dice', (dices) => {
    state.boardState.diceValue = dices;
    const diceResult = dices.dice1[1] + dices.dice2[1];
    const playerName = state.players[socket.id].name;
    sendToLog(`${playerName} rolled ${diceResult}!`);
    io.emit('update', state);
  });

  socket.on('in jail', (dices) => {
    const { jailRounds } = state.players[socket.id];
    const { currentTile } = state.players[socket.id];
    const playerName = state.players[socket.id].name;
    const diceResult = dices.dice1[1] + dices.dice2[1];
    if (jailRounds === 2) {
      state.players[socket.id].currentTile = currentTile + diceResult;
      state.players[socket.id].isJail = false;
      state.players[socket.id].jailRounds = 0;
      state.boardState.currentPlayer.hasMoved = true;
      sendToLog(`${playerName} waited patiently and got out of jail.`);
    } else if (dices.dice1[1] === dices.dice2[1]) {
      state.players[socket.id].currentTile = currentTile + diceResult;
      state.players[socket.id].isJail = false;
      state.players[socket.id].jailRounds = 0;
      sendToLog(`${playerName} got lucky and escaped jail!`);
    } else {
      state.players[socket.id].jailRounds += 1;
      sendToLog(`${playerName} has to stay in jail.`);
    }
    state.boardState.diceValue = dices;
    nextTurn();
    io.emit('update', state);
  });

  socket.on('put on open market', (saleInfo) => {
    const { tileID, playerId, price } = saleInfo;
    const tileName = tileState[tileID].streetName;
    const sellerName = state.players[playerId].name;
    state.boardState.openMarket[tileID] = {
      seller: playerId,
      price,
      sellerName,
      tileName,
    };
    console.log(state.boardState.openMarket);
    io.emit('update', state);
  });

  socket.on('remove sale', (item) => {
    const { tileName } = state.boardState.openMarket[item];
    delete state.boardState.openMarket[item];
    const playerName = state.players[socket.id].name;
    sendToLog(`${playerName} removed ${tileName} from the open market.`);
    io.emit('update', state);
  });

  socket.on('make sale', (item) => {
    const { seller } = state.boardState.openMarket[item];
    const { price } = state.boardState.openMarket[item];
    const { sellerName } = state.boardState.openMarket[item];
    const { tileName } = state.boardState.openMarket[item];
    const buyerName = state.players[socket.id].name;
    state.players[seller].accountBalance += price;
    state.players[socket.id].accountBalance -= price;
    state.boardState.ownedProps[item].id = socket.id;
    state.boardState.ownedProps[item].color = state.players[socket.id].color;
    delete state.boardState.openMarket[item];
    sendToLog(`${buyerName} has bought ${tileName} from ${sellerName}`);
    checkBalance(true);
    io.emit('update', state);
  });
  socket.on('make offer', (item) => {
    const { playerId, tileID } = item;
    const buyerName = state.players[playerId].name;
    const tileOwner = state.boardState.ownedProps[item.tileID].id;
    const tileName = tileState[tileID].streetName;
    io.sockets.to(tileOwner).emit('offer on prop', { ...item, buyerName, tileName });
  });

  socket.on('decline offer', (offer) => {
    const { playerId, tileID, price, tileName } = offer;
    const ownerID = state.boardState.ownedProps[tileID].id;
    const ownerName = state.players[ownerID].name;
    io.sockets.to(playerId).emit('offer declined', { tileName, price, ownerName });
  });

  socket.on('accept offer', (offer) => {
    const { playerId, tileID, price, tileName } = offer;
    const ownerID = state.boardState.ownedProps[tileID].id;
    const ownerName = state.players[ownerID].name;
    state.players[ownerID].accountBalance += price;
    state.players[playerId].accountBalance -= price;
    state.boardState.ownedProps[tileID].id = playerId;
    state.boardState.ownedProps[tileID].color = state.players[playerId].color;
    sendToLog(`${ownerName} has privately bought ${tileName} from ${ownerName} from $${price}M`);
    io.sockets.to(playerId).emit('offer accepted', { tileName, price, ownerName });

    if (state.boardState.openMarket[tileID]) delete state.boardState.openMarket[tileID];
    checkBalance(true);
    io.emit('update', state);
  });

  // when player disconnects
  socket.on('disconnect', () => {
    if (state.players[socket.id]) {
      const playerName = state.players[socket.id].name;
      colors.push(state.players[socket.id].color);
      sendToLog(`${playerName} left the game.`);
      delete state.players[socket.id];
      for (let i = 0; i < 40; i++) {
        if (state.boardState.ownedProps[i] && state.boardState.ownedProps[i].id === socket.id) {
          delete state.boardState.ownedProps[i];
        }
        if (state.boardState.openMarket[i] && state.boardState.openMarket[i].seller === socket.id) {
          delete state.boardState.openMarket[i];
        }
      }
    }
    if (state.boardState.finishedPlayers[socket.id]) {
      colors.push(state.boardState.finishedPlayers[socket.id].color);
      delete state.boardState.finishedPlayers[socket.id];
    }
    state.boardState.players = Object.keys(state.players);

    // remove stuff when no players present
    if (state.boardState.players.length === 0) {
      state.boardState.logs = [];
      state.boardState.ownedProps = {};
      state.turnInfo = {};
      state.boardState.openMarket = {};
      state.boardState.finishedPlayers = {};
      state.boardState.gameStarted = false;
    }
    console.log(colors);
    io.emit('update', state);
  });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => console.log(`Server is running on ${PORT}`));
