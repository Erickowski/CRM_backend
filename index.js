const { ApolloServer } = require("apollo-server");

const conectarDB = require("./config/db");

const resolvers = require("./db/resolvers");
const typeDefs = require("./db/schema");

// conectar a la base de datos
conectarDB();

// Servidor
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => {
    const miContext = "Erick";
    return { miContext };
  },
});

// Arrancar el servidor
server.listen().then(({ url }) => {
  console.log(`Servidor listo en ${url}`);
});
