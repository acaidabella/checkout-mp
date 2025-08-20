// pages/api/create-preferences.js

import mercadopago from "mercadopago";

// Configura o Mercado Pago com o Access Token
mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

// Configuração opcional para garantir que o body seja parseado
export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  const allowedOrigin = "https://acai-da-bella.web.app";

  // Configura os headers CORS
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Trata requisição preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    try {
      const { items, dadosCliente } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Carrinho vazio ou inválido" });
      }

      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

      const preference = {
        items: items.map(item => ({
          title: item.nome,
          quantity: 1,
          unit_price: Number(item.preco),
        })),
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
      };

      const response = await mercadopago.preferences.create(preference);
      return res.status(200).json({ id: response.body.id });
    } catch (error) {
      console.error("Erro ao criar preferência:", error);
      return res.status(500).json({ error: "Erro interno ao criar preferência" });
    }
  } else {
    return res.status(405).json({ error: "Método não permitido" });
  }
}

}
