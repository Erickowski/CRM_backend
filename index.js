const { ApolloServer } = require("apollo-server");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: ".env" });

const conectarDB = require("./config/db");

const resolvers = require("./db/resolvers");
const typeDefs = require("./db/schema");

// conectar a la base de datos
conectarDB();

// Servidor
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers["authorization"] || "";
    if (token) {
      try {
        const usuario = jwt.verify(
          token.replace("Bearer ", ""),
          process.env.SECRETA
        );
        return usuario;
      } catch (error) {
        console.log(error);
      }
    }
  },
});

// Arrancar el servidor
server.listen().then(({ url }) => {
  console.log(`Servidor listo en ${url}`);
});
