import React, {
  useEffect, useReducer, useState,
} from 'react';
import io from 'socket.io-client';
import Board from './components/Board';
import stateContext from './internal';

const url = window.location.hostname === 'localhost' ? 'http://localhost:8080' : window.location.origin;

const socket = io(url);
const socketFunctions = {
  makeMove: num => socket.emit('makeMove', num),
  newPlayer: name => socket.emit('new player', name),
  toggleHasMoved: bool => socket.emit('player has moved', bool),
  endTurn: () => socket.emit('end turn', ''),
  sendDice: dices => socket.emit('send dice', dices),
  inJail: dices => socket.emit('in jail', dices),
  buyProperty: () => socket.emit('buy property', true),
  sendChat: message => socket.emit('send chat', message),
  putOpenMarket: saleInfo => socket.emit('put on open market', saleInfo),
  makeOffer: saleInfo => socket.emit('make offer', saleInfo),
  acceptOffer: offer => socket.emit('accept offer', offer),
  declineOffer: offer => socket.emit('decline offer', offer),
  makeSale: item => socket.emit('make sale', item),
  startGame: () => socket.emit('start game', ''),
  removeSale: item => socket.emit('remove sale', item),
};

const initialState = {
  boardState: {
    gameStarted: false,
    currentPlayer: {
      id: false,
    },
    finishedPlayers: {},
  },
  players: {},
  loaded: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'updateGameState':
      return { ...action.payload };
    default:
      return state;
  }
};

// TODO: make into function and export it as function ??

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [playerId, setPlayerId] = useState(false);

  if (!playerId) {
    socket.on('connect', () => {
      // setPlayerId(1);
      setPlayerId(socket.id);
    });
  }
  useEffect(() => {
    socket.on('update', newState => dispatch({ type: 'updateGameState', payload: newState }));
  }, []);

  return (
    <stateContext.Provider value={{
      state, socketFunctions, playerId, socket,
    }}
    >
      <main className="App">
        {/* {JSON.stringify(state)} */}
        <Board />
      </main>
    </stateContext.Provider>
  );
}
