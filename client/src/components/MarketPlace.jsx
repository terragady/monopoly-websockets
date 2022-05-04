import React, { useContext } from 'react';
import stateContext from '../internal';
import './style/MarketPlace.css';

const MarketPlace = () => {
  const { socketFunctions, state, playerId } = useContext(stateContext);

  return (
    <section className="dashboard__market-place--container">
      <h1 className="dashboard__market-place__title">The open market:</h1>
      <section className="dashboard__market-place">
        <section className="dashboard__market-place__block">
          <h3 className="dashboard__market-place__subtitle">Seller</h3>
          {state.loaded
            ? Object.keys(state.boardState.openMarket).map(item => (
              <p>{state.boardState.openMarket[item].sellerName}</p>
            ))
            : <></>}
        </section>
        <section className="dashboard__market-place__block">
          <h3 className="dashboard__market-place__subtitle">Property</h3>
          {state.loaded
            ? Object.keys(state.boardState.openMarket).map(item => (
              <p>{state.boardState.openMarket[item].tileName}</p>
            ))
            : <></>}
        </section>
        <section className="dashboard__market-place__block">
          <h3 className="dashboard__market-place__subtitle">Price</h3>
          {state.loaded
            ? Object.keys(state.boardState.openMarket).map(item => (
              <p>
                $
                {state.boardState.openMarket[item].price}
                M
              </p>
            ))
            : <></>}
        </section>
        <section className="dashboard__market-place__block">
          {state.loaded
            ? Object.keys(state.boardState.openMarket).map(item => (
              (
                <div className="dashboard__market-place__buttons">
                  {state.boardState.openMarket[item].seller === playerId
                    ? <p onClick={() => socketFunctions.removeSale(item)} className="dashboard__market-place__icon-x">❌</p>
                    : <p onClick={() => socketFunctions.makeSale(item)} className="dashboard__market-place__icon-v">✓</p>}
                </div>
              )
            ))
            : <></>}
        </section>
      </section>
    </section>
  );
};

export default MarketPlace;
