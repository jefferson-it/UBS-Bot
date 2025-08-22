import { useState } from 'react'
import './App.css'
import { useEffect } from 'react';
import { apiURL } from './api';
import PacienteCard from './components/Paciente';
import { formatPhone, regValidatePhone } from './tel';
import Transcribe from './components/Transcribe';

function App() {
  const [func, setFunc] = useState([]);
  const [wh, setWh] = useState('searching');
  const [pacientes, setPacientes] = useState([]);
  const [toInd, setToInd] = useState('');
  const [results, setResults] = useState([]);
  const [viewTranscribe, setViewTranscribe] = useState(false);

  useEffect(() => {
    fetch(`${apiURL}funcionarios`).then(async f => {
      const data = await f.json();


      setFunc(data);
    })

    fetch(`${apiURL}wh-status`).then(async f => {
      const data = await f.json();

      setWh(data?.status || 'off')
      // eslint-disable-next-line no-unused-vars
    }).catch(_ => {
      setWh('off')
    })

  }, [])


  function addPaciente(defVal) {
    setPacientes(p => {

      return [...p, { id: crypto.randomUUID(), ...defVal }]
    })
  }

  function IdentificarPacientes() {
    const line = toInd.split('\n');
    const persons = [];
    let draft = '';

    for (const item of line) {
      const [nome, tel] = item.split(',').map(v => v.trim());

      if (!regValidatePhone(tel)) {
        draft += item + '\n';
        alert(`O número ${tel} atribuído a ${nome}, é invalido`)
        continue
      }

      persons.push({ nome, tel: formatPhone(tel) })
    }


    persons.map(v => addPaciente(v));
    setToInd(draft);
  }

  function removePaciente(i) {
    setPacientes(p => {
      const list = [...p]

      list.splice(i, 1)

      return list;
    })
  }

  function changePaciente(i, e) {
    setPacientes(p => {
      const list = [...p]

      const item = {
        ...p[i],
        [e.target.name.replace('[]', '')]: e.target.value
      };

      list.splice(i, 1, item)

      return list;
    })
  }


  if (wh === 'off') return (
    <main>
      <h1>WhatsApp não iniciado</h1>

      <p>
        O WhatsApp não foi iniciado ou o servidor interno deu algum defeito, peça ao técnico para conectar o WhatsApp para poder funcionar corretamente
      </p>
    </main>
  )

  async function submit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);


    const body = {
      profissional: formData.get('func-name'),
      msg: formData.get('msg'),
      pacientes
    };

    fetch(`${apiURL}send-message`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).then(async f => {
      const response = await f.json();

      if (response.message) alert(response.message);
      const results = [];

      if (response.success) {
        results.push(...response.success.map(v => ({ ...v, id: crypto.randomUUID(), ok: true })))
      }


      if (response.errors) {
        results.push(...response.errors.map(v => ({ ...v, id: crypto.randomUUID(), ok: false })))
      }


      setResults(results);
    }).catch(err => {
      alert('Ocorreu um erro interno ao enviar as mensagens ')
      console.log(err);
    })

  }

  return (
    <main
      className='main-app'
    >
      {viewTranscribe && <Transcribe
        setViewTranscribe={setViewTranscribe}
        setToInd={setToInd} />}
      <form
        onSubmit={submit}
        method='POST'>

        <datalist id='func'>
          {
            func.map((v, i) => <option key={`${v.name}-${i}`} value={v.nome}>{v.nome} ({v.cargo})</option>)
          }
        </datalist>
        <label htmlFor="func">Profissional</label>
        <input
          required
          placeholder='Profissional do atendimento'
          className='great-input'
          name='func-name' list='func' type="text" />

        <label htmlFor="ind">Identificar</label>
        <textarea
          value={toInd}
          placeholder='Coloque o nome e o telefone (ex.: Jefferson Silva, 74999000000)'
          onChange={e => setToInd(e.target.value)}
          name='ind' />

        <small>Coloque mais de um para adiantar</small>

        <div>
          <button onClick={setViewTranscribe.bind(null, true)} type='button'>Transcrever Image</button>
          {toInd && <button onClick={IdentificarPacientes} type='button'>Identificar Pacientes</button>}

          <button
            onClick={addPaciente.bind(null, {})}
            type="button">
            Adicionar Item
          </button>
        </div>

        {
          pacientes.map((item, i) => <PacienteCard
            key={`paciente-${item.id}`}
            {...item}
            change={changePaciente.bind(null, i)}
            remove={removePaciente.bind(null, i)} />)
        }

        <label htmlFor="msg">Mensagem padrão</label>
        <textarea required name='msg' placeholder='Escreva a mensagem de aviso para os pacientes acima' />

        <small>
          Digite "$nome" para citar o nome do paciente, e digite "$tel" para citar o telefone do paciente, após o processamento, "Olá $nome", seria trocado por "Olá Jefferson", por exemplo.
          <br />
          "$p_nome" para nome do profissional
          <br />
          "$p_cargo" para cargo do profissional
        </small>

        {
          pacientes.length > 0 && <button type='submit'>Enviar mensagem</button>
        }
      </form>

      {
        results.length > 0 && (
          <section className='section-result'>
            <h2>Resultado</h2>

            <article>
              {
                results.sort((a, b) => a.ok - b.ok).map(v => (
                  <div className='item-res' key={v.id}>
                    <p>
                      {v.data.nome} - {formatPhone(v.data.tel)} - {v.ok ? 'Enviado' : 'Não enviado'};
                    </p>
                    {v.message && <small>{v.message}</small>}
                  </div>
                ))
              }
            </article>

            <button
              onClick={setResults.bind(null, [])}
              type='button'>Limpar</button>
          </section>
        )
      }
    </main>
  )
}

export default App
