import React, { useContext } from 'react';
import { v4 as uuid } from 'uuid';
import PropTypes from 'prop-types';
import './style/Board.css';
import stateContext from '../internal';
import BackOfCard from './BackOfCard';
import cardFlipContext from '../cardFlipContext';

function Tile({ initState, id, position }) {
  const { state } = useContext(stateContext);
  const { cardsBack, dispatch } = useContext(cardFlipContext);

  const handleCardClick = () => {
    // console.log(cardsBack.map((card, index) => index));
    const cardsFlipped = cardsBack.map((card, index) => {
      if (card.clicked) return { ...card, clicked: false };
      if (index === id) return { ...card, clicked: true };
      return card;
    });
    dispatch({ type: 'FLIP_CARD', payload: cardsFlipped });
  };

  if (!cardsBack[id].clicked) {
    return (
      <article role="presentation" onClick={handleCardClick} className={`Tile tile${id} ${position}`} id={id}>
        {initState.color && initState.color !== 'railroad'
          ? (
            <>
              <div
                className="tile__color-box"
                style={
                  state.loaded
                    && Object.prototype.hasOwnProperty.call(state.boardState.ownedProps, id)
                    ? { backgroundColor: initState.color, boxShadow: `0px 0px 1px 3px ${state.boardState.ownedProps[id].color}` }
                    : { backgroundColor: initState.color }
                }
              />
              <div className="tile__wrapper">
                <p className="tile__street-name">{initState.streetName}</p>
                <div className="player__token--wrapper">
                  {Object.keys(state.players).map(e => (
                    state.players[e].currentTile === id
                      ? <div key={uuid()} className="player__token" style={{ backgroundColor: state.players[e].color }} />
                      : <div key={uuid()} />
                  ))}
                </div>
                <p className="tile__price">{`$${initState.price}M`}</p>
              </div>
            </>
          )
          : (
            <div
              className="tile__special--wrapper"
              style={
                state.loaded
                  && Object.prototype.hasOwnProperty.call(state.boardState.ownedProps, id)
                  ? { boxShadow: `0px 0px 1px 3px ${state.boardState.ownedProps[id].color}` }
                  : {}
              }
            >
              <p className="tile__special-name">{initState.streetName}</p>
              <div className="player__token--wrapper">
                {Object.keys(state.players).map(e => (
                  state.players[e].currentTile === id
                    ? <div key={uuid()} className="player__token" style={{ backgroundColor: state.players[e].color }} />
                    : <div key={uuid()} />
                ))}
              </div>
              <p className="tile__special--price">{initState.price ? `$${initState.price}M` : ''}</p>
            </div>
          )}
      </article>
    );
  }
  return <BackOfCard id={id} handleCardClick={handleCardClick} position={position} />;
}

Tile.propTypes = {
  initState: PropTypes.instanceOf(Object).isRequired,
  id: PropTypes.number.isRequired,
  position: PropTypes.string.isRequired,
};

export default Tile;
