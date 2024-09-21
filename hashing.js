const bcrypt = require('bcryptjs');

const password = 'adminproton1234';

bcrypt.genSalt(10, function(err, salt) {
  bcrypt.hash(password, salt, function(err, hash) {
    console.log('Hashed Password:', hash);
  });
});

// $2a$10$85B2dqy7sV.VmY.pfCnal.3lEXE9S2yMyi43nV2TV1vGnDiOS.fL6
// $2a$10$Z17tEzmY5vbVz2veckqGauCS.3if7uZNkyLiFSR7e1rJ6hRLhXIWW