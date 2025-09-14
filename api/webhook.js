import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const payment = req.body;
      console.log("Pagamento recebido:", payment);

      // 🔹 Informações vindas do Mercado Pago
      const itens = payment.additional_info?.items?.map(i => i.title) || [];
      const total = payment.transaction_amount || 0;

      // 🔹 Dados do cliente
      const nomeCliente = payment.payer?.first_name || "Cliente";
      const emailCliente = payment.payer?.email || "";
      const telefone = payment.payer?.phone?.number || "";
      const endereco = payment.additional_info?.shipments?.receiver_address?.street_name || "";
      const bairro = payment.additional_info?.shipments?.receiver_address?.neighborhood?.name || "";

      // 🔹 Forma de pagamento (PIX, cartão, dinheiro etc.)
      const pagamentoMetodo = payment.payment_type_id || "Mercado Pago";

      // 🔹 Entrega ou retirada
      const entregaOuRetirada = payment.additional_info?.shipments ? "Entrega" : "Retirada";

      // 🔹 Monta a URL do Forms
      const formURL =
        `https://docs.google.com/forms/d/e/1FAIpQLSf2_KLWOlSiImG3wOErg7PAgdeYtEQNrubB8MRfjoF7h-mSZw/formResponse?` +
        `entry.647349166=${encodeURIComponent(nomeCliente)}&` + // Nome
        `entry.543244124=${encodeURIComponent(endereco)}&` + // Endereço
        `entry.1092796979=${encodeURIComponent(bairro)}&` + // Bairro
        `entry.1972266836=${encodeURIComponent(telefone)}&` + // Telefone
        `entry.1199359519=${encodeURIComponent(itens.join(", ") + "\nTotal: R$ " + total.toFixed(2))}&` + // Itens
        `entry.579543688=${encodeURIComponent(pagamentoMetodo)}&` + // Forma de pagamento
        `entry.393114016=${encodeURIComponent(entregaOuRetirada)}&` + // Entrega/Retirada

      await fetch(formURL, { method: "POST" });

      return res.status(200).send("Webhook recebido e enviado ao Forms ✅");
    } catch (err) {
      console.error("Erro no webhook:", err);
      return res.status(500).send("Erro no webhook");
    }
  } else {
    return res.status(405).send("Método não permitido");
  }
}
