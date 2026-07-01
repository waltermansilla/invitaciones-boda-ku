'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import styles from './page.module.css'

type Grupo = {
  a: string
  b: string
  c: string
}

type Semana = {
  semana: string
  grupo: string
}

const gruposIniciales: Grupo[] = [
  { a: 'Gaston', b: 'Walter D', c: 'Lucas' },
  { a: 'Mario', b: 'Damian', c: 'Walter M' },
  { a: 'Rebeca', b: 'Evelin', c: 'Miriam V' },
  { a: 'Maira', b: 'Diana', c: 'Florencia' },
  { a: 'Angelica', b: 'Sofia', c: 'Antonella' },
  { a: 'Abigail', b: 'Celia', c: 'Maria Elena' },
  { a: '', b: 'Melany', c: '' },
]

const cronogramaInicial: Semana[] = [
  { semana: '5 y 7 de Marzo', grupo: 'C' },
  { semana: '12 y 14 de Marzo', grupo: 'A' },
  { semana: '19 y 21 de Marzo', grupo: 'B' },
  { semana: '26 y 28 de Marzo', grupo: 'C' },
  { semana: '2 (Conme) y 4 de Abril', grupo: 'A' },
  { semana: '9 y 11 de Abril', grupo: 'B' },
  { semana: '16 y 18 de Abril', grupo: 'C' },
  { semana: '26 de Abril', grupo: 'ASAMBLEA' },
]

const STORAGE_CRONOGRAMA_KEY = 'cronograma-limpieza-fechas-v1'
const STORAGE_GRUPOS_KEY = 'cronograma-limpieza-grupos-v1'

