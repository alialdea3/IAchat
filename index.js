const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const host = process.env.HOST || "localhost";
const port = process.env.PORT || 3000; 
const path = require("path");
const { OpenAI } = require("openai");

const apiKey = "add your api key here";//metemos la APIKEY (que he pagado xd)
const openai = new OpenAI({ apiKey: apiKey }); //creamos una instancia de la clase OpenAI
let allowMessages = true; //variable para controlar si se permite enviar mensajes
let currentMessage = ""; //variable para almacenar el mensaje actual
//si no almacenamos el mensaje va mandando silaba x silaba lo que la API responde

app.get("/", (req, res) => { //ruta para la página principal
  res.sendFile(path.join(__dirname, "index.html"));
});

io.on("connection", (socket) => { //escuchamos los mensajes del cliente
  socket.on("chat message", async (msg) => { //
    if (allowMessages) {//si se permite enviar mensajes
      // Emitir el mensaje del usuario
      io.emit("user message", msg);

      try { //intentamos obtener una respuesta de la API
        const stream = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: msg }],
          stream: true,
        });

        currentMessage = ""; // reiniciamos el mensaje actual

        for await (const chunk of stream) { //recorremos el stream de la API
          currentMessage += chunk.choices[0]?.delta?.content || "";
        }

        // emitimos la respuesta de OpenAI
        io.emit("ai response", currentMessage);
      } catch (error) { //si hay un error lo mandamos por consola
        console.error("Error al enviar mensaje a OpenAI:", error);
      }
    }
  });

//si se desconecta el cliente
  socket.on("disconnect", () => {
    allowMessages = false; //desactivamos el envio de mensajes
  });
});

http.listen(port, host, () => { //escuchamos el puerto y la dirección
  console.log(`Socket.IO server running at http://${host}:${port}/`); //mensaje x consola
});
