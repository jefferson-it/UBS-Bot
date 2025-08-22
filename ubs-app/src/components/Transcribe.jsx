import { useRef, useState } from 'react';
import styles from './Transcribe.module.css';
import { Icon } from '@iconify/react';
import { apiURL } from '../api';

export default function Transcribe({
    setToInd,
    setViewTranscribe
}) {
    const inputRef = useRef(null);
    const [icon, setIcon] = useState('');
    const [result, setResult] = useState('');

    //   async function checkClipboard() {
    //     try {
    //       const items = await navigator.clipboard.read();

    //       for (const item of items) {
    //         if (item.types.includes("image/png") || item.types.includes("image/jpeg")) {
    //           const blob = await item.getType(item.types[0]);
    //           const url = URL.createObjectURL(blob);

    //         }
    //       }
    //     } catch (err) {
    //       console.error("Erro ao acessar clipboard:", err);
    //     }
    //   }

    function changeIcon() {
        const reader = new FileReader();

        reader.onload = () => setIcon(reader.result)

        reader.readAsDataURL(inputRef.current.files[0]);
    }

    async function submit() {
        setResult('');

        const result = await fetch(`${apiURL}transcribe`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: icon
            })
        })

        const data = await result.json();

        setResult(data.text.replaceAll('| ', ''))
    }

    function accept() {
        setToInd(result);

        setViewTranscribe(false)
    }

    const handlePaste = (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.includes("image")) {
                const blob = items[i].getAsFile();

                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result;
                    setIcon(base64data);
                };
                reader.readAsDataURL(blob);

                break;
            }
        }
    };


    return (
        <article onPaste={handlePaste} className={styles.articleTranscribe}>
            <p>Selecione uma imagem, ou aperte "CTRL+V"</p>
            <input onChange={changeIcon} accept='image/*' hidden ref={inputRef} type="file" name="photo" />

            {icon && (
                <div
                    onClick={() => inputRef.current.click()}
                    className={styles.preview}>
                    <img src={icon} />

                    <Icon
                        onClick={() => inputRef.current.click()}
                        icon="material-symbols:upload"
                        width="250"
                        height="250" />
                </div>
            )}

            {!icon && <Icon
                onClick={() => inputRef.current.click()}
                icon="material-symbols:upload"
                width="250"
                height="250" />}

            {result && <div>
                <label htmlFor="result">Resultado</label>
                <textarea
                    name='result'
                    onChange={e => setResult(e.target.value)}
                    value={result}
                    cols={30}
                    rows={10}
                />
            </div>}

            <span className={styles.buttons}>
                <button onClick={setViewTranscribe.bind(null, false)} type='button'>Voltar</button>
                {icon && <button onClick={submit} type='button'>Transcrever</button>}
                {result && <button onClick={accept} type='button'>Aceitar transcrição</button>}
            </span>
        </article>
    )
}