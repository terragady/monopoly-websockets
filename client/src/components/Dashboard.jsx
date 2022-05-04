import React, { useContext, useState, useEffect } from 'react';
import { useAlert } from 'react-alert';
import { v4 as uuid } from 'uuid';
import './style/Dashboard.css';
import MarketPlace from './MarketPlace';
import stateContext from '../internal';
import tileNames from './BoardInitState';
import sellPromptContext from '../sellPromptContext';

export default function Dashboard() {
  const {
    socketFunctions, state, playerId, socket,
  } = useContext(stateContext);
  const {
    openSale, setOpenSale, privateSale, setPrivateSale,
  } = useContext(sellPromptContext);
  const [priceInput, setPriceInput] = useState(false);
  const [offer, setOffer] = useState(false);
  const [offers, setOffers] = useState([]);
  const alert = useAlert();

  useEffect(() => {
    const interval = setInterval(() => {
      const ticked = offers.map(item => ({ ...item, timer: item.timer - 1 }))
        .filter(offer => offer.timer !== 0);
      setOffers(ticked);
    }, 1000);
    return () => clearInterval(interval);
  }, [offers]);

  useEffect(() => {
    socket.on('offer on prop', info => {
      setOffers([...offers, { ...info, timer: 20 }]);
    });

    socket.on('offer declined', info => {
      const { tileName, price, ownerName } = info;
      alert.show(`${ownerName} declined your offer to buy ${tileName} for $${price}M`);
    });

    socket.on('offer accepted', info => {
      const { tileName, price, ownerName } = info;
      alert.show(`${ownerName} accepted your offer to buy ${tileName} for $${price}M`);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAcceptOffer = offer => {
    const removedOffer = offers.filter(item => (
      item.tileID !== offer.tileID
    ));
    setOffers([...removedOffer]);
    socketFunctions.acceptOffer(offer);
  };

  const handleDeclineOffer = offer => {
    const removedOffer = offers.filter(item => (
      item.tileID !== offer.tileID
    ));
    setOffers([...removedOffer]);
    socketFunctions.declineOffer(offer);
  };

  const removeSellPropPrompt = e => {
    e.preventDefault();
    setOpenSale(false);
    setPrivateSale(false);
  };

  return (
    <>
      <section className="center__dashboard--container">
        <section className="center__dashboard">
          <article className="center__dashboard--img" />

          <section className="center__dashboard__block">
            <h3 className="center__dashboard__title">Players:</h3>

            {state.loaded
              ? Object.keys(state.players).map(player => (
                <section key={uuid()} className="center__dashboard__players">
                  <h3 className="center__dashboard__player-info__name" style={{ color: state.players[player].color, textShadow: '1px 1px 0 black, 1px -1px 0 grey, -1px 1px 0 black, -1px -1px 0 grey, 1px 0px 0 grey, 0px 1px 0 black, -1px 0px 0 grey, 0px -1px 0 grey' }}>
                    {state.players[player].name}
                  </h3>
                  <p className="center__dashboard__player-info">{`Account balance: $${state.players[player].accountBalance}M`}</p>
                </section>
              ))
              : 'Loading...'}

            {Object.keys(state.boardState.finishedPlayers).length > 0 ? <h3 className="center__dashboard__title">Broke Players:</h3> : <></>}
            {state.loaded
              ? Object.keys(state.boardState.finishedPlayers).map(player => (
                <section key={uuid()} className="center__dashboard__players">
                  <h3 className="center__dashboard__player-info__name" style={{ color: state.boardState.finishedPlayers[player].color, textShadow: '1px 1px 0 black, 1px -1px 0 grey, -1px 1px 0 black, -1px -1px 0 grey, 1px 0px 0 grey, 0px 1px 0 black, -1px 0px 0 grey, 0px -1px 0 grey' }}>
                    {state.boardState.finishedPlayers[player].name}
                  </h3>
                </section>
              ))
              : 'Loading...'}
          </section>

          <section className="center__dashboard__block">
            {state.loaded
          && state.boardState.currentPlayer.id === playerId
          && state.turnInfo.canBuyProp
              ? (
                <div className="open-market__sell-toast">
                  <section className="center__dashboard__button__purchase">
                    <button className="button__purchase--yes" type="button" onClick={() => socketFunctions.buyProperty()}>
                      Buy property
                    </button>
                    <button className="button__purchase--no" type="button" onClick={() => socketFunctions.endTurn()}>
                      Do not buy property
                    </button>
                  </section>
                </div>
              )
              : <></>}
            {state.loaded && openSale
              ? (
                <article className="open-market__sell-toast">
                  <h3 className="open-market__sell-toast__close" onClick={removeSellPropPrompt}>❌</h3>
                  <h3 className="open-market__sell-toast__title">
                    Sell
                    {' '}
                    {tileNames[openSale.tileID].streetName}
                    {' '}
                    for:
                  </h3>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      socketFunctions.putOpenMarket({ ...openSale, price: priceInput });
                      setPriceInput('');
                      setOpenSale(false);
                    }}
                    className="open-market__sell-toast__form"
                  >
                    <label> Input in millions. (e.g. 200 = $200M)</label>
                    <div className="open-market__sell-toast__input--container">
                      <input
                        className="open-market__sell-toast__input"
                        onChange={e => setPriceInput(parseInt(e.target.value))}
                        type="number"
                        min="20"
                        autoFocus
                      />
                      <button className="open-market__sell-toast__button" type="submit">Put on the open market</button>
                    </div>
                  </form>
                </article>
              )
              : <></>}
            {state.loaded && privateSale
              ? (
                <article className="open-market__sell-toast">
                  <h3 className="open-market__sell-toast__close" onClick={removeSellPropPrompt}>❌</h3>
                  <h3 className="open-market__sell-toast__title">
                    Make offer for
                    {' '}
                    {tileNames[privateSale.tileID].streetName}
                    {' '}
                    for:
                  </h3>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      socketFunctions.makeOffer({ ...privateSale, price: offer });
                      setOffer('');
                      setPrivateSale(false);
                    }}
                    className="open-market__sell-toast__form"
                  >
                    <label>Input in millions. e.g. 200 = $200M</label>
                    <div className="open-market__sell-toast__input--container">
                      <input
                        className="open-market__sell-toast__input"
                        onChange={e => setOffer(parseInt(e.target.value))}
                        type="number"
                        min="20"
                        autoFocus
                      />
                      <button className="open-market__sell-toast__button" type="submit">Make offer</button>
                    </div>
                  </form>
                </article>
              )
              : <></>}
            {state.loaded && offers.length !== 0
              ? offers.map(offer => (
                <section className="open-market__offer">
                  <h3 className="open-market__offer__title">
                    Offer from:
                    {offer.buyerName}
                  </h3>
                  <h3 className="open-market__offer__title">
                    To buy:
                    {offer.tileName}
                  </h3>
                  <p>
                    Expires in:
                    {offer.timer}
                    {' '}
                    seconds
                  </p>
                  <p>{`The offer is for $${offer.price}M.`}</p>
                  <div className="open-market__offer__buttons">
                    <button
                      className="open-market__sell-toast__button--yes"
                      onClick={() => handleAcceptOffer(offer)}
                      type="submit"
                    >
                      Accept
                    </button>
                    <button
                      className="open-market__sell-toast__button--no"
                      onClick={() => handleDeclineOffer(offer)}
                      type="submit"
                    >
                      Decline
                    </button>
                  </div>
                </section>
              ))
              : <></>}
            {state.loaded && !state.boardState.gameStarted
              ? (
                <button className="button__start-game" type="button" onClick={() => socketFunctions.startGame()}>
                  Start game
                </button>
              )
              : <></>}
          </section>
          <MarketPlace />
        </section>
        <section className="center__dashboard--current-player">
          <h2 className="center__dashboard__player-info">Current player:</h2>
          <h3 className="center__dashboard__player-info__current">
            {state.loaded
              ? (
                state.players[state.boardState.currentPlayer.id] ? `${state.players[state.boardState.currentPlayer.id].name}` : 'None'
              )
              : 'Loading...'}
          </h3>
        </section>
      </section>
    </>
  );
}
