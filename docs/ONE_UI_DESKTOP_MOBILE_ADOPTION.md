# One UI adoption guide

> 2026-09-09: Stage1 Device Manager fidelity is governed by
> [ONE_UI_DESIGN_RULES.md](ONE_UI_DESIGN_RULES.md). The user designates the current
> Figma draft authoritative and unfreezes necessary visual geometry. Historical
> reference precedence, near-black primary, typography and frozen dimensions below
> are superseded for that screen only. Protected assets, behavior and rollout gates
> remain unchanged. V.3's anchored Now Bar contract supersedes the old inline wording.

Tài liệu này phân định cách dùng shared One UI foundation giữa React collector và hai prototype user-owned. Nó là hướng dẫn migration, không cấp quyền sửa `app/frontend/desktop/` hoặc `app/frontend/mobile/` trong Phase D.2.1.

| Pattern | Collector | Desktop app | Mobile app |
| --- | --- | --- | --- |
| Tokens | dùng ngay | dùng trong migration sau | dùng trong migration sau |
| Bottom taskbar | có | có thể áp dụng | không áp dụng trực tiếp |
| Mobile bottom navigation | không | không | áp dụng |
| Quick Status | collector status | desktop system/status | mobile sheet/quick panel |
| Large cards | có chọn lọc | có | có |
| Chart density | ưu tiên cao | tùy module | bản rút gọn |

## Ranh giới áp dụng

- React collector dùng trực tiếp `app/frontend/shared/one-ui/tokens.css` và `motion.css` qua alias `@one-ui-shared`.
- Collector dùng bottom taskbar theo ngữ cảnh Desktop/DeX, nhưng vẫn là công cụ thu thập dữ liệu cảm biến, không mô phỏng hệ điều hành hoặc wallpaper.
- Quick Status chỉ tổng hợp bridge, phiên xác thực an toàn, hai găng, sample rate, simulator và theme từ state hiện có. Token phiên không được hiển thị hoặc lưu.
- Desktop/mobile prototype hiện chỉ là design reference. Migration của từng app phải có audit và phê duyệt riêng; không copy shell collector sang mobile.
- Master SVG trong `.design-cache/one-ui/` là design reference bị Git ignore, không phải production asset.

## Production asset rule

Chỉ dùng SVG/font local có provenance trong `app/frontend/desktop/assets/`. Không sửa, trace, chuyển đổi hoặc nhân bản asset nguồn. Nếu pattern có thể biểu diễn bằng token và CSS (surface, radius, spacing, elevation, focus, motion), không tạo thêm ảnh.

## Chuẩn V.2 cho collector

Thứ tự nguồn quyết định là: hướng dẫn One UI chính thức đã ghi trong audit V.1 →
quyết định sản phẩm và hình học đã được duyệt → semantic token dùng chung → primitive
React → CSS cục bộ của bề mặt. Figma Community chỉ hỗ trợ tỷ lệ/anatomy; không phải
nguồn để sao chép asset hoặc tuyên bố parity/certification.

### Token, typography và spacing

- Surface dùng vai trò `base/canvas`, `focus`, `raised`, `muted`, `selected`,
  `pressed`, `disabled`, `related-overlay`, `blocking-overlay` và `inverse`.
- Content dùng mức high/medium/on-inverse; status dùng positive/warning/negative với
  foreground/background riêng. Màu xanh/cam của hai găng vẫn đi cùng chữ `L/R` và
  đường liền/nét đứt, không chỉ dựa vào màu.
- Giữ nhịp spacing bội số 4px và radius hiện hành. Không biến mọi control thành pill,
  không thêm card lồng hoặc shadow cho block tĩnh.
- Chữ body giữ line-height phù hợp dấu tiếng Việt. Helper/actionable text thường 12px;
  nội dung quan trọng không dưới 11px. Không dùng clipping để che thông điệp cần đọc.
- Primary vẫn là near-black/inverse; secondary, quiet và destructive phải phản ánh
  đúng ngữ nghĩa, với một dominant action cho mỗi tác vụ.

### Depth và trạng thái component

- Sheet có quan hệ ngữ cảnh (Quick Status, Account, Tạo/Sửa tài khoản) dùng bề
  mặt opaque và đúng một soft shadow; không backdrop blur và không visible scrim.
  Hit area ngoài sheet vẫn tồn tại để dismiss.
