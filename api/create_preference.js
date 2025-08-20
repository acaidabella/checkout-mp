import mercadopago from "mercadopago";

// Configura o Mercado Pago com o Access Token da Vercel
mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

export default async function handler(req, res) {
  const allowedOrigin = "https://acai-da-bella.web.app"; // seu domínio de front-end

  // Headers CORS
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true"); // crucial para algumas requisições

  // Tratamento do preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    try {
      const { items, dadosCliente } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Carrinho vazio ou inválido" });
      }

      // Define baseUrl dinamicamente
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

      // Cria preferência do Mercado Pago
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
          success: `${baseUrl}/sucesso.html`,
          failure: `${baseUrl}/falha.html`,
          pending: `${baseUrl}/pendente.html`,
        },
        auto_return: "approved",
        binary_mode: true,
        notification_url: `${baseUrl}/api/webhook`,
      };

      const response = await mercadopago.preferences.create(preference);

      return res.status(200).json({ init_point: response.body.init_point });
    } catch (err) {
      console.error("Erro ao criar preferência:", err);
      return res.status(500).json({ error: "Erro interno ao criar pagamento" });
    }
  } else {
    return res.status(405).json({ error: "Método não permitido" });
  }
}
