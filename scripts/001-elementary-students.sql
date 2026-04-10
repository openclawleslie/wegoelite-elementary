-- Add department column to shared wg_students table
ALTER TABLE wg_students ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'middle';

-- Update all existing students to middle school
UPDATE wg_students SET department = 'middle' WHERE department IS NULL;

-- Insert elementary students
INSERT INTO wg_students (name, grade, status, department, parent_name, parent_phone, parent_line_id, email, notes, class)
VALUES
  ('羅心妤', '小三', 'active', 'elementary', '', '', '', '', '', ''),
  ('吳承鈞', '小三', 'active', 'elementary', '', '', '', '', '', ''),
  ('吳承恩', '小六', 'active', 'elementary', '', '', '', '', '', ''),
  ('陳歆沅', '小四', 'active', 'elementary', '', '', '', '', '', ''),
  ('李嘉甯', '小五', 'active', 'elementary', '', '', '', '', '', ''),
  ('李尚娜', '小四', 'active', 'elementary', '', '', '', '', '', ''),
  ('柯又誠', '小一', 'active', 'elementary', '', '', '', '', '', ''),
  ('柯又嘉', '小三', 'active', 'elementary', '', '', '', '', '', ''),
  ('潘慕恩', '小四', 'active', 'elementary', '', '', '', '', '', ''),
  ('林昕澄', '小四', 'active', 'elementary', '', '', '', '', '', ''),
  ('Lucas', '小二', 'active', 'elementary', '', '', '', '', '', ''),
  ('楊程傑', '小六', 'active', 'elementary', '', '', '', '', '', ''),
  ('楊程涵', '小六', 'active', 'elementary', '', '', '', '', '', ''),
  ('陳姵妍', '小六', 'active', 'elementary', '', '', '', '', '', ''),
  ('陳姵樺', '小六', 'active', 'elementary', '', '', '', '', '', ''),
  ('陳世璿', '小三', 'active', 'elementary', '', '', '', '', '', '');
