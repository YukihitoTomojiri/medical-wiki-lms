SET NAMES utf8mb4;
SET GLOBAL time_zone = '+09:00';
SET time_zone = '+09:00';
-- 社内Wiki & 学習管理システム データベース初期化

-- Users テーブル
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    facility VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    role ENUM('ADMIN', 'USER', 'DEVELOPER') NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Manuals テーブル
CREATE TABLE IF NOT EXISTS manuals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    author_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Progress テーブル（読了履歴）
CREATE TABLE IF NOT EXISTS progress (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    manual_id BIGINT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (manual_id) REFERENCES manuals(id),
    UNIQUE KEY unique_user_manual (user_id, manual_id)
);

-- 初期データ投入

-- 開発者ユーザー (パスワード: dev123)
INSERT INTO users (employee_id, password, name, facility, department, role) VALUES
('dev', '$2a$10$FlL2N.pYSZnN4oNnnaj1dukTndbXylRkHdBwS/G2eIGeyJXs/suBa', '開発者', 'システム開発部', '開発チーム', 'DEVELOPER');

-- 管理者ユーザー (パスワード: admin123)
INSERT INTO users (employee_id, password, name, facility, department, role) VALUES
('admin', '$2a$10$FlL2N.pYSZnN4oNnnaj1dukTndbXylRkHdBwS/G2eIGeyJXs/suBa', '山田 太郎', '本館', '管理部', 'ADMIN');

-- 一般ユーザー (パスワード: user123)
INSERT INTO users (employee_id, password, name, facility, department, role) VALUES
-- 本館
('honkan001', '$2a$10$10jgBy81pvwC5VHlaOjYqut.OKFm3Z1K58dzWD3Hg8Pwqj/EErS8a', '佐藤 美咲', '本館', '外来・医事課', 'USER'),
('honkan002', '$2a$10$10jgBy81pvwC5VHlaOjYqut.OKFm3Z1K58dzWD3Hg8Pwqj/EErS8a', '伊藤 健一', '本館', 'リハビリテーション科', 'USER'),
('honkan003', '$2a$10$10jgBy81pvwC5VHlaOjYqut.OKFm3Z1K58dzWD3Hg8Pwqj/EErS8a', '斉藤 優子', '本館', '地域包括ケア病棟', 'USER'),
('honkan004', '$2a$10$10jgBy81pvwC5VHlaOjYqut.OKFm3Z1K58dzWD3Hg8Pwqj/EErS8a', '岡田 健太', '本館', '医療療養病棟', 'USER'),
('honkan005', '$2a$10$10jgBy81pvwC5VHlaOjYqut.OKFm3Z1K58dzWD3Hg8Pwqj/EErS8a', '松本 直美', '本館', '一般病棟', 'USER'),
('honkan006', '$2a$10$10jgBy81pvwC5VHlaOjYqut.OKFm3Z1K58dzWD3Hg8Pwqj/EErS8a', '清水 浩二', '本館', '障害者施設等病棟', 'USER'),

-- 南棟
('minami001', '$2a$10$10jgBy81pvwC5VHlaOjYqut.OKFm3Z1K58dzWD3Hg8Pwqj/EErS8a', '渡辺 節子', '南棟', '介護医療院 事務室', 'USER'),
('minami002', '$2a$10$10jgBy81pvwC5VHlaOjYqut.OKFm3Z1K58dzWD3Hg8Pwqj/EErS8a', '近藤 誠', '南棟', '医療療養病棟', 'USER'),
('minami003', '$2a$10$10jgBy81pvwC5VHlaOjYqut.OKFm3Z1K58dzWD3Hg8Pwqj/EErS8a', '石川 美咲', '南棟', '介護医療院(3F)', 'USER'),
('minami004', '$2a$10$10jgBy81pvwC5VHlaOjYqut.OKFm3Z1K58dzWD3Hg8Pwqj/EErS8a', '山崎 剛', '南棟', '介護医療院(4F)', 'USER'),
('minami005', '$2a$10$10jgBy81pvwC5VHlaOjYqut.OKFm3Z1K58dzWD3Hg8Pwqj/EErS8a', '中島 桃子', '南棟', '医療療養病棟', 'USER'),
('minami006', '$2a$10$10jgBy81pvwC5VHlaOjYqut.OKFm3Z1K58dzWD3Hg8Pwqj/EErS8a', '山口 翔大', '南棟', '透析センター', 'USER'),

-- ひまわりの里病院
('hima001', '$2a$10$10jgBy81pvwC5VHlaOjYqut.OKFm3Z1K58dzWD3Hg8Pwqj/EErS8a', '小林 玲奈', 'ひまわりの里病院', '認知症病棟', 'USER'),
('hima002', '$2a$10$10jgBy81pvwC5VHlaOjYqut.OKFm3Z1K58dzWD3Hg8Pwqj/EErS8a', '加藤 拓也', 'ひまわりの里病院', '精神科病棟', 'USER'),

