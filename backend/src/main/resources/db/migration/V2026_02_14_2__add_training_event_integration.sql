-- お知らせへの研修会連携機能
ALTER TABLE announcements ADD COLUMN related_event_id BIGINT NULL;
ALTER TABLE announcements ADD COLUMN related_type VARCHAR(20) NULL;

ALTER TABLE announcements ADD CONSTRAINT fk_announcements_event FOREIGN KEY (related_event_id) REFERENCES training_events(id);

-- 既存データ移行: wiki_idがあるものは type='WIKI' とする
UPDATE announcements SET related_type = 'WIKI' WHERE related_wiki_id IS NOT NULL;
