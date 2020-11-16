const { ApolloServer } = require("apollo-server");

// Servidor
const server = new ApolloServer();

// Arrancar el servidor
server.listen().then((url) => {
  console.log(`Servidor listo en ${url}`);
});
