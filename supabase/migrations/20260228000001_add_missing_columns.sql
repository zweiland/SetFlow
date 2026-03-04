-- ============================================
-- SetFlow: Align schema with design brief
-- ============================================

-- Songs: add artist and notes fields
alter table songs add column artist text;
alter table songs add column notes text;

-- Setlists: add description and archive support
alter table setlists add column description text;
alter table setlists add column is_archived boolean not null default false;

-- Practice logs: track session duration
alter table practice_logs add column duration_seconds integer;
