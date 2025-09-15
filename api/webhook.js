import fetch from "node-fetch";
import MercadoPagoConfig, { Payment } from "mercadopago";

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const payment = new Payment(client);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Método não permitido");
  }

  try {
    console.log("Webhook recebido:", req.body);

    const paymentId = req.body?.data?.id;
    if (!paymentId) {
      console.log("⚠️ Nenhum paymentId encontrado no webhook");
      return res.status(400).send("Pagamento sem ID");
    }

    // 🔹 Busca os dados completos do pagamento
    const pagamento = await payment.get({ id: paymentId });
    console.log("Pagamento completo:", pagamento);

    if (pagamento.status !== "approved") {
      console.log("Pagamento não aprovado, ignorando.");
      return res.status(200).send("Pagamento não aprovado, ignorado");
    }

    // 🔹 Extrai os dados
    const itens = pagamento.additional_info?.items?.map(i => i.title) || [];
    const total = pagamento.transaction_amount || 0;

    const nomeCliente = pagamento.payer?.first_name || "Cliente";
    const emailCliente = pagamento.payer?.email || "";
    const telefone = pagamento.payer?.phone?.number || "";
    const endereco = pagamento.additional_info?.shipments?.receiver_address?.street_name || "";
    const bairro = pagamento.additional_info?.shipments?.receiver_address?.neighborhood?.name || "";

    const pagamentoMetodo = pagamento.payment_type_id || "Mercado Pago";
    const entregaOuRetirada = pagamento.additional_info?.shipments ? "Entrega" : "Retirada";

    // 🔹 Monta a URL do Forms
    const formURL =
      `https://docs.google.com/forms/d/e/1FAIpQLSf2_KLWOlSiImG3wOErg7PAgdeYtEQNrubB8MRfjoF7h-mSZw/formResponse?` +
      `entry.647349166=${encodeURIComponent(nomeCliente)}&` + // Nome
      `entry.543244124=${encodeURIComponent(endereco)}&` +   // Endereço
      `entry.1092796979=${encodeURIComponent(bairro)}&` +    // Bairro
      `entry.1972266836=${encodeURIComponent(telefone)}&` +  // Telefone
      `entry.1199359519=${encodeURIComponent(itens.join(", ") + "\nTotal: R$ " + total.toFixed(2))}&` + // Itens + total
      `entry.579543688=${encodeURIComponent(pagamentoMetodo)}&` + // Pagamento
      `entry.393114016=${encodeURIComponent(entregaOuRetirada)}&` +
      `entry.1111111111=${encodeURIComponent(emailCliente)}`; // 👉 substitui pelo entry do seu Forms

    // 🔹 Dispara para o Google Forms
    await fetch(formURL, { method: "POST" });

    // 🔹 Sempre responde rápido para o Mercado Pago
    return res.status(200).send("Pagamento aprovado, enviado ao Forms ✅");
  } catch (err) {
    console.error("Erro no webhook:", err);
    return res.status(500).send("Erro no webhook");
  }
}
