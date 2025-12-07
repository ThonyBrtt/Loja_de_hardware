import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public')); 
app.post('/api/finalizar-compra', async (req, res) => {
    const { userId, userEmail, items, addressId } = req.body;

    if (!userId || !items || items.length === 0) {
        return res.status(400).json({ erro: 'Dados da compra inválidos.' });
    }

    const batch = db.batch();
    let valorTotalReal = 0;

    try {
        for (const item of items) {
            const produtoRef = db.collection('products').doc(item.produtoId);
            const produtoDoc = await produtoRef.get();

            if (!produtoDoc.exists) {
                throw new Error(`Produto ID ${item.produtoId} não existe.`);
            }

            const dadosReais = produtoDoc.data();

            if (dadosReais.stock < item.quantidade) {
                throw new Error(`Estoque insuficiente para: ${dadosReais.name}`);
            }

            valorTotalReal += dadosReais.price * item.quantidade;

            batch.update(produtoRef, { 
                stock: dadosReais.stock - item.quantidade 
            });
        }

        const pedidoRef = db.collection('orders').doc();
        batch.set(pedidoRef, {
            userId,
            userEmail,
            addressId,
            items,
            total: valorTotalReal,
            status: 'Aprovado',
            date: admin.firestore.FieldValue.serverTimestamp()
        });

        // Limpa Carrinho
        const userRef = db.collection('users').doc(userId);
        batch.update(userRef, { cart: [] });

        await batch.commit();

        return res.json({ sucesso: true, mensagem: 'Compra realizada com segurança!' });

    } catch (error) {
        console.error("Erro na compra:", error);
        return res.status(500).json({ erro: error.message });
    }
});

// Inicia o servidor
app.listen(3000, () => {
    console.log('SERVIDOR RODANDO');
    console.log('Acesse: http://localhost:3000');
});