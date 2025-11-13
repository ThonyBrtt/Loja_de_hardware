import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  // --- CONFIGURAÇÃO DE CORS ---
  res.setHeader("Access-Control-Allow-Origin", "https://loja-de-hardware-joaolucasnormandias-projects.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // --- Responde o preflight (OPTIONS) ---
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // --- Apenas POST ---
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { items } = req.body;

    const preference = new Preference(client);

    const data = await preference.create({
      body: {
        items,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/sucesso.html`,
          failure: `${process.env.FRONTEND_URL}/erro.html`,
          pending: `${process.env.FRONTEND_URL}/pendente.html`,
        },
        auto_return: "approved",
      },
    });

    return res.status(200).json({
      preference_id: data.id,
      preference_url: data.init_point,
    });
  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    return res.status(500).json({ error: error.message });
  }
}
