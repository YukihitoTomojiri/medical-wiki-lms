# 医療・介護 業務支援統合システム「Medivisor」 🏥

## 1. Download & Setup
システムの導入は以下の3ステップで完了します。

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/YukihitoTomojiri/medical-wiki-lms.git
   ```
2. **ディレクトリへ移動**
   ```bash
   cd medical-wiki-lms
   ```
3. **システムの起動**
   ```bash
   docker compose up --build
   ```

## 2. System Architecture
AI解析用に最適化されたシステム構成の概要です。

- **Frontend**: React / Vite (モダンなUI/UX、M3デザイン採用)
- **Backend**: Java 17 / Spring Boot 3 / Spring Data JPA
- **Database**: MySQL 8.0 (Dockerコンテナ内で管理)
- **Infrastructure**: Docker Compose による完全コンテナ化

## 3. Operation Guide (AI向け)
### Login (テスト用アカウント)
| 権限 | 職員番号 | パスワード |
| :--- | :--- | :--- |
| **開発者** | `dev` | `admin123` |
| **管理者** | `admin` | `admin123` |
| **一般職員** | `honkan001` | `user123` |

### Pages & Features
- **ダッシュボード（統計確認）**: 施設全体の利用統計、進捗状況、アラートを一覧表示。
- **有給申請（申請・承認フロー）**: 職員からの有給・勤怠申請に対し、管理者が承認・却下を行うワークフロー。
- **開発者用コンソール（ログ確認）**: システムの稼働ログ、メモリ/ディスク使用率、セキュリティアラートのリアルタイム監視。

## 4. Latest Updates (History)
直近の重要アップデート履歴です。

- **サイドバーのスクロール領域拡張と開発者メニューの配置最適化**: メニュー操作性の向上。
- **開発者コンソールの Sticky 配置とレイアウト干渉防止**: 大画面での作業効率化。
- **プロジェクト名称を Medivisor へ変更**: ブランド刷新。
- **ROLE_DEVELOPER による施設フィルタバイパス実装**: 開発効率の向上。
