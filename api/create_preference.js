import express from 'express';
import mercadopago from 'mercadopago';

const app = express();
app.use(express.json());

// Coloque aqui seu access token do Mercado Pago
mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

export default app;

export const config = {
  api: {
    bodyParser: true
  }
};

app.post(async (req, res) => {
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
        name: dadosCliente.nome || 'Cliente',
        email: dadosCliente.email || 'cliente@email.com',
      },
      back_urls: {
        success: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/webhook` : "http://localhost:3000/api/webhook",
        failure: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/webhook` : "http://localhost:3000/api/webhook",
        pending: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/webhook` : "http://localhost:3000/api/webhook",
      },
      auto_return: "approved",
      binary_mode: true
    };

    const response = await mercadopago.preferences.create(preference);
    res.status(200).json({ init_point: response.body.init_point });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
