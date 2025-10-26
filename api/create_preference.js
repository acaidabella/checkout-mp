import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export const config = {
  api: {
    bodyParser: true,
  },
};

// Libera CORS
const ALLOWED_ORIGIN = "https://acai-da-bella.web.app";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { items, dadosCliente, taxaEntrega } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio ou inválido" });
    }

    // Soma dos produtos
    const totalProdutos = items.reduce(
      (acc, item) =>
        Number(acc) +
        Number(item.preco || 0) +
        Number(item.complementosPreco || 0),
      0
    );

    const totalFinal = Number(totalProdutos) + Number(taxaEntrega || 0);

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            title: "Compra no MeuSite 🛒",
            quantity: 1,
            unit_price: Number(totalFinal), // 🔥 GARANTIA: É número!
          },
        ],
        payer: {
          name: dadosCliente?.nome || "Cliente",
          email: dadosCliente?.email || "cliente@email.com",
        },
        back_urls: {
          success: `${baseUrl}/sucesso`,
          failure: `${baseUrl}/falha`,
          pending: `${baseUrl}/pendente`,
        },
        auto_return: "approved",
      },
    });

    return res.status(200).json({
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    });
  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    return res
      .status(500)
      .json({ error: "Erro interno ao criar preferência" });
  }
}
