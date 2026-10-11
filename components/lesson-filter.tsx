'use client';

import { useId } from 'react';
import { LESSONS, type LessonRange } from '@/app/course-lessons';
import './lesson-filter.css';

export function LessonFilter({ value, onChange, disabled = false }: { value?: LessonRange; onChange: (value?: LessonRange) => void; disabled?: boolean }) {
  const id = useId();
  return <fieldset className="lesson-filter" disabled={disabled}>
    <legend>Lecciones</legend>
    <label htmlFor={`${id}-scope`}>Contenido
      <select id={`${id}-scope`} value={value ? 'range' : 'all'} onChange={event => onChange(event.target.value === 'all' ? undefined : { from: 1, to: 5 })}>
        <option value="all">Todo el contenido</option><option value="range">Elegir lecciones del curso</option>
      </select>
    </label>
    {value && <>
      <label htmlFor={`${id}-from`}>Desde
        <select id={`${id}-from`} value={value.from} onChange={event => { const from = Number(event.target.value); onChange({ from, to: Math.max(from, value.to) }); }}>
          {LESSONS.map(lesson => <option key={lesson} value={lesson}>Lección {lesson}</option>)}
        </select>
      </label>
      <label htmlFor={`${id}-to`}>Hasta
        <select id={`${id}-to`} value={value.to} onChange={event => { const to = Number(event.target.value); onChange({ from: Math.min(value.from, to), to }); }}>
          {LESSONS.map(lesson => <option key={lesson} value={lesson}>Lección {lesson}</option>)}
        </select>
      </label>
    </>}
    <small>{value ? 'Incluye ambas lecciones. Para estudiar una sola, elige el mismo número.' : 'Incluye también el contenido adicional de la biblioteca.'}</small>
  </fieldset>;
}
