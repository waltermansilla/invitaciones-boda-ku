-- Invitados creados desde RSVP sin ?i=: sin link personalizado ni re-edición en la invitación.
ALTER TABLE public.invitados
  ADD COLUMN IF NOT EXISTS registro_auto_rsvp BOOLEAN NOT NULL DEFAULT FALSE;
