import { formatPhone } from '../tel'
import styles from './Paciente.module.css'

export default function PacienteCard({
    nome,
    tel,
    change,
    remove
}) {
    return (
        <div className={styles.card}>
            <input
                required
                defaultValue={nome}
                onChange={change}
                type="text"
                placeholder='Nome do paciente, ex.: Jefferson'
                name="nome[]" />
            <input
                required
                onChange={change}
                defaultValue={tel}
                onBlur={e => {
                    e.target.value = formatPhone(e.target.value)
                }}
                placeholder='Telefone, ex.: 74999xxxxxx'
                type="tel"
                name="tel[]" />

            <button type="button" onClick={remove} className={styles.remove}>X</button>
        </div>
    )
}