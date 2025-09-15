import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const payment = req.body;
      console.log("Webhook recebido:", payment);

      // 🚨 Só continua se o pagamento foi aprovado
      if (payment.status !== "approved") {
        console.log("Pagamento ainda não aprovado, ignorando envio ao Forms.");
        return res.status(200).send("Pagamento não aprovado, ignorado");
      }

      const itens = payment.additional_info?.items?.map(i => i.title) || [];
      const total = payment.transaction_amount || 0;

      const nomeCliente = payment.payer?.first_name || "Cliente";
      const emailCliente = payment.payer?.email || "";
      const telefone = payment.payer?.phone?.number || "";
      const endereco = payment.additional_info?.shipments?.receiver_address?.street_name || "";
      const bairro = payment.additional_info?.shipments?.receiver_address?.neighborhood?.name || "";

      const pagamentoMetodo = payment.payment_type_id || "Mercado Pago";
      const entregaOuRetirada = payment.additional_info?.shipments ? "Entrega" : "Retirada";

      const formURL =
        `https://docs.google.com/forms/d/e/1FAIpQLSf2_KLWOlSiImG3wOErg7PAgdeYtEQNrubB8MRfjoF7h-mSZw/formResponse?` +
        `entry.647349166=${encodeURIComponent(nomeCliente)}&` +
        `entry.543244124=${encodeURIComponent(endereco)}&` +
        `entry.1092796979=${encodeURIComponent(bairro)}&` +
        `entry.1972266836=${encodeURIComponent(telefone)}&` +
        `entry.1199359519=${encodeURIComponent(itens.join(", ") + "\nTotal: R$ " + total.toFixed(2))}&` +
        `entry.579543688=${encodeURIComponent(pagamentoMetodo)}&` +
        `entry.393114016=${encodeURIComponent(entregaOuRetirada)}&` +
        `entry.1972266836=${encodeURIComponent(emailCliente)}`;

      await fetch(formURL, { method: "POST" });

      return res.status(200).send("Pagamento aprovado, enviado ao Forms ✅");
    } catch (err) {
      console.error("Erro no webhook:", err);
      return res.status(500).send("Erro no webhook");
    }
  } else {
    return res.status(405).send("Método não permitido");
  }
}
