# Local persistence, authentication và RBAC

Tài liệu này là contract chuẩn của Product Phase P.1. Phạm vi chỉ gồm identity cục bộ,
phiên người dùng, phân quyền và security audit; đây không phải persistence cho raw dataset
hay collection session.

## Vị trí và vòng đời database

`IdentityRepository` dùng SQLite tại thư mục dữ liệu người dùng của ứng dụng, không nằm
trong Git repository:

- Windows: `%LOCALAPPDATA%\SmartGlove Dataset Studio\smartglove.sqlite3` (fallback
  `%APPDATA%`, rồi thư mục Local trong profile);
- macOS: `~/Library/Application Support/SmartGlove Dataset Studio/smartglove.sqlite3`;
- Linux: `$XDG_DATA_HOME/smartglove-dataset-studio/smartglove.sqlite3`, hoặc
  `~/.local/share/smartglove-dataset-studio/smartglove.sqlite3`;
- test/diagnostic có thể đặt `SMARTGLOVE_USER_DATA_DIR`; đường dẫn nằm trong repository
  vẫn bị từ chối.

Startup bật foreign keys, busy timeout 5 giây, WAL và `synchronous=NORMAL`. Shutdown
checkpoint WAL rồi đóng connection. Mọi write nhiều bước chạy trong transaction; bootstrap,
thay role/trạng thái/mật khẩu và audit tương ứng commit hoặc rollback cùng nhau.

## Schema và migration

`schema_versions(version, applied_at)` ghi migration đã áp dụng. Migration được chạy tuần tự,
idempotent trong `BEGIN IMMEDIATE`; version lạ hoặc migration lỗi làm startup fail đóng với
thông báo đã rút gọn.

Schema version 1:

- `users`: opaque UUID ID, canonical username unique, display name, Argon2id hash, role,
  active flag, must-change-password flag, failed-login/backoff, credential version, UTC
  created/updated/last-login timestamps;
- `user_sessions`: opaque UUID session ID, SHA-256 của credential ngẫu nhiên (không lưu
  credential dùng lại), user foreign key, credential version, UTC created/last-seen,
  absolute/idle expiry, revoked time/reason;
- `audit_events`: opaque UUID ID, type, actor/target foreign keys, success/failure/denied,
  UTC occurrence time và metadata JSON giới hạn;
- index cho lookup session theo user/token hash và audit theo thời gian.

Role canonical duy nhất là `participant`, `researcher`, `administrator`, `developer`.
Username được NFKC, trim và case-fold trước khi kiểm tra unique.

## Mật khẩu

`argon2-cffi` 25.x thực hiện Argon2id với memory 19,456 KiB, time cost 2,
parallelism 1, hash 32 byte và salt riêng 16 byte. Login gọi `check_needs_rehash`, vì vậy
parameter mới có thể nâng cấp hash khi người dùng đăng nhập thành công.

Password-only authentication yêu cầu tối thiểu 12 ký tự và tối đa 1,024 byte UTF-8.
Khoảng trắng, Unicode và passphrase dài được chấp nhận; không có rule bắt buộc chữ hoa,
số hay ký hiệu và không cắt ngầm. API giới hạn input trước hashing. Password/hash không
được trả về frontend, log hoặc audit.

## Bootstrap và session

Khi `users` rỗng, UI chỉ hiện first-run setup. `BEGIN IMMEDIATE` bảo đảm chỉ một request
tạo được administrator đầu tiên; sau commit, endpoint setup luôn trả conflict và UI không
còn mở setup. Không có default credential hay public self-registration. Administrator
được đăng nhập bằng cùng cơ chế session bình thường.

Login phát credential opaque 32-byte ngẫu nhiên; database chỉ giữ hash. Chính sách hiện tại:

- absolute expiry: 8 giờ;
- idle expiry: 30 phút;
- cập nhật last-seen/idle tối đa mỗi 60 giây;
- logout revoke phiên;
- đổi/reset mật khẩu tăng credential version và revoke phiên cũ;
- disable hoặc đổi role quan trọng tăng credential version và revoke phiên;
- từ lần sai thứ năm, backoff theo account tăng lũy tiến và chặn tối đa 300 giây;
- user không tồn tại và password sai có cùng public response, với dummy Argon2 verify để
  giảm chênh lệch timing cơ bản.

Credential người dùng nằm trong cookie session `HttpOnly; SameSite=Strict; Path=/`.
`Secure` không được đặt vì desktop bridge hiện chỉ phục vụ HTTP loopback; đặt cờ đó sẽ làm
cookie không hoạt động trên origin hiện tại. Cookie không có `Max-Age`/`Expires`, và không
đi vào localStorage, sessionStorage, URL hay React state. Remote/mobile transport tương lai
bắt buộc TLS và phải đánh giá lại cookie/persistence policy.

