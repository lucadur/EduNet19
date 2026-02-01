# ✅ ESEGUI QUESTO SQL - Bucket Gallery

## 🎯 Problema

```
Error: StorageApiError: Bucket not found
```

## ✅ Soluzione Rapida

### Esegui questo SQL su Supabase:

```sql
-- Crea il bucket profile-gallery
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-gallery',
  'profile-gallery',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
```

### Come eseguirlo:

1. Vai su **Supabase Dashboard** → **SQL Editor**
2. Copia e incolla il codice sopra
3. Clicca **Run**

### Verifica:

Vai su **Storage** nel menu laterale e dovresti vedere il bucket **profile-gallery**.

### Testa:

1. Ricarica la pagina con **Ctrl+F5**
2. Vai al tab **Gallery**
3. Carica una foto

Ora dovrebbe funzionare! 🎉
