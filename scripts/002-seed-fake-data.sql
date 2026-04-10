-- 002: Seed fake homework data for elementary department
-- Run AFTER 001-elementary-students.sql

-- 1. Create default teacher if not exists
INSERT INTO wg_teachers (name, phone, email, subjects, status, notes)
SELECT '薇閣國小老師', '', '', '{}', 'active', '小學部門預設老師'
WHERE NOT EXISTS (SELECT 1 FROM wg_teachers WHERE name = '薇閣國小老師');

-- 2. Create today's session
INSERT INTO wg_homework_sessions (date, teacher_id, student_count, status)
SELECT CURRENT_DATE, t.id, 16, 'in_progress'
FROM wg_teachers t WHERE t.name = '薇閣國小老師'
ON CONFLICT (date, teacher_id) DO NOTHING;

-- 3. Insert homework items for each elementary student × 5 subjects
-- Using a CTE to get session_id and student_ids
WITH session AS (
  SELECT hs.id as session_id
  FROM wg_homework_sessions hs
  JOIN wg_teachers t ON hs.teacher_id = t.id
  WHERE t.name = '薇閣國小老師' AND hs.date = CURRENT_DATE
  LIMIT 1
),
students AS (
  SELECT id, name, grade FROM wg_students WHERE department = 'elementary' AND status = 'active'
)
INSERT INTO wg_homework_items (session_id, student_id, item_type, subject, description, due_date, status, source, confidence)
SELECT
  s.session_id,
  st.id,
  item.item_type,
  item.subject,
  item.description,
  item.due_date,
  'pending',
  'manual',
  'high'
FROM session s
CROSS JOIN students st
CROSS JOIN (VALUES
  -- 國語
  ('homework', '國語', '生字練習 L7 每個寫三遍', CURRENT_DATE),
  ('homework', '國語', '閱讀測驗第七課', CURRENT_DATE + INTERVAL '1 day'),
  -- 數學
  ('homework', '數學', '習作 p.52-53', CURRENT_DATE),
  ('test',     '數學', '第三單元小考', CURRENT_DATE + INTERVAL '3 days'),
  -- 英文
  ('homework', '英文', 'Workbook Unit 6 p.30-31', CURRENT_DATE + INTERVAL '1 day'),
  ('test',     '英文', '單字測驗 Unit 5-6', CURRENT_DATE + INTERVAL '5 days'),
  -- 自然
  ('homework', '自然', '觀察日記：植物生長記錄', CURRENT_DATE + INTERVAL '2 days'),
  -- 社會
  ('homework', '社會', '學習單第四單元', CURRENT_DATE + INTERVAL '1 day'),
  ('review',   '社會', '複習第三、四單元', CURRENT_DATE + INTERVAL '7 days')
) AS item(item_type, subject, description, due_date);