Bridge token và user session là hai identity độc lập:

- bridge token do shell tạo, chỉ ở RAM, được chuyển một lần qua fragment rồi xóa, dùng
  Bearer header và WebSocket first-message authentication;
- cookie user session nhận diện user/role và được server kiểm tra sau bridge boundary.

REST kiểm tra expiry/revocation ở mỗi protected request. WebSocket kiểm tra cả hai lớp khi
handshake và kiểm tra lại user session mỗi giây; logout, reset, disable hoặc đổi role đóng
socket liên quan. Đổi mật khẩu tạo session mới và frontend mở lại telemetry bằng cookie mới.

## RBAC

| Năng lực P.1 | Participant | Researcher | Administrator | Developer |
| --- | ---: | ---: | ---: | ---: |
| Đăng nhập, xem account, đổi mật khẩu, đăng xuất | Có | Có | Có | Có |
| Device Manager, Live Monitor, simulator hiện tại | Không | Có | Có | Có |
| Danh sách/tạo/sửa user | Không | Không | Có | Không |
| Reset password, revoke session, activate/deactivate | Không | Không | Có | Không |
| Xem authentication audit | Không | Không | Có | Không |

Participant nhận màn hình access-limited hoạt động và logout, không nhận collector hay
navigation ẩn mà vẫn focus được. Backend là nguồn quyết định quyền; UI shaping không thay
thế authorization. Transaction chặn việc hạ role/vô hiệu hóa final active administrator.

## Endpoint inventory

Mọi endpoint dưới đây (trừ health) vẫn yêu cầu bridge Bearer token và exact Host/Origin.
Request thay đổi state còn yêu cầu exact Origin.

| Method/path | User-session policy |
| --- | --- |
| `GET /api/v1/auth/status` | Khôi phục session hoặc báo setup/login |
| `POST /api/v1/auth/setup` | Chỉ khi chưa có user |
| `POST /api/v1/auth/login` | Public sau bridge boundary; generic failure |
| `POST /api/v1/auth/logout` | Revoke cookie session nếu có |
| `POST /api/v1/auth/change-password` | Authenticated; được phép khi must-change |
| `GET, POST /api/v1/admin/users` | Administrator |
| `PATCH /api/v1/admin/users/{id}` | Administrator |
| `POST /api/v1/admin/users/{id}/reset-password` | Administrator |
| `POST /api/v1/admin/users/{id}/revoke-sessions` | Administrator |
| `GET /api/v1/admin/audit-events` | Administrator |
| Existing collector REST và `/ws/v1/telemetry` | Researcher/administrator/developer |

## Audit policy

Các event được giữ: bootstrap administrator, login success/failure, logout, user creation,
role change, activation/deactivation, password change/reset, session revocation và denied
privileged action. Metadata chỉ chứa reason/category, action/path, role transition hoặc
session count. Password, session credential, bridge token, Authorization header, raw body,
stack trace và filesystem path không được ghi. API validation và auth errors trả code/message
đã rút gọn.

## Threat model, backup và recovery

P.1 bảo vệ một desktop app trên cùng máy khỏi origin/Host không được phép, request thiếu
bridge capability, user chưa xác thực, CSRF cross-origin, session bị revoke/expired và role
không đủ. Nó không bảo vệ trước administrator hệ điều hành, malware chạy cùng user, database
copy offline hoặc máy đã bị chiếm quyền; không mở remote listener và không coi loopback HTTP
là transport cho thiết bị khác.

Ứng dụng chưa có UI backup/recovery credential. Muốn backup identity, đóng ứng dụng sạch rồi
sao chép `smartglove.sqlite3` từ user-data directory; nếu buộc backup khi đang chạy phải dùng
SQLite backup API, không chỉ copy file chính và bỏ WAL. Restore chỉ thực hiện khi ứng dụng đã
dừng và phải giữ quyền truy cập file ở mức user. Mất toàn bộ administrator credential chưa có
self-service recovery; dùng backup được kiểm soát hoặc một recovery phase được phê duyệt sau.
Database hỏng/không tương thích làm startup fail đóng, không tự xóa hay tạo lại.

Deferred: participant collection, history/search, Now Bar/notification, dataset/annotation,
AI/model registry, Recorded Playback, BLE, Android/Capacitor, remote identity/TLS, MFA,
password reset recovery và Phase E PySide/Qt cleanup.
