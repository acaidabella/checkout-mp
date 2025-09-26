import { MercadoPagoConfig, Payment } from "mercadopago";
import { db } from "../../firebase"; // ajuste o path pro seu Firebase config
import { set, ref } from "firebase/database";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export const config = {
  api: {
    bodyParser: false, // Mercado Pago envia raw body
  },
};

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const rawBody = await buffer(req);
    const data = JSON.parse(rawBody.toString());

    
    if (data.type === "payment") {
      const paymentId = data.data.id;

      const payment = new Payment(client);
      const result = await payment.get({ id: paymentId });

      if (result.status === "approved") {
       
        const pedidoId = `pedido_${Date.now()}`;
        await set(ref(db, "pedidos/" + pedidoId), {
          cliente: result.payer,
          valor: result.transaction_amount,
          metodo: result.payment_method_id,
          status: result.status,
          criadoEm: new Date().toISOString(),
        });
      }
    }

    return res.status(200).end();
  } catch (error) {
    console.error("Erro no webhook:", error);
    return res.status(500).end();
  }
}
