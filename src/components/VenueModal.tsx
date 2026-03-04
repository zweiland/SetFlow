import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Venue } from '../types'

interface VenueModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: VenueFormData) => void
  venue?: Venue | null
}

export interface VenueFormData {
  name: string
  address: string
  city: string
  notes: string
}

export function VenueModal({ open, onClose, onSave, venue }: VenueModalProps) {
  const emptyForm: VenueFormData = { name: '', address: '', city: '', notes: '' }
  const [form, setForm] = useState<VenueFormData>(emptyForm)

  useEffect(() => {
    if (venue) {
      setForm({
        name: venue.name,
        address: venue.address ?? '',
        city: venue.city ?? '',
        notes: venue.notes ?? '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [venue, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">
              {venue ? 'Edit Venue' : 'New Venue'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field
                label="Name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                required
                autoFocus
              />
              <Field
                label="Address"
                value={form.address}
                onChange={(v) => setForm({ ...form, address: v })}
                placeholder="Optional"
              />
              <Field
                label="City"
                value={form.city}
                onChange={(v) => setForm({ ...form, city: v })}
                placeholder="Optional"
              />
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  placeholder="Stage size, load-in details, contacts..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent-hover"
                >
                  {venue ? 'Save' : 'Add Venue'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({
  label, value, onChange, placeholder, required, autoFocus,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean; autoFocus?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-text-secondary">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
      />
    </div>
  )
}
