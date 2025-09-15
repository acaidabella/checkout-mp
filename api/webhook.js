import fetch from "node-fetch";
import mercadopago from "mercadopago";

mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const notification = req.body;
      console.log("Webhook recebido:", notification);

      const paymentId = notification.data?.id;
      if (!paymentId) {
        return res.status(400).send("Pagamento sem ID");
      }

      // 🔹 Busca os dados completos do pagamento
      const { response: payment } = await mercadopago.payment.findById(paymentId);
      console.log("Pagamento completo:", payment);

      if (payment.status !== "approved") {
        console.log("Pagamento não aprovado, ignorando.");
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

      // 🔹 Usa cada entry.ID correto do seu Forms
      const formURL =
        `https://docs.google.com/forms/d/e/1FAIpQLSf2_KLWOlSiImG3wOErg7PAgdeYtEQNrubB8MRfjoF7h-mSZw/formResponse?` +
        `entry.647349166=${encodeURIComponent(nomeCliente)}&` + // Nome
        `entry.543244124=${encodeURIComponent(endereco)}&` +   // Endereço
        `entry.1092796979=${encodeURIComponent(bairro)}&` +    // Bairro
        `entry.1972266836=${encodeURIComponent(telefone)}&` +  // Telefone
        `entry.1199359519=${encodeURIComponent(itens.join(", ") + "\nTotal: R$ " + total.toFixed(2))}&` + // Itens + total
        `entry.579543688=${encodeURIComponent(pagamentoMetodo)}&` + // Pagamento
        `entry.393114016=${encodeURIComponent(entregaOuRetirada)}&` +
        `entry.1111111111=${encodeURIComponent(emailCliente)}`; // 👉 precisa ser o entry ID do seu campo de email

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
