import React, { useState, useContext, useEffect } from 'react';
import cardFlipContext from '../cardFlipContext';
import stateContext from '../internal';
import sellPromptContext from '../sellPromptContext';
import './style/BackOfCard.css';

const BackOfCard = ({ id, handleCardClick, position }) => {
  const { cardsBack } = useContext(cardFlipContext);
  const [backOfCard] = useState(cardsBack[id]);
  const [ownership, setOwnership] = useState(false);
  const { state, playerId } = useContext(stateContext);
  const { handlePutOpenMarket, handleMakeOffer } = useContext(sellPromptContext);

  useEffect(() => {
    if (Object.prototype.hasOwnProperty.call(state.boardState.ownedProps, id)) {
      setOwnership(state.boardState.ownedProps[id].id);
    } else {
      setOwnership(false);
    }
  },[state.boardState.ownedProps, id]);

  return (
    <div className="tile-back--container">
      <article role="presentation" onClick={handleCardClick} className={`Tile-back tile-back__${position}`}>
        <p className="tile-back__name" style={backOfCard.color ? { backgroundColor: backOfCard.color } : { backgroundColor: 'none' }}>{backOfCard.cardName}</p>
        <section className="tile-back__prices">
          <p className="tile-back__price">{backOfCard.price ? `Price: $${backOfCard.price}` : ''}</p>
          <p className="tile-back__rent">{backOfCard.rent ? `Rent: $${backOfCard.rent}` : ''}</p>
        </section>
        <p className="tile-back__line" />
        <section className="tile-back__details--wrapper">
          <p className="tile-back__details">{backOfCard.details1 && backOfCard.details1.includes('$') ? `${backOfCard.details1.split('$')[0]}` : backOfCard.details1}</p>
          <span className="tile-back__details--price">{backOfCard.details1 && backOfCard.details1.includes('$') ? `$${backOfCard.details1.split('$')[1]}` : ''}</span>
        </section>
        <section className="tile-back__details--wrapper">
          <p className="tile-back__details">{backOfCard.details2 && backOfCard.details2.includes('$') ? `${backOfCard.details2.split('$')[0]}` : backOfCard.details2}</p>
          <span className="tile-back__details--price">{backOfCard.details2 && backOfCard.details2.includes('$') ? `$${backOfCard.details2.split('$')[1]}` : ''}</span>
        </section>
        <section className="tile-back__details--wrapper">
          <p className="tile-back__details">{backOfCard.details3 ? `${backOfCard.details3.split('$')[0]}` : ''}</p>
          <span className="tile-back__details--price">{backOfCard.details3 ? `$${backOfCard.details3.split('$')[1]}` : ''}</span>
        </section>
        <section className="tile-back__details--wrapper">
          <p className="tile-back__details">{backOfCard.details4 ? `${backOfCard.details4.split('$')[0]}` : ''}</p>
          <span className="tile-back__details--price">{backOfCard.details4 ? `$${backOfCard.details4.split('$')[1]}` : ''}</span>
        </section>
        {ownership
          ? ownership !== playerId
            ? (
              <section className="tile-back__buttons">
                <button onClick={e => { e.stopPropagation(); handleMakeOffer(id); }} className="tile-back__button">Make offer</button>
              </section>
            )
            : (
              <section className="tile-back__buttons">
                <button onClick={e => { e.stopPropagation(); handlePutOpenMarket(id); }} className="tile-back__button">Sell</button>
              </section>
            )
          : <></>}
      </article>
    </div>
  );
};

export default BackOfCard;
