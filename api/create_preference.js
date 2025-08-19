import mercadopago from "mercadopago";

mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { items, dadosCliente } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Carrinho vazio ou inválido" });
      }

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
          success: process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}/api/webhook`
            : "http://localhost:3000/api/webhook",
          failure: process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}/api/webhook`
            : "http://localhost:3000/api/webhook",
          pending: process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}/api/webhook`
            : "http://localhost:3000/api/webhook",
        },
        auto_return: "approved",
        binary_mode: true,
      };

      const response = await mercadopago.preferences.create(preference);
      return res.status(200).json({ init_point: response.body.init_point });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    return res.status(405).json({ error: "Método não permitido" });
  }
}
