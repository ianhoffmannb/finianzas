import { useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  label: string;
  month: string;
  onUploaded: (path: string) => void;
}

export function ReceiptDropzone({ label, month, onUploaded }: Props) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!user) return;
    setBusy(true);
    setError(null);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${user.id}/${month.slice(0, 7)}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('receipts').upload(path, file, { upsert: false });
    setBusy(false);
    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    onUploaded(path);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ font: '500 12.5px Outfit, sans-serif', color: 'var(--hogar-muted)' }}>{label}</span>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        style={{
          height: 210,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: dragging ? '#1B2740' : 'var(--color-surface)',
          borderRadius: 16,
          cursor: 'pointer',
          overflow: 'hidden',
          border: dragging ? '1.5px solid var(--color-accent)' : 'none',
        }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ font: '400 13px Outfit, sans-serif', color: 'var(--color-graphite)' }}>{busy ? 'Subiendo…' : 'Arrastra la foto'}</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {error && <span style={{ font: '400 12px Outfit, sans-serif', color: '#E3564A' }}>{error}</span>}
    </div>
  );
}
