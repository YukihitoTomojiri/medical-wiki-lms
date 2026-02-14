-- お知らせと研修マニュアル(Wiki)の連携機能
-- 1. announcements テーブルに related_wiki_id カラム追加
ALTER TABLE announcements ADD COLUMN related_wiki_id BIGINT NULL;
ALTER TABLE announcements ADD CONSTRAINT fk_announcements_manual FOREIGN KEY (related_wiki_id) REFERENCES manuals(id);

-- 2. training_records テーブル新規作成（受講完了記録）
CREATE TABLE training_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    announcement_id BIGINT NOT NULL,
    manual_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tr_announcement FOREIGN KEY (announcement_id) REFERENCES announcements(id),
    CONSTRAINT fk_tr_manual FOREIGN KEY (manual_id) REFERENCES manuals(id),
    CONSTRAINT fk_tr_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uq_training_record UNIQUE (announcement_id, user_id)
);
