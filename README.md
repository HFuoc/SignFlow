# SmartGlove Dataset Studio

Ứng dụng desktop chuẩn bị dataset cảm biến cho dự án găng tay nhận diện cử chỉ. React + FastAPI + PyWebView là collector mặc định; PySide6 được giữ làm rollback rõ ràng. Cả hai hiện chỉ dùng simulator; chưa đọc ESP32, chưa ghi dataset và không train model.

## Yêu cầu

- Windows 10/11.
- Python 3.12 và `uv`.
- Node.js 20+ và npm để build/test React collector.
- Không cần GPU.

## Cài Python

```powershell
uv python install 3.12
uv venv --python 3.12 .venv
uv pip install --python .\.venv\Scripts\python.exe -e ".[test]"
```

## Chạy React/PyWebView collector mặc định

Launcher build source React mới nhất rồi mở PyWebView:

```powershell
.\run_app.ps1
```

Lần chạy đầu tiên, ứng dụng yêu cầu tạo đúng một quản trị viên cục bộ; không có username
hay password mặc định. Các lần sau đăng nhập bằng account đã được administrator cấp.
Identity database nằm trong user-data directory của hệ điều hành, không nằm trong repo.

Dùng lại production build hiện có:

```powershell
.\run_app.ps1 -SkipBuild
```

Nếu build bị thiếu, `-SkipBuild` sẽ dừng và yêu cầu chạy lại lệnh mặc định. Launcher
không tự chạy `npm install` hoặc `npm ci`.

PySide rollback:

```powershell
.\run_app.ps1 -Legacy
.\run_app.ps1 -Legacy -NoAutoConnect
```

Thêm `-SmokeTest` vào lệnh mặc định, `-SkipBuild` hoặc `-Legacy` để chạy smoke hữu hạn.

## Development React collector

Cài dependency web một lần:

```powershell
Set-Location app\desktop_collector\web
npm install
```

Development cần hai PowerShell. Terminal 1:

```powershell
Set-Location app\desktop_collector\web
npm run dev -- --host 127.0.0.1 --port 5173
```

Terminal 2, từ repository root:

```powershell
.\.venv\Scripts\python.exe -m app.desktop_collector.shell --dev --vite-origin http://127.0.0.1:5173
```

Có thể build và mở shell production trực tiếp khi chẩn đoán:

```powershell
Set-Location app\desktop_collector\web
npm run build
Set-Location ..\..\..
.\.venv\Scripts\python.exe -m app.desktop_collector.shell
```

`web/build/`, `node_modules/`, coverage và Playwright artifacts đều bị Git ignore. Production build được giữ local để `-SkipBuild` sử dụng và không được commit.

## Local security boundary

- Server chỉ bind `127.0.0.1` trên port trống được chọn lúc chạy.
- Mỗi shell tạo token ngẫu nhiên trong RAM. Fragment mang token được React đọc một lần rồi xóa khỏi URL; token không vào storage hoặc log.
- User session là lớp riêng: opaque credential trong cookie HttpOnly/SameSite, server giữ
  hash, expiry/revocation và role; không lưu trong browser storage hay URL.
- REST điều khiển và WebSocket telemetry đều xác thực bridge token, user session, Host,
  Origin và quyền tương ứng.
- Development mode vẫn giữ toàn bộ bảo vệ và không dùng CORS wildcard.
- Đóng cửa sổ sẽ dừng simulator, acquisition workers, WebSocket và Uvicorn.

## Chức năng hiện có

- Device Manager cho hai găng mô phỏng độc lập, connect/disconnect, seed, noise, sample rate và packet loss.
- Live Monitor cho 13 kênh raw, sample rate, packet loss, standard deviation, peak-to-peak và trạng thái kênh.
- Bật/tắt từng đường, cửa sổ 5/10/30/60 giây, cursor/drag zoom, reset live và pause chart mà không dừng acquisition.
- Light/dark, keyboard focus, reduced-motion và ký hiệu `L/R` + nét liền/đứt ngoài màu sắc.
- First-run administrator, login/logout, account/password flow và khôi phục session cục bộ.
- RBAC `participant`/`researcher`/`administrator`/`developer`; administrator có user
  management và authentication audit, participant có account/access-limited screen.
- P.2.1 Runtime Activity: Now Bar cho trạng thái telemetry/pause/kết nối hiện tại và
  Notification Center RAM-only (tối đa 50 mục) với unread/read/dismiss/clear, action dựa
  trên command hiện có và kết quả quản trị lọc theo role. Tính năng này không ghi dataset.

## Kiểm thử

```powershell
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m app.desktop_collector.main --smoke-test
.\.venv\Scripts\python.exe -m app.desktop_collector.shell --smoke-test

Set-Location app\desktop_collector\web
npm test
npm run build
npm run test:e2e
```

Ảnh review P.1 nằm trong `.design-cache/artifacts/product-p1/` và không được Git track.
Bốn ảnh review P.2.1 và manifest/verification nằm trong
`.design-cache/artifacts/product-p2-1/`; automated browser gate đã đạt, visual gate đang
chờ người dùng duyệt.

## Ranh giới hiện tại

- D.2.6 Stage 2B.3.1 và One UI V.2.1/P.1 hiện tại đã được user duyệt visual; implementation
  hiện tại là visual baseline và không cần refinement bổ sung. F42/F43/F44 tiếp tục frozen;
  human NVDA/Narrator spoken-output vẫn chưa được xác minh.
- M1.1 còn mở vì Phase E cleanup cần phê duyệt và hoàn tất riêng. Chỉ P.2.1 Runtime
  Activity đã được duyệt và triển khai, automated suites đạt và đang chờ visual approval;
  phần P.2 khác, V.3,
  Phase E và M2 chưa bắt đầu. PySide UI, Qt adapter và dependency Qt được giữ nguyên.
- Không có firmware, Serial/COM, protocol v1 hoặc legacy adapter.
- P.1 chỉ persist identity/auth; chưa có Data Capture, raw dataset persistence,
  participant collection, Calibration, Dataset Browser hay Filter Preview.
- Không có PyTorch, TensorFlow hoặc code train model.
- Không sửa prototype người dùng tại `app/frontend/index.html`, `app/frontend/desktop/` hoặc `app/frontend/mobile/`.

Xem [PRODUCT_CONTEXT](docs/PRODUCT_CONTEXT.md), [ARCHITECTURE](docs/ARCHITECTURE.md),
[AUTH_PERSISTENCE](docs/AUTH_PERSISTENCE.md), [DATA_SCHEMA](docs/DATA_SCHEMA.md),
[ASSET_INVENTORY](docs/ASSET_INVENTORY.md) và [SESSION_LOG](docs/SESSION_LOG.md).
