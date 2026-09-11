# Product architecture

Tài liệu này mô tả kiến trúc đang tồn tại và ranh giới dự kiến của một sản phẩm tích
hợp. Nhãn `Implemented now`, `Planned` và `Decision pending` là bắt buộc: nội dung
tương lai không được hiểu là code đang có.

Xem ý định sản phẩm tại [`PRODUCT_CONTEXT.md`](PRODUCT_CONTEXT.md), trạng thái phase
tại [`PROJECT_MILESTONE_TRACKER.md`](../PROJECT_MILESTONE_TRACKER.md), và các quyết
định phần cứng/protocol tại [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md).

## Sơ đồ hiện tại

`Implemented now`

```text
SimulatorDataSource (left/right, independent clocks and sequences)
                         │
                         ▼
       framework-neutral acquisition/domain layer
                         │ snapshots/batches
                         ▼
 FastAPI secure loopback bridge (REST + authenticated WebSocket)
             │           │
             │           └─> SQLite identity repository
             │               + AuthService (session/RBAC/audit)
             ▼
 React/Vite presentation inside the PyWebView desktop shell
```

PySide sử dụng cùng acquisition/domain core qua Qt adapter và chỉ còn là đường lui
được gọi rõ ràng bằng `run_app.ps1 -Legacy`.

## Presentation desktop và One UI foundation

`Implemented now`

- React application nằm tại `app/desktop_collector/web/`; Vite build production vào
  `app/desktop_collector/web/build/`.
- Device Manager và Live Monitor sở hữu presentation và interaction hiện tại.
- `app/frontend/shared/one-ui/` chứa token/motion trung lập công nghệ; các component
  React cụ thể nằm trong `app/desktop_collector/web/src/one-ui/`.
- PyWebView sở hữu native desktop window; React không khởi động hardware worker và
  không quản lý port/token.
- `run_app.ps1` kiểm tra Python 3.12, build React theo mặc định rồi khởi động
  `app.desktop_collector.shell`; `-SkipBuild` chỉ dùng lại bundle production hợp lệ.

`Confirmed`

- Người dùng đã duyệt D.2.6 Stage 2B.3.1 trước P.1; shared One UI/component/CSS baseline
  tương ứng đã frozen. Màn hình P.1 chỉ compose/extend anatomy đã duyệt cho consumer thật.

## PyWebView shell

`Implemented now`

`app/desktop_collector/shell.py` sở hữu chọn port động, token phiên trong RAM, startup
FastAPI/Uvicorn, health check, tạo cửa sổ PyWebView và shutdown idempotent. Production
phục vụ bundle cùng origin từ bridge; development chỉ chấp nhận Vite origin loopback
được cấu hình chính xác.

Shell truyền origin và token một lần qua URL fragment. React đọc rồi xóa fragment;
token không được lưu vào local/session storage. Theme preference có thể lưu, nhưng
không phải credential.

## Secure loopback bridge

`Implemented now`

`app/desktop_collector/server/app.py` là adapter FastAPI nhỏ cho bootstrap, device
connect/disconnect, simulator configuration, telemetry snapshot và WebSocket batches.
Business logic và device state thuộc core, không thuộc request handler.

Ranh giới bảo mật hiện tại:

- bind duy nhất `127.0.0.1` trên port động;
- xác thực Bearer token cho protected REST và handshake message cho WebSocket;
- kiểm tra exact `Host` và `Origin`, không wildcard CORS;
- access log tắt để tránh lộ dữ liệu nhạy cảm;
- shutdown xóa secret và dừng acquisition/sockets/server trước khi kết thúc shell.
- P.1 giữ bridge token RAM-only và user-session cookie là hai lớp identity riêng;
  protected REST/WebSocket còn kiểm tra session expiry, credential version và role.

## Domain, acquisition và DataSource

`Implemented now`

- `domain/` định nghĩa model/channel/device/packet không phụ thuộc Qt, FastAPI,
  PyWebView hay React.
- `sources/base.py` định nghĩa contract `DataSource`.
- `acquisition.py` sở hữu worker theo nguồn, buffer giới hạn, snapshot và statistics;
  blocking read không chạy trên UI thread hoặc request handler.
- Mỗi thiết bị giữ sequence/timestamp riêng. Batch truyền provenance `simulated` và
  không biến missing channel thành zero.
- `SimulatorDataSource` là adapter duy nhất hiện có, deterministic theo seed và hỗ trợ
  noise/packet loss.

`Planned`

- `BLE/ESP32 DataSource`: adapter phần cứng thật, chỉ được thêm sau hardware/protocol
  gate; không sao chép parsing hoặc channel metadata.
- `Recorded Playback DataSource`: phát lại record có provenance và timing rõ ràng để
  chẩn đoán/tái lập; không giả thành thiết bị thật.