- Dialog blocking dùng bề mặt opaque và dim trung tính khoảng 32%; không blur hoặc
  heavy shadow chồng lớp. Giữ action row hai vùng 48px, divider và safe default.
- Card thiết bị, chart, user row và focus block tĩnh dựa vào surface/border, không dùng
  elevation giả. Floating chart command chỉ có separation nhẹ và không đổi kích thước.
- Mọi primitive phải thể hiện default, hover, pressed, focus-visible, selected,
  disabled, pending, success, warning, failure và destructive bằng text/shape/state
  phù hợp; truth không được trì hoãn bởi animation.
- P.2.1 đặt Now Bar trong một activity lane có allocation riêng ngay dưới Top App Bar.
  Bar là nội dung trong flow, không phải fixed/floating overlay; vùng nội dung chỉ dịch
  xuống khi có activity. Rail/bottom navigation, card, plot và overlay actions không
  được bị che. Đây là adaptation theo hierarchy của Live Activity/notification, không
  phải bản sao literal của component điện thoại.

### Icon contract

Chỉ chỉnh icon do sản phẩm sở hữu. Kích thước quang học: 18px cho supporting icon,
20px cho control chuẩn và 24px cho navigation/prominent action; stroke biểu kiến khoảng
1.8, slot ổn định, tâm/baseline nhất quán. Không thêm thư viện icon, Unicode glyph thay
thế tùy tiện, Samsung proprietary icon hoặc rounded-square initials logo. Toàn ứng dụng
chỉ có một theme control.

### Viết và thuật ngữ

P.2.1 dùng hybrid có kiểm soát: tên bề mặt, navigation và thuật ngữ sản phẩm/kỹ thuật
ngắn dùng English; hướng dẫn, trạng thái nghiệp vụ, cảnh báo, xác nhận và recovery
action thông thường tiếp tục dùng tiếng Việt. Không dịch ngẫu hứng từng chuỗi hoặc
chuyển toàn bộ ứng dụng sang English. Quyết định này thay thế quy tắc Vietnamese-first
cũ chỉ cho các bề mặt/thuật ngữ liệt kê dưới đây; phần visual/geometry V.2 vẫn frozen.

| Trước correction | Copy đã duyệt |
| --- | --- |
| `Quản lý thiết bị` / `Thiết bị` | `Device Manager` / `Devices` |
| `Theo dõi trực tiếp` / `Theo dõi` | `Live Monitor` / `Monitor` |
| `Tài khoản` / `Trạng thái nhanh` | `Account` / `Quick Status` |
| `Cầu nối sẵn sàng` / `2/2 nguồn mô phỏng` | `Bridge online` / `SIM 2/2` |
| `Đang nhận dữ liệu cảm biến` | `Live telemetry` |
| `Thu nhận dữ liệu` / `Tần số lấy mẫu TB` / `Tổng tần số lấy mẫu` | `Acquisition` / `Avg. sample rate` / `Total sample rate` |
| `Gói đã nhận` (hoặc `Mẫu nhận`/`Gói nhận`) / `Gói bị mất` (hoặc `Mẫu mất`/`Gói mất`) / `Gói mới nhất` | `Packets received` / `Packets lost` / `Latest packet` |
| `Tín hiệu thô` / `Trực tiếp` | `Raw signals` / `Live` |
| `Hoạt động trong phiên` (hoặc `Thông báo phiên`) / `Trung tâm thông báo` / `Quản lý thông báo` | `Session activity` / `Notifications` / `Notification management` |
| `{n} chưa đọc` / `Đọc tất cả` (hoặc `Đánh dấu tất cả đã đọc`) / `Xóa mục đã đọc` | `{n} unread` / `Mark all read` / `Clear read` |
| `Đánh dấu đã đọc` / `Loại bỏ` | `Mark as read` / `Dismiss` |

Giữ `Dataset Studio`, SI units, sensor/channel/hardware/protocol identifiers, BLE,
WebSocket và canonical role/database enum khi giá trị kỹ thuật cần chính xác. Các thuật
ngữ cảm biến như `Gia tốc`, `Con quay`, `Khoảng cách` và role explanations vẫn có thể
dùng tiếng Việt trong nội dung hướng dẫn.

