let medico = '';

window.addEventListener("load", () => {
    const observer = new MutationObserver(() => {
        obterPacientes();
        const inputMedico = document.querySelector('input#downshift-1-input');
        const data = document.querySelector('.css-12b8era')?.outerText || '';

        if (data) {
            chrome.storage.local.set({ data });
        }

        if (inputMedico) {
            medico = inputMedico.value;
            chrome.storage.local.set({ medico });

            obterPacientes();

            inputMedico.addEventListener("blur", () => {
                medico = inputMedico.value;
                obterPacientes();
                chrome.storage.local.set({ medico });
            });
        }

    });

    observer.observe(document.body, { childList: true, subtree: true });
});


function obterPacientes() {
    const pacientesCartoes = document.querySelectorAll('.css-ffbr73');
    const slots = document.querySelectorAll('.rbc-time-slot');
    const pacientes = [...pacientesCartoes].map(card => {
        const cardRect = card.getBoundingClientRect();
        let horario = '';

        for (let slot of slots) {
            const slotRect = slot.getBoundingClientRect();
            if (cardRect.top >= slotRect.top && cardRect.top < slotRect.bottom) {
                horario = slot.innerText;
                break;
            }
        }

        const info = card.outerText.split('\n');
        return {
            nome: info[0],
            tel: info.at(-1),
            horario: periodoDoDia(horario)
        }
    });

    chrome.storage.local.set({ pacientes });
}

function periodoDoDia(horario) {
    // horario esperado: "08:30", "14:00", etc
    const [hora] = horario.split(':').map(Number);
    return hora >= 12 ? 'Tarde' : 'Manhã';
}