`Decision pending`

- Contract version cuối cho BLE, packet framing/CRC, chính sách timing playback và cách
  chọn adapter trong workflow thật.

## Persistence boundary

`Implemented now`

P.1 thêm `persistence.py` sở hữu SQLite identity database ngoài repository, schema version,
migration idempotent, foreign keys, WAL, transaction và clean shutdown. `auth.py` sở hữu
password/session/RBAC; FastAPI và React không chạy raw SQL. Schema thực tế, đường dẫn,
backup và recovery được khóa tại [`AUTH_PERSISTENCE.md`](AUTH_PERSISTENCE.md).

`Planned`

Raw capture persistence vẫn chưa triển khai. Phase được duyệt sau phải ghi một packet
trên một raw record, hỗ trợ recovery, không reopen/overwrite session đã finalized và
giữ derived data tách biệt.

`Decision pending`

- Raw dataset format, capture transaction/finalization boundary, retention và dataset
  backup/recovery chi tiết.

## Authentication và RBAC boundary

`Implemented now`

P.1 đặt authentication/authorization trước collector REST/WebSocket và admin API.
Bốn role canonical là `participant`, `researcher`, `administrator`, `developer`.
Authorization được kiểm tra ở service/API boundary; UI chỉ shape navigation/screen.
Argon2id, opaque hashed server sessions, first-admin bootstrap, backoff, revocation,
must-change-password, final-admin protection và audit đã được triển khai.

`Decision pending`

- MFA, external/remote identity, administrator credential recovery và mobile/TLS session
  policy.

RAM bridge token chỉ bảo vệ transport loopback; nó không phải user session. User session
là cookie HttpOnly/SameSite riêng và không thay thế bridge token.

## Android/Capacitor direction

`Planned`

- P.9 thiết lập Android/Capacitor APK foundation và presentation Android phù hợp điện
  thoại/tablet Samsung.
- P.10 thêm native Android BLE bridge sau khi protocol và hardware workflow ổn định.
- Android dùng chung domain contract, schema, validation và logic TypeScript thật sự
  độc lập presentation khi có test cho cả hai platform.

`Implemented now`

Các file `app/frontend/mobile/` và `app/frontend/desktop/` hiện là source/reference được
bảo vệ; chúng không chứng minh Capacitor, APK hoặc native BLE đã tồn tại.

`Decision pending`

- Cấu trúc package Capacitor, navigation Android, storage/native permission model,
  BLE lifecycle, background behavior và mức code sharing cuối cùng.

## Kỳ vọng chia sẻ code

`Implemented now`

- Python domain/acquisition không phụ thuộc presentation.
- Channel metadata và simulator behavior có một nguồn contract phía core/bridge.
- Shared One UI chỉ chứa token/motion trung lập; React component ở đúng consumer.

`Planned`

- Chia sẻ schema, validation, API client và domain rule có test giữa desktop/Android.
- Giữ window chrome, responsive layout, accessibility interaction và native bridge là
  ownership riêng theo platform.

Không hợp nhất presentation desktop/mobile chỉ để giảm số file, và không nhân bản
protocol/parsing ở Python, React, Android, firmware hoặc simulator.

## Data flow tương lai

`Planned`

```text
BLE/ESP32 ─┐
Simulator ─┼─> DataSource ─> acquisition ─> persistence/session services
Playback  ─┘                         │                    │
                                    ├─> live telemetry   ├─> review/export
                                    └─> diagnostics      └─> quality/AI tooling
```

Authentication/RBAC bao quanh các service/API cần quyền. Presentation chỉ gọi contract
được cấp; không trực tiếp sở hữu raw files, database transaction hoặc device thread.

## Ownership theo nền tảng

| Thành phần | Ownership | Trạng thái |
| --- | --- | --- |
| Sensor/device models, source contract, acquisition | Python core | Implemented now |
| Simulator adapter | Python source layer | Implemented now |
| BLE và Recorded Playback adapters | Python/native adapter boundary | Planned |
| REST/WebSocket local bridge | FastAPI server adapter | Implemented now |
| Port, token, native window, shutdown | PyWebView shell | Implemented now |
| Desktop screens/interactions | React desktop application | Implemented now |
| Semantic visual tokens/motion | Shared One UI foundation | Implemented now |
| Identity persistence and user-session services | Core/service boundary | Implemented now — P.1 |
| Authentication/RBAC and security audit | Service/API boundary | Implemented now — P.1 |
| Raw dataset/session persistence | Core/service boundary | Planned |
| Android UI and lifecycle | Android/Capacitor application | Planned |
| Android BLE permissions/transport | Native Android bridge | Planned |
| Model training/inference/evaluation | Dedicated data/AI boundary | Planned; evidence-gated |
