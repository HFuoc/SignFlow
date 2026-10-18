# Product context

Tài liệu này là nguồn chuẩn cho **ý định sản phẩm** của SmartGlove Dataset Studio.
Chi tiết phần cứng và các quyết định kỹ thuật đã xác nhận vẫn thuộc
[`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md); tiến độ và gate thuộc
[`PROJECT_MILESTONE_TRACKER.md`](../PROJECT_MILESTONE_TRACKER.md); ranh giới triển
khai thuộc [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Bài toán và phạm vi luận đề

SmartGlove là hệ thống hai găng tay cảm biến phục vụ thu thập dữ liệu và nhận diện một
tập cử chỉ/ký hiệu định trước. Luận đề sản phẩm là xây một pipeline có thể kiểm chứng:
thiết bị tạo dữ liệu có nguồn gốc rõ ràng, người vận hành quan sát và ghi nhận được
chất lượng, dữ liệu thô được bảo toàn, và kết quả nhận diện chỉ được công bố khi có
bằng chứng thực nghiệm.

MVP ban đầu hướng tới khoảng 20–30 lớp. Sản phẩm không được mô tả là hệ thống dịch
ngôn ngữ ký hiệu hoàn chỉnh vì chưa bao quát đầy đủ nét mặt, khẩu hình, hướng nhìn và
tư thế toàn thân.

## Năng lực hiện tại

`Implemented now`

- Desktop Collector dùng React/Vite trong PyWebView, với FastAPI bridge chỉ chạy trên
  loopback. `run_app.ps1` build source mới nhất rồi mở giao diện này theo mặc định.
- Device Manager quản lý hai nguồn găng mô phỏng độc lập, kết nối/ngắt kết nối và cấu
  hình seed, sample rate, noise, packet loss.
- Live Monitor hiển thị 13 kênh mỗi tay, sample rate, packet loss, standard deviation,
  peak-to-peak, trạng thái kênh, cửa sổ 5/10/30/60 giây, cursor/zoom và follow-live.
- Pause chỉ dừng cập nhật biểu đồ, không dừng acquisition. Dữ liệu trái/phải được phân
  biệt bằng nhãn `L/R` và nét liền/đứt ngoài màu sắc.
- Light/dark, keyboard focus và reduced-motion được hỗ trợ. PySide được giữ nguyên làm
  đường lui rõ ràng qua `run_app.ps1 -Legacy`.
- P.1 cung cấp SQLite identity persistence, first-run administrator, login/logout,
  server-side session, bốn role, administrator user management và security audit.
- Hiện chỉ có `SimulatorDataSource`; ứng dụng chưa đọc BLE/ESP32 và chưa lưu dataset.

## Một sản phẩm tích hợp, không có Demo Mode

`Confirmed product decision`

Không tồn tại hai chế độ sản phẩm “Production” và “Demo”. Có đúng một sản phẩm được
tích hợp dần; một tính năng chỉ xuất hiện khi workflow thật của nó hoạt động.

Sản phẩm có thể dùng nhiều adapter dữ liệu có mục đích rõ ràng:

- `Simulator` — đã triển khai; công cụ hợp lệ cho developer/researcher, deterministic
  và luôn đánh dấu `simulated=true`.
- `BLE/ESP32 hardware` — planned; nguồn phần cứng thật, chưa triển khai.
- `Recorded Playback` — planned; phát lại dữ liệu đã ghi để chẩn đoán và tái lập, chưa
  triển khai.

Mock và fixture chỉ phục vụ kiểm thử tự động nội bộ. Chúng không được xuất hiện như
một Demo Mode cho người dùng.

## Bề mặt sản phẩm mục tiêu

`Planned`

- **Desktop Collector:** quản lý thiết bị, acquisition, biểu đồ, collection session,
  calibration, dataset và workflow researcher/developer.
- **Android:** ứng dụng APK cho điện thoại và tablet Samsung, có presentation thích ứng
  và native BLE khi đến phase tương ứng.
- **Admin/developer surface:** năng lực quản trị theo vai trò trong bề mặt desktop/web
  phù hợp; không mặc định đây là một sản phẩm tách rời.
- **Design foundation:** nền tảng lấy cảm hứng One UI được chia sẻ ở mức token/pattern,
  trong khi desktop và Android sở hữu presentation phù hợp nền tảng.

## Vai trò sản phẩm

`Confirmed and implemented in P.1`

| Vai trò | Trách nhiệm dự kiến |
| --- | --- |
| Participant | P.1: đăng nhập, account/access-limited và logout; workflow thu thập bị hoãn |
| Researcher | Dùng Device Manager, Live Monitor và simulator/research workflow hiện có |
| Administrator | Dùng collector; quản lý user/role/trạng thái/password reset/session và auth audit |
| Developer | Dùng Device Manager, Live Monitor và simulator; không có user-management mặc định |

Canonical API values là `participant`, `researcher`, `administrator`, `developer`;
backend thực thi quyền, không dựa vào display string hay control bị ẩn.

## Inventory tính năng

| Khu vực | Trạng thái |
| --- | --- |
| Device Manager và Live Monitor bằng Simulator | Implemented now |
| Local identity persistence, authentication và RBAC | Implemented now — P.1 |
| Authentication security audit | Implemented now — P.1 |
| Participant management | Planned — P.3 |
| Collection session và recording workflow | Planned — P.3 |
| Guided calibration | Planned — phase sau P.3, cần refinement |
| History, global search và filters | Planned — P.4 |
| Now Bar và actionable notifications | Implemented — P.2.1; automated suites passed, awaiting visual approval |
| Annotation và dataset review | Planned — phase sau P.3, cần refinement |
| Data-quality scoring và đề xuất ghi lại | Planned — P.8 |
| Device registry và hardware diagnostics | Planned — P.7, cần refinement |
| Product-wide audit/configuration ngoài authentication | Planned — phase sau, cần refinement |
| Dataset health và model registry | Planned — P.8 |
| Live prediction và AI evaluation | Planned — P.8, cần evidence gate |
| Android APK packaging | Planned — P.9 |
| Native Android BLE | Planned — P.10 |

Không mục còn mang nhãn planned nào ở trên được xem là đã triển khai hoặc được phép xuất
hiện dưới dạng destination placeholder.

### Runtime Activity P.2.1

`Implemented; awaiting user visual approval`

- Activity là state RAM-only, tối đa 50 mục; reset theo logout, session invalidation,
  user change và app exit. Không dùng audit log, browser storage hoặc SQLite.
- Now Bar chỉ mô tả telemetry đang nhận, kết nối/resync hoặc pause biểu đồ; không mô tả
  dataset recording/capture chưa tồn tại.
- Action chỉ gọi command path hiện có hoặc điều hướng tới Device Manager/Live Monitor/
  Quick Status/User Management. Không có endpoint mới.
- Notification Center lọc theo role; admin results chỉ dành cho administrator. Snackbar
  là live-announcement surface khi hai nơi cùng biểu diễn một operation result.

## Quy tắc giao hàng tăng dần

- Không thêm destination bị vô hiệu hóa, màn hình rỗng giả hoặc lời hứa “coming soon”.
- Chỉ đưa tính năng vào navigation khi workflow của nó chạy end-to-end.
- Mỗi phase phải có scope và gate riêng; proposal không tự trở thành phê duyệt.
- Simulator, phần cứng và playback phải đi qua cùng contract `DataSource` nhưng giữ
  provenance riêng; không trộn dữ liệu mô phỏng với dữ liệu thật.
- Thay đổi protocol, persistence, authentication, Android native bridge hoặc AI phải
  được triển khai trong phase được duyệt và có tài liệu/test tương ứng.

## Định nghĩa một tính năng functional

Một tính năng được coi là functional khi đồng thời:

1. Mở được một màn hình/workflow thật từ navigation hoặc entry point hợp lệ.
2. Các tương tác chính thực hiện được và có phản hồi rõ ràng.
3. Có trạng thái loading, empty, success và error khi workflow cần các trạng thái đó.
4. Dữ liệu hoặc trạng thái được bảo toàn đúng theo contract và vòng đời sản phẩm.
5. Có kiểm thử tự động phù hợp với rủi ro.
6. Có tài liệu về hành vi, giới hạn và recovery cần thiết.

## Hướng thị giác và design system

React/PyWebView Desktop Collector hiện là reference implementation. Nền tảng dùng
semantic light/dark token, keyboard focus, reduced motion, contrast đọc được và các
pattern lấy cảm hứng One UI nhưng không tuyên bố chứng nhận chính thức của Samsung.
Platform-specific layout được phép khác nhau; chỉ token và logic thực sự độc lập với
presentation mới nên chia sẻ.

Người dùng đã phê duyệt visual D.2.6 Stage 2B.3.1 khi ủy quyền P.1 và phê duyệt cuối
implementation One UI V.2.1/P.1 hiện tại ngày 2026-09-06. Auth, account/admin sheets,
navigation và responsive behavior đã được đại diện trong evidence V.2.1 hiện là visual
baseline; không có yêu cầu refinement bổ sung. Shared One UI, Device Manager, Live Monitor,
shell/navigation/dialog/sheet/feedback và F42/F43/F44 tiếp tục frozen. Human
NVDA/Narrator spoken-output vẫn chưa được xác minh. Phê duyệt này không mở P.2, V.3,
Phase E hoặc M2.

Người dùng sau đó phê duyệt riêng P.2.1 Runtime Activity. Phạm vi này thêm Now Bar và
Notification Center session-only dựa trên tín hiệu runtime/thao tác có thật, không thay đổi
visual baseline được khóa, backend, SQLite, dependency hoặc data-capture contract. P.2.1 đã
được triển khai; targeted/full Playwright đã đạt và còn chờ user visual approval.

## Ràng buộc production

- Desktop shell chỉ bind `127.0.0.1`, chọn port động và giữ session token trong RAM;
  token không vào file, log, URL query, browser storage hay screenshot.
- REST/WebSocket phải xác thực token, Host và Origin trước telemetry; shutdown phải
  đóng nguồn/workers, socket, Uvicorn, shell và giải phóng port.
- Timestamp và sequence độc lập theo thiết bị phải được giữ nguyên.
- Raw capture về sau là append-only trong phiên và bất biến sau finalization; derived,
  calibration, export và review không được ghi đè raw.
- Không công bố độ chính xác, độ trễ, pin hoặc khả năng dịch khi chưa có đo lường.
- Không thêm runtime/dependency ML trước phase AI/inference được phê duyệt.

## Ngoài phạm vi sau P.1

P.1 không triển khai participant collection, raw dataset/session recording, calibration,
history/global search, Now Bar/notification, annotation/review, quality scoring,
model registry/AI, Recorded Playback, BLE, Android/Capacitor hoặc Phase E PySide cleanup.
Acquisition, simulator, sensor protocol và hardware behavior không đổi ngoài authorization
boundary tối thiểu trên API/WebSocket.

## Roadmap sản phẩm ban đầu

Roadmap này là provisional; mỗi phase sau P.0 cần được phê duyệt riêng.

| Product phase | Scope | Recommended model |
| --- | --- | --- |
| P.0 | Launcher and durable context | Sol High |
| P.1 | Local persistence, authentication and RBAC | Sol High |
| P.2 | P.2.1 Runtime Activity implemented; remaining scope TBD | Sol Medium |
| P.3 | Participant/session/recording workflow | Sol High |
| P.4 | History, search and filters | Sol High |
| P.5 | Historical Now Bar/notification proposal; superseded by approved P.2.1 | Superseded |
| P.6 | Quick actions, settings and preferences | Sol Medium |
| P.7 | Admin/developer console | Sol High |
| P.8 | Dataset quality and AI tooling | Sol High |
| P.9 | Android/Capacitor APK foundation | Sol High |
| P.10 | Native Android BLE integration | Sol High |
