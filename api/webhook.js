import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export default app;

export const config = {
  api: {
    bodyParser: true
  }
};

app.post(async (req, res) => {
  try {
    const payment = req.body; // dados que o Mercado Pago envia
    console.log("Pagamento recebido:", payment);

    // Aqui você pega os dados do cliente e itens do pagamento
    const itens = payment.additional_info?.items?.map(i => i.title) || [];
    const total = payment.transaction_amount || 0;
    const nomeCliente = payment.payer?.first_name || 'Cliente';
    const emailCliente = payment.payer?.email || '';

    // Monta URL do Google Forms
    const formURL = `https://docs.google.com/forms/d/e/1FAIpQLSf2_KLWOlSiImG3wOErg7PAgdeYtEQNrubB8MRfjoF7h-mSZw/formResponse?` +
      `entry.647349166=${encodeURIComponent(nomeCliente)}&` +
      `entry.1199359519=${encodeURIComponent(itens.join(', ') + '\nTotal: R$ ' + total.toFixed(2))}&` +
      `entry.579543688=${encodeURIComponent('Mercado Pago')}&` +
      `entry.393114016=${encodeURIComponent('Entrega')}&` +
      `entry.1972266836=${encodeURIComponent(emailCliente)}`;

    await fetch(formURL, { method: "POST", mode: "no-cors" });

    res.status(200).send("Webhook recebido");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro no webhook");
  }
});
