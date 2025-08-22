import express from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { create } from 'venom-bot';
import cors from 'cors';
import { formatPhoneForWhatsApp } from './utils.js';
import Tesseract from 'tesseract.js';

const __filename = fileURLToPath(import.meta.url || 'file://' + __filename);
const __dirname = path.dirname(__filename)

const app = express();
const profissionalArray = JSON.parse(readFileSync('./profissional.json', 'utf8') || '[]');

let clientWhatsApp;

create({
    session: 'ubs-wh',
    attemptsForceConnectLoad: 100,
    headless: 'new',
    addBrowserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
    ],
}).then(bot => {
    clientWhatsApp = bot
})

app.use(cors({
    origin: process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : ''
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(express.json({ limit: '50mb' }))
app.use((req, _, next) => {
    req.utils = {
        whatsApp: clientWhatsApp
    }

    next()
})

app.get("/funcionarios", (req, res) => {
    const jsonResult = readFileSync('./profissional.json', 'utf8');
    const funcionarios = JSON.parse(jsonResult);

    res.json(funcionarios)
})

app.get('/wh-status', (req, res) => {
    if (!req.utils.whatsApp) {
        return res.json({
            status: 'off'
        })
    }

    return res.json({
        status: req.utils.whatsApp.isConnected ? 'on' : 'off'
    })
})

app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'))
})

app.post('/send-message', async (req, res) => {
    if (!req.utils.whatsApp || !req.utils.whatsApp.isConnected) return res.json({
        message: 'Erro: whatsapp desconectado'
    })


    const { profissional, msg, pacientes } = req.body;
    const errors = [];
    const success = [];
    const profissionalAlvo = profissionalArray.find(({ nome }) => nome === profissional);

    if (!profissionalAlvo) return res.json({
        message: `Erro: O Provisional ${profissional} não foi encontrado`
    })

    const messageFinal = `Olá $nome, a UBS 2(Unidade Básica de Saúde 2 / Rua de Baixo) informa:\n$msg`;

    for (const { nome, tel } of pacientes) {
        try {
            const existNumber = await req.utils.whatsApp.checkNumberStatus(formatPhoneForWhatsApp(tel));

            if (existNumber.numberExists) {
                req.utils.whatsApp.sendText(
                    formatPhoneForWhatsApp(tel),
                    messageFinal
                        .replace('$msg', msg)
                        .replace(/\$nome/g, nome)
                        .replace(/\$tel/g, tel)
                        .replace(/\$p_nome/g, profissionalAlvo.nome)
                        .replace(/\$p_cargo/g, profissionalAlvo.cargo)
                )

                success.push({
                    data: { nome, tel },
                })
            } else {
                errors.push({
                    data: { nome, tel },
                    message: `Número de ${nome} não está cadastrado no WhatsApp`
                })
            }
        } catch (error) {
            errors.push({
                data: { nome, tel },
                message: `Número de ${nome} não está cadastrado no WhatsApp`
            })
        }
    }

    res.json({
        message: `Mensagem enviada com sucesso para ${success.length}`,
        errors,
        success
    })
});

app.post('/transcribe', async (req, res) => {
    const { image } = req.body; // image em base64

    if (!image) {
        return res.status(400).json({ error: 'Nenhuma imagem fornecida.' });
    }

    try {
        const result = await Tesseract.recognize(
            image,
            'por',
            {
                logger: m => console.log(m)
            }
        );

        const text = result.data.text;

        res.json({ text: text.trim() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao processar a imagem.' });
    }
});

app.listen(5050);