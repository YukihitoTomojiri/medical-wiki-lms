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

```mermaid
graph TD
    subgraph DockerContainer ["Docker Compose (Encapsulated)"]
        A["Frontend (React / Vite)"] <--> B["Backend (Spring Boot API)"]
        B <--> C[("Database (MySQL 8.0)")]
    end
    User((User)) --> A
```

- **Frontend**: React / Vite (モダンなUI/UX、M3デザイン採用)
- **Backend**: Java 17 / Spring Boot 3 / Spring Data JPA
- **Database**: MySQL 8.0 (Dockerコンテナ内で管理)
- **Infrastructure**: Docker Compose による完全コンテナ化

## 3. Role & Permissions
システム内の役割に基づいた詳細な権限マトリクスです。

| 機能 | **ROLE_USER** (一般) | **ROLE_ADMIN** (管理者) | **ROLE_DEVELOPER** (開発) |
| :--- | :---: | :---: | :---: |
| **自分の申請閲覧・作成** | ◯ | ◯ | ◯ |
| **施設内の全職員の申請承認** | × | ◯ | ◯ |
| **施設情報の管理** | × | ◯ | ◯ |
| **全施設のデータ閲覧 (バイパス)** | × | × | **◯** |
| **システム設定・ログ監視** | × | × | ◯ |

> [!IMPORTANT]
> **ROLE_DEVELOPER** は施設フィルタをバイパスし、組織横断的なデータ分析やトラブルシューティングが可能です。

## 4. Operation Guide (AI向け)
### Login (テスト用アカウント)
| 権限 | 職員番号 | パスワード |
| :--- | :--- | :--- |
| **開発者** | `dev` | `admin123` |
| **管理者** | `admin` | `admin123` |
| **一般職員** | `honkan001` | `user123` |

### Pages & Features
- **ダッシュボード（統計確認）**: 施設全体の利用統計、進捗状況を一覧表示。(`ADMIN`, `DEVELOPER` は全職員、`USER` は自分のみ)
- **有給申請（申請・承認フロー）**: 職員が作成し、`ADMIN` が承認を行う。ワークフローの全工程を追跡可能。
- **開発者用コンソール（ログ確認）**: `DEVELOPER` 専用。稼働ログ、メモリ/ディスク使用率、セキュリティアラートをリアルタイム監視。

## 5. Latest Updates (History)
直近の重要アップデート履歴です。

- **開発者ダッシュボードの統計カード整列と干渉の修正**: 視認性と操作性の向上。
- **操作デモ動画（WebP）の追加**: 視覚的なマニュアルの拡充。
- **サイドバーのスクロール領域拡張と開発者メニューの配置最適化**: メニュー操作性の向上。
- **開発者コンソールの Sticky 配置とレイアウト干渉防止**: 大画面での作業効率化。
- **プロジェクト名称を Medivisor へ変更**: ブランド刷新。
- **ROLE_DEVELOPER による施設フィルタバイパス実装**: 開発・監査効率の向上。
