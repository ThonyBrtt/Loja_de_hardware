import express from "express";
import cors from "cors";
import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// === 🧠 MERCADO PAGO CONFIG ===
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

// === 🔥 ROTA TESTE ===
app.get("/ping", (req, res) => res.send("pong"));

// === 💳 ROTA DE PAGAMENTO ===
app.post("/create-preference", async (req, res) => {
  try {
    const { items } = req.body;
    const preference = new Preference(client);

    const data = await preference.create({
      body: {
        items,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/sucesso.html`,
          failure: `${process.env.FRONTEND_URL}/erro.html`,
          pending: `${process.env.FRONTEND_URL}/pendente.html`
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

// ✅ exporta o app em vez de rodar o servidor
export default app;