export default function CronogramaLimpiezaPage() {
  const [modoEdicion, setModoEdicion] = useState(false)
  const [modoEdicionGrupos, setModoEdicionGrupos] = useState(false)
  const [grupos, setGrupos] = useState(gruposIniciales)
  const [cronograma, setCronograma] = useState(cronogramaInicial)
  const [gruposDraft, setGruposDraft] = useState<Grupo[] | null>(null)
  const [cronogramaDraft, setCronogramaDraft] = useState<Semana[] | null>(null)
  const [cargadoDesdeStorage, setCargadoDesdeStorage] = useState(false)

  useEffect(() => {
    try {
      const gruposGuardados = localStorage.getItem(STORAGE_GRUPOS_KEY)
      if (gruposGuardados) {
        const parsed = JSON.parse(gruposGuardados) as unknown
        if (esListaGrupos(parsed)) {
          setGrupos(parsed)
        }
      }

      const cronogramaGuardado = localStorage.getItem(STORAGE_CRONOGRAMA_KEY)
      if (cronogramaGuardado) {
        const parsed = JSON.parse(cronogramaGuardado) as unknown
        if (esListaSemanas(parsed)) {
          setCronograma(parsed)
        }
      }
    } catch {
      // Si el JSON guardado esta corrupto, se usa el estado inicial.
    } finally {
      setCargadoDesdeStorage(true)
    }
  }, [])

  useEffect(() => {
    if (!cargadoDesdeStorage) {
      return
    }
    localStorage.setItem(STORAGE_GRUPOS_KEY, JSON.stringify(grupos))
  }, [grupos, cargadoDesdeStorage])

  useEffect(() => {
    if (!cargadoDesdeStorage) {
      return
    }
    localStorage.setItem(STORAGE_CRONOGRAMA_KEY, JSON.stringify(cronograma))
  }, [cronograma, cargadoDesdeStorage])

  const actualizarSemana = (index: number, semana: string) => {
    setCronogramaDraft((prev) =>
      (prev ?? cronograma).map((item, i) => (i === index ? { ...item, semana } : item)),
    )
  }

  const actualizarGrupo = (index: number, grupo: string) => {
    setCronogramaDraft((prev) =>
      (prev ?? cronograma).map((item, i) => (i === index ? { ...item, grupo } : item)),
    )
  }

  const actualizarIntegrante = (
    index: number,
    columna: keyof Grupo,
    valor: string,
  ) => {
    setGruposDraft((prev) =>
      (prev ?? grupos).map((item, i) => (i === index ? { ...item, [columna]: valor } : item)),
    )
  }

  const abrirEdicion = () => {
    setModoEdicion(true)
    setModoEdicionGrupos(false)
    setGruposDraft(grupos)
    setCronogramaDraft(cronograma)
  }

  const cancelarEdicion = () => {
    setModoEdicion(false)
    setModoEdicionGrupos(false)
    setGruposDraft(null)
    setCronogramaDraft(null)
  }

  const guardarEdicion = () => {
    if (gruposDraft) {
      setGrupos(gruposDraft)
    }
    if (cronogramaDraft) {
      setCronograma(cronogramaDraft)
    }
    setModoEdicion(false)
    setModoEdicionGrupos(false)
    setGruposDraft(null)
    setCronogramaDraft(null)
  }

  const recalcularFechasDesdeHoy = () => {
    setCronogramaDraft((prev) => {
      const base = prev ?? cronograma
      const resultado = [...base]
      const hoy = new Date()
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
      const filasConGrupo = resultado.filter(
        (fila) => fila.grupo.toUpperCase() !== 'ASAMBLEA',
      ).length
      const cantidadPares = Math.min(15, Math.max(filasConGrupo, 1))
      const pares = generarParesJuevesDomingo(inicio, cantidadPares)

      let cursorPar = 0
      for (let i = 0; i < resultado.length; i += 1) {
        const fila = resultado[i]
        if (fila.grupo.toUpperCase() === 'ASAMBLEA') {
          continue
        }
        const par = pares[cursorPar]
        if (!par) {
          break
        }
        resultado[i] = { ...fila, semana: formatearPar(par.jueves, par.domingo) }
        cursorPar += 1
      }

      return resultado
    })
  }

  const agregarFilaCronograma = () => {
    setCronogramaDraft((prev) => [
      ...(prev ?? cronograma),
      { semana: '', grupo: 'A' },
    ])
  }

  const eliminarFilaCronograma = (index: number) => {
    setCronogramaDraft((prev) => {
      const base = prev ?? cronograma
      if (base.length <= 1) return base
      return base.filter((_, i) => i !== index)
    })
  }

  const gruposMostrados = modoEdicion ? (gruposDraft ?? grupos) : grupos
  const cronogramaMostrado = modoEdicion
    ? (cronogramaDraft ?? cronograma)
    : cronograma

  return (
    <main className={styles.main}>
      <section>
        <h1 className={styles.title}>Cronograma de limpieza para las reuniones</h1>

        <table className={`${styles.table} ${styles.groupsTable}`}>
          <thead>
            <tr>
              <th className={styles.grupos} colSpan={3}>
                Grupos
              </th>
            </tr>
            <tr>
              <th className={styles.aThead}>A</th>
              <th className={styles.bThead}>B</th>
              <th className={styles.cThead}>C</th>
            </tr>
          </thead>
          <tbody>
            {gruposMostrados.map((fila, index) => (
              <tr key={`grupo-${index}`}>
                <td className={styles.aGroup}>
                  {modoEdicion && modoEdicionGrupos ? (
                    <AutoGrowField
                      className={styles.input}
                      value={fila.a}
                      onChange={(e) =>
                        actualizarIntegrante(index, 'a', e.target.value)
                      }
                    />
                  ) : (
                    fila.a
                  )}
                </td>
                <td className={styles.bGroup}>
                  {modoEdicion && modoEdicionGrupos ? (
                    <AutoGrowField
                      className={styles.input}
                      value={fila.b}
                      onChange={(e) =>
                        actualizarIntegrante(index, 'b', e.target.value)
                      }
                    />
                  ) : (
                    fila.b
                  )}
                </td>
                <td className={styles.cGroup}>
                  {modoEdicion && modoEdicionGrupos ? (
                    <AutoGrowField
                      className={styles.input}
                      value={fila.c}
                      onChange={(e) =>
                        actualizarIntegrante(index, 'c', e.target.value)
                      }
                    />
                  ) : (
                    fila.c
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {modoEdicion && !modoEdicionGrupos ? (
          <div className={styles.editGroupsWrap}>
            <button
              type="button"
              className={styles.editGroupsButton}
              onClick={() => setModoEdicionGrupos(true)}
            >
              Editar grupos
            </button>
          </div>
        ) : null}

        <br />

        <table
          className={`${styles.table} ${styles.program} ${
            modoEdicion ? styles.programEdit : styles.programView
          }`}
        >
          <thead>
            <tr>
              <th className={styles.thCronogram}>Semanas (Jue y Dom)</th>
              <th className={styles.thCronogram}>Grupo</th>
              {modoEdicion ? <th className={styles.thCronogram}>Accion</th> : null}
            </tr>
            {cronogramaMostrado.map((fila, index) => {
              const esAsamblea = fila.grupo.toUpperCase() === 'ASAMBLEA'
              return (
                <tr key={`semana-${index}`}>
                  <td className={styles.colSemana}>
                    {modoEdicion ? (
                      <AutoGrowField
                        className={styles.input}
                        value={fila.semana}
                        onChange={(e) => actualizarSemana(index, e.target.value)}
                      />
                    ) : (
                      fila.semana
                    )}
                  </td>
                  <td className={`${styles.colGrupo} ${esAsamblea ? styles.asamblea : `${styles.asignacion} ${colorGrupo(fila.grupo)}`}`}>
                    {modoEdicion ? (
                      <AutoGrowField
                        className={styles.input}
                        value={fila.grupo}
                        onChange={(e) => actualizarGrupo(index, e.target.value)}
                      />
                    ) : (
                      fila.grupo
                    )}
                  </td>
                  {modoEdicion ? (
                    <td className={styles.colAccion}>
                      <button
                        type="button"
                        className={styles.rowActionButton}
                        onClick={() => eliminarFilaCronograma(index)}
                        title="Eliminar fila"
                        aria-label="Eliminar fila"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </thead>
        </table>

        {modoEdicion ? (
          <div className={styles.addRowWrap}>
            <button
              type="button"
              className={styles.addRowButton}
              onClick={agregarFilaCronograma}
            >
              <Plus size={14} />
              Agregar fila
            </button>
          </div>
        ) : null}

        <div className={styles.buttonRow}>
          {!modoEdicion ? (
            <>
              <button
                type="button"
                className={styles.button}
                onClick={abrirEdicion}
              >
                Editar
              </button>
            </>
          ) : null}

          {modoEdicion ? (
            <>
              <button
                type="button"
                className={`${styles.button} ${styles.cancelButton}`}
                onClick={cancelarEdicion}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={recalcularFechasDesdeHoy}
                title="Actualizar fechas desde hoy"
                aria-label="Actualizar fechas desde hoy"
              >
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.saveButton}`}
                onClick={guardarEdicion}
              >
                Guardar
              </button>
            </>
          ) : null}
        </div>
      </section>
    </main>
  )
}

const colorGrupo = (grupo: string): string => {
  const upper = grupo.toUpperCase()
  if (upper === 'A') return styles.aa
  if (upper === 'B') return styles.bb
  if (upper === 'C') return styles.cc
  return ''
}

function generarParesJuevesDomingo(
  desde: Date,
  cantidad: number,
): Array<{ jueves: Date; domingo: Date }> {
  const pares: Array<{ jueves: Date; domingo: Date }> = []
  const primerJueves = juevesDeSemanaActual(desde)

  for (let i = 0; i < cantidad; i += 1) {
    const jueves = new Date(primerJueves)
    jueves.setDate(primerJueves.getDate() + i * 7)

    const domingo = new Date(jueves)
    domingo.setDate(jueves.getDate() + 3)

    pares.push({ jueves, domingo })
  }

  return pares
}

function juevesDeSemanaActual(base: Date): Date {
  const fecha = new Date(base)
  // Semana base lunes-domingo:
  // jueves = indice 3. Si hoy es viernes/sabado/domingo, da jueves ya pasado.
  const diaLunesCero = (fecha.getDay() + 6) % 7
  const diff = 3 - diaLunesCero
  fecha.setDate(fecha.getDate() + diff)
  return fecha
}

function formatearPar(jueves: Date, domingo: Date): string {
  const mesJueves = nombreMes(jueves)
  const mesDomingo = nombreMes(domingo)

  if (mesJueves === mesDomingo) {
    return `${jueves.getDate()} y ${domingo.getDate()} de ${mesJueves}`
  }

  return `${jueves.getDate()} de ${mesJueves} y ${domingo.getDate()} de ${mesDomingo}`
}

function nombreMes(fecha: Date): string {
  const nombre = fecha.toLocaleDateString('es-AR', { month: 'long' })
  return nombre.charAt(0).toUpperCase() + nombre.slice(1)
}

function esListaGrupos(valor: unknown): valor is Grupo[] {
  if (!Array.isArray(valor)) {
    return false
  }
  return valor.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Grupo).a === 'string' &&
      typeof (item as Grupo).b === 'string' &&
      typeof (item as Grupo).c === 'string',
  )
}

function esListaSemanas(valor: unknown): valor is Semana[] {
  if (!Array.isArray(valor)) {
    return false
  }
  return valor.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Semana).semana === 'string' &&
      typeof (item as Semana).grupo === 'string',
  )
}

type AutoGrowFieldProps = {
  value: string
  className?: string
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
}

function AutoGrowField({ value, className, onChange }: AutoGrowFieldProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = `${ref.current.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      rows={1}
      className={className}
      value={value}
      onChange={onChange}
    />
  )
}
