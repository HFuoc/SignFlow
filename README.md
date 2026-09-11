# SignFlow — SmartGlove Dataset Studio

Ứng dụng desktop cho dự án găng tay nhận diện cử chỉ, dùng React, FastAPI và PyWebView. Hiện chạy hai găng **mô phỏng**, có tài khoản cục bộ và biểu đồ 13 kênh cảm biến. Không cần găng thật hoặc GPU để chạy thử.

Studio có Overview, Dataset, MediaPipe, Train, Evaluate và Translate nhưng hiện chỉ là giao diện và cấu hình tạm trong bộ nhớ. Chưa có kết nối ESP32/Serial/BLE, ghi dataset, camera/MediaPipe, huấn luyện hoặc suy luận.

## 1. Yêu cầu trên Windows

- Windows 10/11, PowerShell, Git và `uv`.
- Python **3.12** (launcher yêu cầu đúng phiên bản).
- Node.js **22.12+ trong nhánh 22** hoặc **24.x**, kèm npm.
- Microsoft Edge WebView2 Runtime để mở cửa sổ desktop; Edge cho E2E mặc định.
- Internet khi tải dependency lần đầu.

Nếu chưa có công cụ, có thể cài bằng Windows Package Manager:

```powershell
winget install --id Git.Git -e
winget install --id astral-sh.uv -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Microsoft.EdgeWebView2Runtime -e
```

Mở lại PowerShell và kiểm tra `git --version`, `uv --version`, `node --version`, `npm.cmd --version`.

## 2. Tải source và cài dependency

```powershell
git clone https://github.com/HFuoc/SignFlow.git
Set-Location SignFlow
uv python install 3.12
uv venv --python 3.12 .venv
uv pip install --python .\.venv\Scripts\python.exe -e ".[test]"
Push-Location app\desktop_collector\web
npm.cmd ci
Pop-Location
```

Chỉ tạo `.venv` nếu thư mục đó chưa tồn tại. Không cần activate môi trường; các lệnh dùng Python trực tiếp trong `.venv`. `npm.cmd ci` cài theo `package-lock.json`, không dùng thư mục `node_modules` chép từ máy khác.

## 3. Chạy app

Từ thư mục gốc `SignFlow`:

```powershell
.\run_app.ps1
```

Launcher build React rồi mở PyWebView; không tự cài dependency. Không cần mở backend riêng. Nếu PowerShell chặn script, cho phép riêng terminal hiện tại rồi chạy lại:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\run_app.ps1
```

Sau khi build thành công, mở nhanh bằng `.\run_app.ps1 -SkipBuild`. Sau khi cập nhật frontend, chạy không kèm `-SkipBuild` để build source mới.

### Lần đầu và sử dụng thử

1. Tạo quản trị viên cục bộ ở màn hình setup. Không có username/password mặc định; mật khẩu tối thiểu 12 ký tự.
2. Đăng nhập; quản trị viên có thể tạo tài khoản và phân quyền. Role `participant` không được vào collector.
3. Mở **Devices**, kết nối nguồn mô phỏng trái/phải; chỉnh sample rate, noise và packet loss nếu cần.
4. Mở **Monitor** để xem 13 kênh. Pause chỉ dừng hiển thị, acquisition vẫn tiếp tục. Có bật/tắt đường, đổi cửa sổ thời gian, zoom và trở lại live.
5. Khám phá **Studio** và Search; các chức năng dataset/ML chưa triển khai không tạo kết quả nhận diện.
6. Đóng cửa sổ để dừng worker và local server.

Tài khoản lưu ngoài repo tại `%LOCALAPPDATA%\SmartGlove Dataset Studio\smartglove.sqlite3`. Cập nhật source không xóa tài khoản; không upload database hoặc dữ liệu cá nhân. Xem [xác thực và phân quyền](docs/AUTH_PERSISTENCE.md).

## 4. Development với Vite

Dùng hai terminal, ban đầu đều ở thư mục gốc repo.

Terminal 1:

```powershell
Set-Location app\desktop_collector\web
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Terminal 2:

```powershell
.\.venv\Scripts\python.exe -m app.desktop_collector.shell --dev --vite-origin http://127.0.0.1:5173
```

Dùng đúng `127.0.0.1`, không đổi thành `localhost` hoặc `0.0.0.0`. Shell tạo bridge trên cổng động và thực hiện xác thực; chỉ mở Vite trong trình duyệt không thay thế đầy đủ luồng desktop.

## 5. Kiểm thử và đường lui PySide

Sau setup, từ thư mục gốc:

```powershell
.\.venv\Scripts\python.exe -m pytest
Push-Location app\desktop_collector\web
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
Pop-Location
.\run_app.ps1 -SkipBuild -SmokeTest
.\run_app.ps1 -Legacy -SmokeTest
```

E2E mặc định dùng Edge trên Windows, cần cổng 5173 trống. CI dùng Chromium của Playwright: chạy `npx.cmd playwright install chromium` trong thư mục web và đặt `CI=1`. Smoke xác minh khởi động/tắt hữu hạn, không thay thế review giao diện.

Đường lui PySide6 được giữ:

```powershell
.\run_app.ps1 -Legacy
.\run_app.ps1 -Legacy -NoAutoConnect
```

`-NoAutoConnect` chỉ hỗ trợ PySide; `-SkipBuild` chỉ hỗ trợ React/PyWebView.

## 6. Xử lý lỗi

| Hiện tượng | Cách xử lý |
| --- | --- |
| Thiếu `.venv` hoặc Python sai phiên bản | Kiểm tra `.\.venv\Scripts\python.exe --version`; cài Python 3.12 và dependency vào đúng môi trường. |
| Không tìm thấy npm | Cài Node.js, mở lại terminal, kiểm tra `npm.cmd --version`. |
| Thiếu `vite/client`, Rollup hoặc `node_modules` | Chạy `npm.cmd ci` tại `app\desktop_collector\web`. |
| `-SkipBuild` báo thiếu bundle | Chạy `.\run_app.ps1` để tạo build. |
| Cửa sổ web không mở | Kiểm tra WebView2 Runtime; chạy từ PowerShell để xem lỗi. |
| Development báo lỗi origin/kết nối | Dùng chính xác hai lệnh development và kiểm tra cổng 5173. |
| Đăng nhập nhưng không thấy collector | Kiểm tra role; `participant` có quyền truy cập giới hạn. |

## 7. Cấu trúc source

```text
app/desktop_collector/       Core Python, simulator, auth, bridge và shell
app/desktop_collector/web/   React/Vite và kiểm thử web
app/frontend/desktop/assets/ Asset và giấy phép font
app/frontend/shared/one-ui/  Token và motion CSS dùng chung
configs/gestures.json        Danh mục cử chỉ
tests/                      Kiểm thử Python
docs/                       Tài liệu kỹ thuật
pyproject.toml              Dependency Python
run_app.ps1                 Launcher Windows
```

Repo không chứa APK, patch, backup nén, môi trường Python, `node_modules`, build, ảnh test hoặc dữ liệu người dùng. Build được tạo bằng setup ở trên. Giữ nguyên cấu trúc asset vì React và PySide đều sử dụng các đường dẫn này.

Tài liệu: [kiến trúc](docs/ARCHITECTURE.md), [hợp đồng dữ liệu](docs/DATA_SCHEMA.md), [xác thực](docs/AUTH_PERSISTENCE.md), [nguồn asset](docs/ASSET_INVENTORY.md).
