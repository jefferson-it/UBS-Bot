const profissional = document.getElementById("profissional");
const resultado = document.getElementById("result");
const botãoAvançar = document.getElementById('next');
const botãoVoltar = document.getElementById('back');
const botãoPreview = document.getElementById('preview');
const botãoEnviar = document.getElementById('send');
const sectionMessage = document.querySelector('#msg');
const sectionTell = document.querySelector('#tels');
const sectionPreview = document.querySelector("#preview-section");
const textareaMessage = document.querySelector("[name=msg]");
const pacientesSelecionados = new Set();
const pacientes = [];
const body = {};

chrome.storage.local.get("medico", (data) => {
    if (data.medico) {
        body.profissional = data.medico;
        profissional.innerText = `Com ${data.medico}`;
    }
});

chrome.storage.onChanged.addListener((changes) => {
    if (changes.medico) {
        profissional.innerText = `Com ${changes.medico.newValue}`;
        body.profissional = data.medico;
    }
    if (changes.pacientes) mostrar(data.pacientes);
    if (data.data) {
        body.data = data.data;
        document.querySelector('#data').innerText = `Agendamento de ${data.data}`
    }
});

chrome.storage.local.get("pacientes", (data) => {
    if (data.pacientes) mostrar(data.pacientes);
});

chrome.storage.local.get("data", (data) => {
    if (data.data) {
        body.data = data.data;
        document.querySelector('#data').innerText = `Agendamento de ${data.data}`
    }
});

function mostrar(pacientesSalvos) {
    pacientes.splice(0);
    pacientesSelecionados.clear();

    for (const { nome, tel, horario } of pacientesSalvos) {
        const id = crypto.randomUUID();
        pacientes.push({
            nome,
            tel,
            novoHorário: horario,
            horario,
            id
        });

        const div = document.createElement('div');
        const span = document.createElement('span');
        const span2 = document.createElement('span');

        div.classList.add('paciente');

        const inputCheckBox = document.createElement('input');
        const inputDate = document.createElement('input');
        const selectTurn = document.createElement('select');
        const optionManha = document.createElement('option');
        const optionTarde = document.createElement('option');
        const nomeParagrafo = document.createElement('p');
        const telParagrafo = document.createElement('p');

        nomeParagrafo.innerText = `${nome} (${horario})`;
        telParagrafo.innerText = tel;

        inputCheckBox.type = 'checkbox';
        inputCheckBox.checked = true;

        inputCheckBox.onchange = (e) => {
            e.target.checked ?
                pacientesSelecionados.add(id) :
                pacientesSelecionados.delete(id);
        }

        inputDate.onchange = (e) => {
            editarPaciente(id, { name: 'novaData', value: e.target.value })
        }


        selectTurn.onchange = (e) => {
            editarPaciente(id, { name: 'novoHorário', value: e.target.value })
        }

        inputDate.name = 'date[]';
        inputDate.required = true;
        inputDate.id = `date-${id}`;
        inputDate.type = 'date';
        selectTurn.value = horario;

        optionManha.label = 'Manhã';
        optionManha.value = 'Manhã';
        optionTarde.label = 'Tarde';
        optionTarde.value = 'Tarde';

        selectTurn.appendChild(optionManha);
        selectTurn.appendChild(optionTarde);
        span2.appendChild(inputDate);
        span2.appendChild(selectTurn);
        span.appendChild(nomeParagrafo)
        span.appendChild(telParagrafo)
        div.appendChild(inputCheckBox)
        div.appendChild(span)
        div.appendChild(span2)
        resultado.appendChild(div)
        pacientesSelecionados.add(id);
    };
}

function editarPaciente(idAlvo, { name, value }) {
    const indexItem = pacientes.findIndex(({ id }) => id === idAlvo);
    pacientes[indexItem][name] = value;
}

function mensagemPadrão() {
    return `A consulta de $nome do dia $data pela $h com $p_nome ($p_cargo) foi remarcada para $nd pela $nt`
}

function avançar() {
    for (const id of pacientesSelecionados) {
        const input = document.querySelector(`#date-${id}`);

        input.min = new Date().toISOString().split("T")[0];

        if (!input.checkValidity()) {
            input.reportValidity();
            return;
        }
    }

    document.querySelector('#total').innerText = `Enviar mensagem para ${pacientesSelecionados.size} pacientes`
    sectionMessage.style.display = 'block'
    sectionTell.style.display = 'none'
    sectionPreview.style.display = 'none'

    textareaMessage.value = mensagemPadrão();
}

function voltar() {
    if (
        sectionPreview.style.display === 'block'
    ) {
        sectionMessage.style.display = 'block'
        sectionTell.style.display = 'none'
        sectionPreview.style.display = 'none'
    } else {
        sectionMessage.style.display = 'none'
        sectionTell.style.display = 'block'
        sectionPreview.style.display = 'none'
    }
}

function enviar() {
    fetch('http://localhost:5050/send-message/ubs2', {
        method: 'POST',
        body: JSON.stringify({
            ...body,
            msg: textareaMessage.value,
            pacientes: pacientes.filter(v => pacientesSelecionados.has(v.id))
        }),
        headers: {
            'content-type': 'application/json'
        }
    }).then(async d => {
        const res = await d.json();

        alert(res.message)
    }).catch(err => {
        alert("Erro interno, provavelmente o servidor está desligado")
    })
}

botãoAvançar.addEventListener('click', avançar);
botãoVoltar.addEventListener('click', voltar);
botãoEnviar.addEventListener('click', enviar);
botãoPreview.addEventListener('click', () => {
    sectionMessage.style.display = 'none'
    sectionTell.style.display = 'none'
    sectionPreview.style.display = 'block'

    const msg = textareaMessage.value;
    const pacientesEscolhidos = pacientes.filter(v => pacientesSelecionados.has(v.id));
    const messages = pacientesEscolhidos.map(({ nome, tel, horario, novaData, novoHorário }) => {
        return msg.replace(/\$nome/g, nome)
            .replace(/\$tel/g, tel)
            .replace(/\$data/g, body.data)
            .replace(/\$p_nome/g, body.profissional)
            .replace(/\$h/g, horario)
            .replace(/\$nd/g, formatarDataBr(novaData))
            .replace(/\$nt/g, novoHorário)
            .replace(/\$p_cargo/g, 'Definido Internamente')
    })

    document.querySelector("#text-preview").innerHTML = messages.join("<br/>")
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
