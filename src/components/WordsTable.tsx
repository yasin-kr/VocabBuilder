import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { Word } from '../types';
import { Icon } from './Icon';
import { Progress } from './Progress';
import { capitalize, categoryLabel } from '../lib/locale';

const column = createColumnHelper<Word>();
export function WordsTable({
  words,
  scope,
  busyId,
  addedIds,
  onEdit,
  onDelete,
  onAdd,
}: {
  words: Word[];
  scope: 'own' | 'all';
  busyId: string | null;
  addedIds: Set<string>;
  onEdit: (word: Word) => void;
  onDelete: (word: Word) => void;
  onAdd: (word: Word) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openId) return;
    const close = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.word-actions')) setOpenId(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        wrapper.current
          ?.querySelector<HTMLButtonElement>(`[data-word-id="${CSS.escape(openId)}"]`)
          ?.focus();
        setOpenId(null);
      }
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', escape);
    };
  }, [openId]);
  const columns = useMemo(
    () => [
      column.accessor('en', {
        header: () => (
          <span className="table-heading">
            Kelime
            <Icon name="flag-uk" size={28} />
          </span>
        ),
        cell: (info) => capitalize(info.getValue()),
      }),
      column.accessor('tr', {
        header: () => (
          <span className="table-heading">
            Çeviri
            <Icon name="flag-tr" size={28} />
          </span>
        ),
        cell: (info) => capitalize(info.getValue(), 'tr'),
      }),
      column.accessor('category', {
        header: 'Kategori',
        cell: (info) => categoryLabel(info.getValue()),
      }),
      ...(scope === 'own'
        ? [
            column.accessor('progress', {
              header: 'İlerleme',
              cell: (info) => <Progress value={info.getValue() ?? 0} />,
            }),
          ]
        : []),
      column.display({
        id: 'actions',
        header: () => <span className="sr-only">İşlemler</span>,
        cell: ({ row }) =>
          scope === 'own' ? (
            <div className="word-actions">
              <button
                type="button"
                className="icon-button actions-toggle"
                aria-label={`${row.original.en} için işlemler`}
                data-word-id={row.original._id}
                aria-expanded={openId === row.original._id}
                aria-haspopup="true"
                disabled={busyId === row.original._id}
                onClick={() => setOpenId(openId === row.original._id ? null : row.original._id)}
              >
                <Icon name="more" size={20} />
              </button>
              {openId === row.original._id && (
                <div className="actions-popover">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenId(null);
                      onEdit(row.original);
                    }}
                  >
                    <Icon name="edit" size={18} />
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenId(null);
                      onDelete(row.original);
                    }}
                  >
                    <Icon name="trash" size={18} />
                    Sil
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="text-button add-to-dictionary"
              onClick={() => onAdd(row.original)}
              disabled={busyId === row.original._id || addedIds.has(row.original._id)}
              aria-label={
                addedIds.has(row.original._id)
                  ? `${row.original.en} sözlüğe eklendi`
                  : `${row.original.en} kelimesini sözlüğe ekle`
              }
            >
              <span>
                {busyId === row.original._id
                  ? 'Ekleniyor…'
                  : addedIds.has(row.original._id)
                    ? 'Eklendi'
                    : 'Sözlüğe ekle'}
              </span>
              <Icon name={addedIds.has(row.original._id) ? 'check' : 'arrow-right'} size={20} />
            </button>
          ),
      }),
    ],
    [scope, openId, busyId, addedIds, onEdit, onDelete, onAdd],
  );
  const table = useReactTable({ data: words, columns, getCoreRowModel: getCoreRowModel() });
  return (
    <div className={`table-card table-${scope}`} ref={wrapper}>
      <table className="words-table">
        <caption className="sr-only">
          {scope === 'own'
            ? 'Sözlüğünüz ve öğrenme ilerlemeniz'
            : 'Sözlüğünüze ekleyebileceğiniz önerilen kelimeler'}
        </caption>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th className={`col-${header.column.id}`} key={header.id} scope="col">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  className={`col-${cell.column.id}`}
                  key={cell.id}
                  lang={cell.column.id === 'en' ? 'en' : 'tr'}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
