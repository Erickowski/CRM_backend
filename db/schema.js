const { gql } = require("apollo-server");

// Schema
const typeDefs = gql`
  type Usuario {
    id: ID
    nombre: String
    apellido: String
    email: String
    creado: String
  }

  type Query {
    obtenerCurso: String
  }

  type Mutation {
    nuevoUsuario: String
  }
`;

module.exports = typeDefs;
