import express from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { create } from 'venom-bot';
import cors from 'cors';
import { formatPhoneForWhatsApp } from './utils.js';

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
    origin: '*'
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

app.post('/send-message/ubs2', async (req, res) => {
    if (!req.utils.whatsApp || !req.utils.whatsApp.isConnected) return res.json({
        message: 'Erro: whatsapp desconectado'
    })

    const { profissional, msg, pacientes, data } = req.body;
    const errors = [];
    const success = [];
    const profissionalAlvo = profissionalArray.find(({ nome }) => nome === profissional);

    if (!profissionalAlvo) return res.json({
        message: `Erro: O Profissional ${profissional} não foi encontrado`
    })

    const messageFinal = `Olá $nome, a UBS 2(Unidade Básica de Saúde 2 / Rua de Baixo) informa:\n$msg\n_Mensagem *automática*, não responda_`;

    for (const { nome, tel, horario, novaData, novoHorário } of pacientes) {
        try {
            const existNumber = await req.utils.whatsApp.checkNumberStatus(formatPhoneForWhatsApp(tel));

            if (existNumber.numberExists) {
                req.utils.whatsApp.sendText(
                    formatPhoneForWhatsApp(tel),
                    messageFinal
                        .replace('$msg', msg)
                        .replace(/\$nome/g, nome)
                        .replace(/\$tel/g, tel)
                        .replace(/\$data/g, data)
                        .replace(/\$p_nome/g, profissionalAlvo.nome)
                        .replace(/\$h/g, horario)
                        .replace(/\$nd/g, formatarDataBr(novaData))
                        .replace(/\$nt/g, novoHorário)
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

function formatarDataBr(dataIso) {
    if (!dataIso) return "";
    const d = new Date(dataIso);

    return d.toLocaleDateString("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}


app.listen(5050)