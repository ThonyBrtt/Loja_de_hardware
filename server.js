import express from "express";
import cors from "cors";
import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});


app.get("/ping", (req, res) => res.send("pong"));


app.post("/create-preference", async (req, res) => {
  try {
    const { items } = req.body;

    const preference = new Preference(client);

    const data = await preference.create({
      body: {
        items,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/codification/sucesso.html`,
          failure: `${process.env.FRONTEND_URL}/codification/erro.html`,
          pending: `${process.env.FRONTEND_URL}/codification/pendente.html`
        },
        auto_return: "approved"
      }
    });

    res.status(200).json({
      preference_id: data.id,
      preference_url: data.init_point
    });
  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 8080, () => {
  console.log(`Server rodando em http://localhost:${process.env.PORT}`);
});

