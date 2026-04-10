-- 003: Progress tracking for 進度 tab
-- Each row = one task assigned to a student for a specific date

CREATE TABLE IF NOT EXISTS wg_progress_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES wg_students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'needs_correction', 'done', 'carried')),
  carried_from DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wg_progress_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON wg_progress_items FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE INDEX idx_progress_items_student_date ON wg_progress_items(student_id, date);
CREATE INDEX idx_progress_items_date ON wg_progress_items(date DESC);
CREATE INDEX idx_progress_items_status ON wg_progress_items(status) WHERE status != 'done';