-- あおぞら中央クリニック
('aozo001', '$2a$10$10jgBy81pvwC5VHlaOjYqut.OKFm3Z1K58dzWD3Hg8Pwqj/EErS8a', '吉田 さやか', 'あおぞら中央クリニック', '1F(受付/外来)', 'USER'),
('aozo002', '$2a$10$10jgBy81pvwC5VHlaOjYqut.OKFm3Z1K58dzWD3Hg8Pwqj/EErS8a', '佐々木 大輔', 'あおぞら中央クリニック', '2F(病棟)', 'USER');

-- サンプルマニュアル
INSERT INTO manuals (title, content, category, author_id) VALUES
('電子カルテ操作マニュアル - 基本編', '# 電子カルテ操作マニュアル - 基本編\n\n## 1. はじめに\nこのマニュアルでは、日常業務で使用する電子カルテシステムの基本的な操作方法について解説します。\n\n## 2. ログイン手順\n1. デスクトップ上の「電子カルテ」アイコンをダブルクリックします。\n2. **職員ID**と**パスワード**を入力してください。\n   - パスワードを3回間違えるとロックがかかります。ロック解除はシステム管理課（内線: 1234）までご連絡ください。\n3. 「ログイン」ボタンをクリックします。\n\n## 3. 患者検索\nトップ画面の検索バーに、以下のいずれかを入力して検索します。\n- 患者ID\n- 氏名（漢字またはカナ）\n- 生年月日 (例: 19800101)\n\n> [!IMPORTANT]\n> 同姓同名の患者様にご注意ください。生年月日とIDでの本人確認を徹底しましょう。', '電子カルテ操作', 1),

('標準予防策（スタンダードプリコーション）', '# 標準予防策（スタンダードプリコーション）\n\n## 目的\nあらゆる患者の血液、体液、排泄物、損傷した皮膚、粘膜を感染源とみなして対応し、感染リスクを低減させること。\n\n## 具体的な対策\n\n### 1. 手指衛生\n最も基本的かつ重要な対策です。\n- **タイミング**: 患者に触れる前後、清潔操作の前、体液曝露の可能性がある場合、環境に触れた後。\n- **方法**: 流水と石鹸による手洗い、または擦式アルコール製剤。\n\n### 2. 個人防護具 (PPE) の使用\n曝露のリスクに応じて適切に選択します。\n- **手袋**: 血液・体液に触れる可能性がある場合\n- **マスク・ゴーグル**: 飛沫が飛ぶ可能性がある場合\n- **ガウン**: 衣服が汚染される可能性がある場合\n\n> [!WARNING]\n> 使用済みのPPEは、病室を出る前に適切に廃棄してください。', '感染対策', 1),

('インシデント・アクシデント報告書の書き方', '# インシデント・アクシデント報告書の書き方\n\n## 報告の目的\n個人の責任を追及するのではなく、事例を共有し、システムとしての再発防止策を検討するために行います。\n\n## 報告の基準\n- **インシデント**: 患者に影響はなかったが、ヒヤリとした・ハッとした事例。\n- **アクシデント**: 患者になんらかの影響（軽微なものも含む）が生じた事例。\n\n## 記入のポイント\n1. **5W1H**を意識して具体的に記述する。\n2. 「憶測」と「事実」を区別して記載する。\n3. **24時間以内**に提出する。\n\n### 記述例\n- 悪い例: 「点滴を間違えそうになった」\n- 良い例: 「〇時〇分、A氏の点滴準備中、隣のベッドのB氏の薬剤を取り違えそうになったが、指差し確認で気づき未然に防いだ」', '医療安全', 1),

('施設利用案内 - 食堂・休憩室', '# 施設利用案内 - 食堂・休憩室\n\n## 職員食堂\n- **営業時間**: 11:00 - 14:00 (ラストオーダー 13:45)\n- **場所**: 本館地下1階\n- **利用方法**: 食券を購入し、カウンターで受け取ってください。給与天引き利用の場合はIDカードをリーダーにかざしてください。\n\n## 休憩室\n各フロアに職員用休憩室があります。\n- 冷蔵庫、電子レンジ、ポット完備。\n- **利用上の注意**:\n  - ゴミは分別して捨ててください。\n  - 私物には必ず名前を記入してください。\n  - 最後の利用者は消灯と空調の確認をお願いします。', '施設案内', 1),

('火災発生時の対応', '# 火災発生時の対応\n\n## 1. 発見時の行動\n1. **大声で周囲に知らせる**（「火事だー！」）。\n2. 近くの**火災報知器**を押す。\n3. 消化器で**初期消火**を試みる（天井に火が届く前まで）。\n\n## 2. 避難誘導\n- エレベーターは**絶対に使用しない**。\n- 患者様を優先し、階段で避難する。\n- 煙を吸わないよう、低い姿勢でハンカチ等で口を覆う。\n\n## 3. 通報連絡\n- 防災センター（内線: 999）へ連絡。\n- 状況（場所、燃えているもの、怪我人の有無）を簡潔に伝える。', '医療安全', 1);

-- サンプル読了履歴
INSERT INTO progress (user_id, manual_id, read_at) VALUES
(2, 1, '2026-01-20 10:30:00'),
(2, 2, '2026-01-21 14:00:00'),
(3, 1, '2026-01-19 09:00:00'),
(3, 4, '2026-01-22 17:00:00');

