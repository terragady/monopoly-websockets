import React, {
  useContext, useRef, useEffect, useState,
} from 'react';
import './style/Log.css';
import { v4 as uuid } from 'uuid';
import stateContext from '../internal';

export default function Log() {
  const { state, socketFunctions } = useContext(stateContext);
  const [chat, setChat] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.boardState.logs]);

  const sendChat = e => {
    e.preventDefault();
    if (chat) socketFunctions.sendChat(chat);
    setChat('');
    e.target.reset();
  };
  return (
    <section className="center__room">
      <section ref={scrollRef} className="center__log">
        {state.loaded
          ? state.boardState.logs.map(e => <p key={uuid()} dangerouslySetInnerHTML={{ __html: e }} />)
          : <p>Loading...</p>}
      </section>
      <section className="center__chat">
        <form className="center__chat--form" onSubmit={e => sendChat(e)}>
          <input className="center__chat--input" onChange={e => setChat(e.target.value)} type="text" name="chat" id="chat" autoComplete="off" placeholder="Write message..." />
          <button className="center__chat--button" type="submit">Send</button>
        </form>
      </section>

    </section>
  );
}