Lỗi đăng nhập phải generic; validation phải actionable nhưng không lộ enumeration.
Xác nhận phá hủy dùng câu hỏi rõ ràng và nói hậu quả trước action. Restricted-access
copy nói quyền hiện tại, việc có thể làm và next action hợp lệ, không lộ phase hoặc hứa
workflow chưa triển khai. Snackbar ngắn gọn, không đổ lỗi người dùng.

### Feedback và accessibility

- Success không thiết yếu có thể là toast `status`, polite, không lấy focus và tự đóng.
- Feedback có recovery dùng snackbar với action chữ nhìn thấy, dismiss accessible,
  keyboard reachability, pause timer khi hover/focus và replacement xác định.
- Failure/critical/decision feedback dùng `alert`, inline state hoặc dialog persistent;
  không để security/acquisition truth chỉ tồn tại trong toast hẹn giờ.
- Ưu tiên native semantics; ARIA label trên generic element phải có role phù hợp. Axe
  cần chạy all severity và mọi `incomplete` phải được điều tra, không được gọi là pass.
- Forced colors dùng system colors có phạm vi hẹp; focus/border/error/selected và L/R
  vẫn phân biệt. Real screen-reader acceptance vẫn là gate riêng, NVDA trước và Narrator
  sau; không suy diễn từ axe thành AT pass.

### Motion và reduced motion

Token duration do sản phẩm điều chỉnh: minimum visible 100ms, fast 140ms, standard
240ms, deliberate 360ms. Transform dùng Basic Path
`cubic-bezier(0.22, 0.25, 0, 1)`; opacity có easing vào/ra theo hướng. Đây là token
adaptation của sản phẩm, không tuyên bố là numeric token chính thức của Samsung.

Sheet, dialog và snackbar dùng lifecycle `closed → opening → open → closing`; exit
hoàn tất trước unmount trong normal motion, có bounded fallback, xử lý rapid reversal và
không nhân listener/timer. Focus chỉ restore sau khi overlay đóng. Underlying page,
telemetry, timestamp, packet loss, connection/RBAC truth, chart dimensions và
pause/resume geometry không animate.

V.2.1: sheet ngữ cảnh mount trong render của activation, không chờ API/effect/frame
để xuất hiện; first frame opaque, modal/focus sẵn sàng trong layout effect. Opening
chỉ settle 6px trong 100ms theo Basic Path; reduced motion không travel. Timer opening
chỉ kết thúc trạng thái settle đã hiển thị, không trì hoãn mount hay tương tác. Exit
giữ lifecycle V.2. Account/Quick Status dùng state hiện có; Create/Edit dùng form/record
cục bộ. Blocking dialog vẫn giữ motion hiện hành, dùng chung modal-focus readiness.

Auth giữ composition V.2 và solid canvas; pseudo-element trang trí khôi phục gradient
V.1 `circle at 82% 18%`, accent 10%, fade tới 32rem. Không pointer, animation, asset,
blur hay layout contribution. Axe có thể báo contrast incomplete do pseudo-element;
phải giữ báo cáo và kiểm tra foreground trên toàn dải màu thực tế, không bỏ rule.

Với `prefers-reduced-motion: reduce`, duration là 0.01ms/equivalent, bỏ travel/scale và
staged delay nhưng vẫn giữ completion/error state, focus timing và semantic truth.

### Responsive và quy tắc mở rộng

V.2 không thay global responsive contract: Top App Bar 76px; chart đổi cột tại đúng
900px; rail đổi tại đúng 1260px; effective-200% dùng shell/navigation hiện hành. Giữ
rail 88px, bottom navigation 358×62, device/chart/simulator outer allocation và chart
command group 209×60 (restore 88×48, pause/resume 107×48).

User xác nhận target rail **54×62px**, icon **24px**, ngày 2026-09-05. Giá trị 54×50
trong brief V.2.1 là lỗi specification, không cấp quyền thay geometry. Nhãn được dùng
tối đa 70px bên trong rail 88px, căn giữa, không ellipsis hoặc tràn vùng nhãn; vị trí
destination và hit target giữ nguyên.

Auth/admin chỉ được dùng local capacity/grid rules: auth hai vùng ở desktop và một cột
ở compact; admin dùng workspace + audit ở rộng và stack theo DOM order ở hẹp. Phase
sau muốn đổi F42/F43/F44 hoặc geometry đóng băng phải có visual/responsive pass và phê
duyệt riêng; không lén sửa qua component-local override.
