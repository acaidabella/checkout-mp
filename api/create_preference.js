import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export const config = {
  api: {
    bodyParser: true,
  },
};

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

    // ✅ LOGS PARA DEBUG
    console.log("BODY RECEBIDO:", req.body);
    console.log("Items:", items);
    console.log("Taxa Entrega:", taxaEntrega);
    console.log("Dados Cliente:", dadosCliente);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio ou inválido" });
    }

    const totalProdutos = items.reduce((acc, item) =>
  Number(acc) + 
  Number((item.unit_price || 0).toString().replace(",", ".")) *
  Number(item.quantity || 1), 0);


    const totalFinal =
      Number(totalProdutos) +
      Number((taxaEntrega || 0).toString().replace(",", "."));

    console.log("TOTAL FINAL CALCULADO:", totalFinal);

    if (isNaN(totalFinal) || totalFinal <= 0) {
      return res.status(400).json({ error: "Valor total inválido" });
    }

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            title: "Pedido Açaí Da Bella 🫐💜",
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(totalFinal),
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
    console.error("Erro ao criar preferência:", JSON.stringify(error, null, 2));
    return res
      .status(500)
      .json({ error: "Erro interno ao criar preferência" });
  }
}
