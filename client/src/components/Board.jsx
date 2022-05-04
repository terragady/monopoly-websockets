import React, {
  useState,
  useEffect,
  useContext,
  useReducer,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import './style/Board.css';
import stateContext from '../internal';
import Tile from './Tile';
import initialState from './BoardInitState';
import Dice from './Dice';
import Log from './Log';
import Dashboard from './Dashboard';
import cardFlipContext from '../cardFlipContext';
import sellPromptContext from '../sellPromptContext';
import backOfCards from './backOfCards';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FLIP_CARD':
      return [...action.payload];
    default:
      return state;
  }
};


function Board() {
  const [cardsBack, dispatch] = useReducer(reducer, backOfCards);
  const { socketFunctions, playerId } = useContext(stateContext);

  const [tiles] = useState(initialState);
  const [openSale, setOpenSale] = useState(false);
  const [privateSale, setPrivateSale] = useState(false);
  
  useEffect(() => {
    let playerName = '';
    while (!playerName) playerName = prompt('What is your name?');
    socketFunctions.newPlayer(playerName);
  }, [socketFunctions]);

  const handlePutOpenMarket = tileID => {
    setOpenSale({ tileID, playerId });
  };

  const handleMakeOffer = tileID => {
    setPrivateSale({ tileID, playerId });
  };

  return (
    <sellPromptContext.Provider value={{
      handlePutOpenMarket,
      handleMakeOffer,
      openSale,
      setOpenSale,
      setPrivateSale,
      privateSale,
    }}
    >
      <cardFlipContext.Provider value={{ cardsBack, dispatch }}>
        <section className="Board">
          {
            tiles.map((tile, index) => {
              if (index === 0) {
                return <Tile key={uuidv4()} position="tile__start" id={index} initState={tile} />;
              }
              if (index > 0 && index <= 10) {
                return <Tile key={uuidv4()} position="tile__horizontal--bottom" id={index} initState={tile} />;
              }
              if (index >= 11 && index <= 19) {
                return <Tile key={uuidv4()} position="tile__vertical--left" id={index} initState={tile} />;
              }
              if (index >= 20 && index <= 30) {
                return <Tile key={uuidv4()} position="tile__horizontal--top" id={index} initState={tile} />;
              }
              if (index >= 31 && index <= 39) {
                return <Tile key={uuidv4()} position="tile__vertical--right" id={index} initState={tile} />;
              }
              return <></>;
            })
          }
          <section className="center">
            <Dice />
            <Log />
            <Dashboard />
          </section>

        </section>
      </cardFlipContext.Provider>
    </sellPromptContext.Provider>
  );
}

export default Board;
