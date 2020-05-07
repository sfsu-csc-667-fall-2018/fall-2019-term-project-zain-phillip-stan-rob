const express = require('express');
const router = express.Router();
const isAuthenticated = require('../../config/passport/isAuthenticated');
const game = require('../../db/game');
const io = require('../../socket');
const lobbySocket = io.of('/lobby'); 

router.get('/', isAuthenticated, (request, response) => {
  const { user } = request;
  const err = request.query.error;

  response.render('lobby', { user: user, error: err });
});

router.post('/creategame', isAuthenticated, (request, response) => {
  const { user } = request;
  const  gameName  = request.body.gameName;
  console.log(user + 'game name: ' + gameName);

  game.createGame(gameName)
    .then(results => {
      const game_id  = results.game_id;
      game.initGamePlayers(game_id, user.id)
        .then(() => {
          lobbySocket.emit('get games');
          response.redirect(`/game/${game_id}`);
        })
        .catch(error => {
          console.log(error);
        });
    })
    .catch(error => {
      console.log(error);
    });
});

router.post('/joinGame', (request, response) => {
  console.log("JOINED GAME");
  console.log(request.body.game_id);
  // const { game_id } = request.params
  // const { user } = request;
  // const { joinButton: gameId } = request.body;

  try {
  //   game.joinGame(gameId, user.id);
  //   lobbySocket.emit('get games');
    response.redirect(`/game/${request.body.game_id}`);
  }catch(error) {
    console.log(error);
  };  
});

router.get('/logout', (request, response) => {
    request.logout();
    response.redirect('/');
});

const displayGames = (socket) => {
  if (socket != undefined){
    game.getCurrentGames()
      .then(currentGames => {
        console.log('games: ' + JSON.stringify(currentGames));
        socket.emit('display games', currentGames);    
      });
  }
};

lobbySocket.on('connection', socket => {

  console.log('connected to lobby');
  lobbySocket.emit('get games');

  socket.on('games list', () => {
    displayGames(socket);
  });
});


module.exports = router;