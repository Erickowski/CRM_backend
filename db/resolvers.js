const bcryptjs = require("bcryptjs");
require("dotenv").config({ path: ".env" });
const jwt = require("jsonwebtoken");

const Usuario = require("../models/Usuario");
const Producto = require("../models/Producto");
const Cliente = require("../models/Cliente");
const Pedido = require("../models/Pedido");

const crearToken = (usuario, secreta, expiresIn) => {
  const { id, nombre, apellido, email } = usuario;
  return jwt.sign({ id, nombre, apellido, email }, secreta, { expiresIn });
};

// Resolvers
const resolvers = {
  Query: {
    obtenerUsuario: async (_, { token }) => {
      const usuarioId = await jwt.verify(token, process.env.SECRETA);
      return usuarioId;
    },
    obtenerProductos: async () => {
      try {
        const productos = await Producto.find({});
        return productos;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerProducto: async (_, { id }) => {
      const producto = await Producto.findById(id);

      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      return producto;
    },
    obtenerClientes: async () => {
      try {
        const clientes = await Cliente.find({});
        return clientes;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerClientesVendedor: async (_, {}, { id }) => {
      try {
        const clientes = await Cliente.find({ vendedor: id.toString() });
        return clientes;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerCliente: async (_, { id }, ctx) => {
      const cliente = await Cliente.findById(id);

      if (!cliente) {
        throw new Error("Cliente no encontrado");
      }

      // Quien lo creo puede verlo
      if (cliente.vendedor.toString() !== ctx.id) {
        throw new Error("No tienes los permisos");
      }

      return cliente;
    },
    obtenerPedidos: async () => {
      try {
        const pedidos = await Pedido.find({});
        return pedidos;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerPedidosVendedor: async (_, {}, { id }) => {
      try {
        const pedidos = await Pedido.find({ vendedor: id });
        return pedidos;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerPedido: async (_, { id }, ctx) => {
      // Si el pedido existe o no
      const pedido = await Pedido.findById(id);
      if (!pedido) {
        throw new Error("Pedido no encontrado");
      }

      // Solo quien lo creo puede verlo
      if (pedido.vendedor.toString() !== ctx.id) {
        throw new Error("Permiso denegado");
      }

      // Retornar el resultado
      return pedido;
    },
    obtenerPedidosEstado: async (_, { estado }, { id }) => {
      const pedidos = await Pedido.find({ vendedor: id, estado });
      return pedidos;
    },
  },
  Mutation: {
    nuevoUsuario: async (_, { input }) => {
      const { email, password } = input;

      // Revisar si el usuario ya está registrado
      const existeUsuario = await Usuario.findOne({ email });
      if (existeUsuario) {
        throw new Error("El usuario ya está registrado");
      }

      // Hashear el password
      const salt = await bcryptjs.genSalt(10);
      input.password = await bcryptjs.hash(password, salt);

      // Guardarlo en la base de datos
      try {
        const usuario = new Usuario(input);
        usuario.save();
        return usuario;
      } catch (error) {
        console.log(error);
      }
    },
    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;

      // Si el usuario existe
      const existeUsuario = await Usuario.findOne({ email });
      if (!existeUsuario) {
        throw new Error("El usuario no existe");
      }

      // Revisar si el password es correcto
      const passwordCorrecto = await bcryptjs.compare(
        password,
        existeUsuario.password
      );
      if (!passwordCorrecto) {
        throw new Error("El password es incorrecto");
      }

      // crear el token
      return {
        token: crearToken(existeUsuario, process.env.SECRETA, "24h"),
      };
    },
    nuevoProducto: async (_, { input }) => {
      try {
        const producto = new Producto(input);
        // Almacenar en la BD
        const resultado = await producto.save();
        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarProducto: async (_, { id, input }) => {
      let producto = await Producto.findById(id);

      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      //  Guardar en la base de datos
      producto = await Producto.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });

      return producto;
    },
    eliminarProducto: async (_, { id }) => {
      // Revisar si el producto existe o no
      let producto = await Producto.findById(id);

      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      // Eliminar
      await Producto.findOneAndDelete({ _id: id });

      return "Producto eliminado";
    },
    nuevoCliente: async (_, { input }, { id }) => {
      // Verificar si el cliente ya está registrado
      const { email } = input;
      const cliente = await Cliente.findOne({ email });
      if (cliente) {
        throw new Error("Cliente ya registrado");
      }
      const nuevoCliente = new Cliente(input);
      // Asignar el vendedor
      nuevoCliente.vendedor = id;

      try {
        // Guardarlos en la base de datos
        const resultado = await nuevoCliente.save();
        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarCliente: async (_, { id, input }, ctx) => {
      // Verificar si existe o no
      let cliente = await Cliente.findById(id);
      if (!cliente) {
        throw new Error("Ese cliente no existe");
      }
      // Verificar si el vendedor es quien edita
      if (cliente.vendedor.toString() !== ctx.id) {
        throw new Error("No tienes los permisos");
      }
      // Guardar el cliente
      cliente = await Cliente.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return cliente;
    },
    eliminarCliente: async (_, { id }, ctx) => {
      // Verificar si existe o no
      let cliente = await Cliente.findById(id);
      if (!cliente) {
        throw new Error("Ese cliente no existe");
      }
      // Verificar si el vendedor es quien edita
      if (cliente.vendedor.toString() !== ctx.id) {
        throw new Error("No tienes los permisos");
      }
      // Eliminar el cliente
      await Cliente.findOneAndDelete({ _id: id });
      return "Cliente eliminado";
    },
    nuevoPedido: async (_, { input }, ctx) => {
      const { cliente } = input;
      // Verificar si cliente existe o no
      const clienteExiste = await Cliente.findById(cliente);
      if (!clienteExiste) {
        throw new Error("Ese cliente no existe");
      }

      // Verificar si el cliente es del vendedor
      if (clienteExiste.vendedor.toString() !== ctx.id) {
        throw new Error("No tienes los permisos");
      }

      // Revisar que el stock este disponible
      for await (const articulo of input.pedido) {
        const { id } = articulo;
        const producto = await Producto.findById(id);
        if (articulo.cantidad > producto.existencia) {
          throw new Error(
            `El articulo ${producto.nombre} excede la cantidad disponible`
          );
        } else {
          // restar la cantidad a lo disponible
          producto.existencia = producto.existencia - articulo.cantidad;
          await producto.save();
        }
      }
      //  Crear nuevo pedido
      let nuevoPedido = new Pedido(input);

      // Asignarle un vendedor
      nuevoPedido.vendedor = ctx.id;

      // Guardarlo en la base de datos
      const resultado = await nuevoPedido.save();
      return resultado;
    },
    actualizarPedido: async (_, { id, input }, ctx) => {
      const { cliente } = input;

      // Si el pedido existe
      const existePedido = await Pedido.findById(id);
      if (!existePedido) {
        throw new Error("El pedido no existe");
      }

      // si el cliente existe
      const existeCliente = await Cliente.findById(cliente);
      if (!existeCliente) {
        throw new Error("El cliente no existe");
      }

      // Si el cliente y pedido pertenece al vendedor
      if (existeCliente.vendedor.toString() !== ctx.id) {
        throw new Error("No tienes los permisos");
      }

      // Revisar el stock
      if (input.pedido) {
        for await (const articulo of input.pedido) {
          const { id } = articulo;
          const producto = await Producto.findById(id);
          if (articulo.cantidad > producto.existencia) {
            throw new Error(
              `El articulo ${producto.nombre} excede la cantidad disponible`
            );
          } else {
            // restar la cantidad a lo disponible
            producto.existencia = producto.existencia - articulo.cantidad;
            await producto.save();
          }
        }
      }

      // Guardar el pedido
      const resultado = await Pedido.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return resultado;
    },
    eliminarPedido: async (_, { id }, ctx) => {
      // Si el pedido existe
      const existePedido = await Pedido.findById(id);
      if (!existePedido) {
        throw new Error("El pedido no existe");
      }
      // Si el cliente y pedido pertenece al vendedor
      if (existePedido.vendedor.toString() !== ctx.id) {
        throw new Error("No tienes los permisos");
      }

      // Eliminar de la base de datos
      await Pedido.findOneAndDelete({ _id: id });
      return "Pedido eliminado";
    },
  },
};

module.exports = resolvers;
