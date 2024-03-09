# The Coderleones Final Project for </Salt> School of Applied Technology Spring 2020 
![GitHub language count](https://img.shields.io/github/languages/count/terragady/monopoly-websockets)
![GitHub top language](https://img.shields.io/github/languages/top/terragady/monopoly-websockets)
![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/terragady/monopoly-websockets)
![GitHub repo size](https://img.shields.io/github/repo-size/terragady/monopoly-websockets)
![GitHub](https://img.shields.io/github/license/terragady/monopoly-websockets)


## The Monopoly Game
For our final project we have developed a Monopoly game. This README will outline the key functionality and usage.  
The app is deployed here: [https://monopolywebsockets.herokuapp.com/](https://monopolywebsockets.herokuapp.com/)

When playing, everything that happens gets logged to the log / chat. Pay close attention to this!

![image](https://user-images.githubusercontent.com/19210041/187416300-fd0c4e0c-8942-4c36-863d-6b00664d3e0b.png)


## The technology
The app is built using React and Express. Front-end <-> Back-end communication is done with WebSockets using socket.io as a framework. State changes are handled server-side, then pushed to all connected clients in order to facilitate real-time change and ensure that the view is the same for all clients.

### FAQ
#### How can I talk to my friends during the game?
There is a chat in the top right corner of the board! Use that!

#### Can spectators join?
Yes. Once the game has started, anyone who joins will join as a spectator.

#### How to trade with other players?
You can trade with other players in two ways:  

Private sale: If you want do submit an offer to buy a players property, you can click their property and submit an offer.
The Player who owns the Tile then has 20 seconds to accept or decline. You will be notified of their decision.  

The open market: If you own a property you want to sell, you can click the property, and click "sell". Input a price and put it out. The property is now available for any player in the game to buy. You also have the option to remove the property off the market.

#### What happens when I go bankrupt?
Then you're out of the game. All your properties are put back on the open market. However, you can still spectate the game, as well as send messages in the chat.

#### How do I win the game?
By being the only remaining player who is not bankrupt.

#### Known bugs
  * Spectators and broke players can buy properties and make offers.
#### Future improvements
  * Add a "win" screen.
  * Add ability to buy houses on properties.
  * Create socket.io rooms to be able to serve multiple, isolated games at once.
  * More notifications and alerts to make important events in the game more noticable to everyone.
  * Add WebRTC video and audio functionality for the players to communicate during the game.

