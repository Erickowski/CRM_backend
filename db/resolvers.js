// Resolvers
const resolvers = {
  Query: {
    obtenerCurso: () => "Creando nuevo usuario",
  },
  Mutation: {
    nuevoUsuario: (_, { input }) => {
      console.log(input);
      return "Creando nuevo usuario";
    },
  },
};

module.exports = resolvers;
