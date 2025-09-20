import fetch from "node-fetch";
import getRawBody from "raw-body";
import MercadoPagoConfig, { Payment } from "mercadopago";

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const payment = new Payment(client);

export const config = {
  api: {
    bodyParser: false, 
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Método não permitido");
  }

  try {
    // 🔹 Lê o body bruto
    const raw = await getRawBody(req);
    const str = raw.toString("utf8");

    let body;
    try {
      body = JSON.parse(str);
    } catch {
      // fallback: se não for JSON, tenta converter de form-urlencoded
      body = Object.fromEntries(new URLSearchParams(str));
      if (body.data) {
        try {
          body.data = JSON.parse(body.data);
        } catch {}
      }
    }

    console.log("Headers:", req.headers);
    console.log("Webhook recebido (parsed):", body);

    const paymentId = body?.data?.id;
    if (!paymentId) {
      console.log("⚠️ Nenhum paymentId encontrado no webhook");
      return res.status(400).send("Pagamento sem ID");
    }

  
    res.status(200).end("OK");

   
    (async () => {
      try {
        const pagamento = await payment.get({ id: paymentId });
        console.log("Pagamento completo:", pagamento);

        if (pagamento.status !== "approved") {
          console.log("Pagamento não aprovado, ignorando.");
          return;
        }

        const itens = pagamento.additional_info?.items?.map(i => i.title) || [];
        const total = pagamento.transaction_amount || 0;

        const nomeCliente = pagamento.payer?.first_name || "Cliente";
        const emailCliente = pagamento.payer?.email || "";
        const telefone = pagamento.payer?.phone?.number || "";
        const endereco = pagamento.additional_info?.shipments?.receiver_address?.street_name || "";
        const bairro = pagamento.additional_info?.shipments?.receiver_address?.neighborhood?.name || "";

        const pagamentoMetodo = pagamento.payment_type_id || "Mercado Pago";
        const entregaOuRetirada = pagamento.additional_info?.shipments ? "Entrega" : "Retirada";

        const formURL =
          `https://docs.google.com/forms/d/e/1FAIpQLSf2_KLWOlSiImG3wOErg7PAgdeYtEQNrubB8MRfjoF7h-mSZw/formResponse?` +
          `entry.647349166=${encodeURIComponent(nomeCliente)}&` +
          `entry.543244124=${encodeURIComponent(endereco)}&` +
          `entry.1092796979=${encodeURIComponent(bairro)}&` +
          `entry.1972266836=${encodeURIComponent(telefone)}&` +
          `entry.1199359519=${encodeURIComponent(itens.join(", ") + "\nTotal: R$ " + total.toFixed(2))}&` +
          `entry.579543688=${encodeURIComponent(pagamentoMetodo)}&` +
          `entry.393114016=${encodeURIComponent(entregaOuRetirada)}&` +
          `entry.1111111111=${encodeURIComponent(emailCliente)}`;

        await fetch(formURL, { method: "POST" });

        console.log("✅ Pagamento aprovado, enviado ao Forms");
      } catch (err) {
        console.error("Erro pós-resposta:", err);
      }
    })();
  } catch (err) {
    console.error("Erro no webhook:", err);
    return res.status(500).send("Erro no webhook");
  }
}
